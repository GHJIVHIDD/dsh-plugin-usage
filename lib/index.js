/**
 * Host loader entry for the deployment-level Usage plugin.
 *
 * Adds a "用量" (Usage) tab to the DeepSeek Harness conversation view.
 * The host half:
 *   - collects per-session model usage (input / output / cache-hit /
 *     cache-write / reasoning tokens) from committed `assistant/message`
 *     events and from live `llm/stream` waterfalls (real-time estimates
 *     replaced by exact usage when the adapter reports it);
 *   - rebuilds historical usage from the persisted session log on first
 *     request (seq-level deduplication against live collection);
 *   - prices every call with two built-in rate cards — DeepSeek official
 *     peak/off-peak prices (CNY per 1M tokens, Beijing time) and the
 *     OpenCode Go plan prices (USD per 1M tokens + monthly quota) — plus a
 *     user-editable custom price table persisted to
 *     `<workspaceRoot>/.dsh-usage-prices.json`;
 *   - serves /usage-api/* JSON routes for the client, and one-shot
 *     /usage-export-* routes for CSV/JSON downloads.
 *
 * Privacy notes:
 *   - No API keys, credentials or machine paths are read, logged or stored;
 *     only session usage numbers are kept in memory.
 *   - The custom price file stores prices only (no tokens, no keys).
 */

const MAX_CALLS = 800
const EXPORT_TTL_MS = 60_000
const STALE_LIVE_MS = 10 * 60_000
const QUOTA_TTL_MS = 30_000
const QUOTA_URL = 'https://opencode.ai/zen/go/v1/usage'

// ---------------------------------------------------------------------------
// Built-in price cards (per 1M tokens)
// ---------------------------------------------------------------------------

// OpenCode Go plan internal prices (USD / 1M tokens) + monthly quota (USD).
// Source: opencode.ai/docs/go (plan: $10/month, roughly 6x usage value).
// DeepSeek models are billed in two tiers — off-peak and peak (2x off-peak) —
// following the same Beijing-time peak hours as the official card.
const GO = {
  'deepseek-v4-pro': { off: { in: 0.66, out: 1.98, cache: 0.022 }, peak: { in: 1.32, out: 3.96, cache: 0.044 }, quota: 15 },
  'deepseek-v4-flash': { off: { in: 0.22, out: 0.66, cache: 0.007 }, peak: { in: 0.44, out: 1.32, cache: 0.014 }, quota: 15 },
  'grok-4-5': { in: 2, out: 6, cache: 0.3, quota: 15 },
  'gpt-5-6-luna': { in: 0.2, out: 1.2, cache: 0.02, cacheWrite: 0.25, quota: 15 },
  'glm-5-3': { in: 1.4, out: 4.4, cache: 0.26, quota: 15 },
  'glm-5-2': { in: 1.4, out: 4.4, cache: 0.26, quota: 60 },
  'glm-5-1': { in: 1.4, out: 4.4, cache: 0.26, quota: 60 },
  'kimi-k3': { in: 3, out: 15, cache: 0.3, quota: 15 },
  'kimi-k2-7-code': { in: 0.95, out: 4, cache: 0.19, quota: 60 },
  'kimi-k2-6': { in: 0.95, out: 4, cache: 0.16, quota: 60 },
  'mimo-v2-5': { in: 0.14, out: 0.28, cache: 0.0028, quota: 60 },
  'mimo-v2-5-pro': { in: 0.435, out: 0.87, cache: 0.003625, quota: 15 },
  'minimax-m3': { in: 0.3, out: 1.2, cache: 0.06, quota: 60 },
  'minimax-m2-7': { in: 0.3, out: 1.2, cache: 0.06, cacheWrite: 0.375, quota: 60 },
  'minimax-m2-5': { in: 0.3, out: 1.2, cache: 0.06, cacheWrite: 0.375, quota: 60 },
  'qwen3-8-max': { in: 2, out: 6, cache: 0.25, cacheWrite: 2.5, quota: 15 },
  'qwen3-7-max': { in: 2.5, out: 7.5, cache: 0.5, cacheWrite: 3.125, quota: 60 },
  'qwen3-7-plus': { in: 0.4, out: 1.6, cache: 0.04, cacheWrite: 0.5, quota: 60 },
  'qwen3-6-plus': { in: 0.5, out: 3, cache: 0.05, cacheWrite: 0.625, quota: 60 },
  'hy3': { in: 0.14, out: 0.58, cache: 0.035, quota: 60 },
}

// DeepSeek official prices (CNY / 1M tokens, effective 2026-08-17).
// Peak hours are Beijing time 09:00-12:00 and 14:00-18:00 (2x off-peak).
const OFF = {
  'deepseek-v4-pro': { peak: { in: 9, cache: 0.3, out: 27 }, off: { in: 4.5, cache: 0.15, out: 13.5 } },
  'deepseek-v4-flash': { peak: { in: 3, cache: 0.1, out: 9 }, off: { in: 1.5, cache: 0.05, out: 4.5 } },
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normModel(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

function isPeakAt(ms) {
  const h = (new Date(ms).getUTCHours() + 8) % 24
  return (h >= 9 && h < 12) || (h >= 14 && h < 18)
}

function num(v) {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0
}

function cleanNum(v) {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}

// ---------------------------------------------------------------------------
// OpenCode Go official account quota (opencode.ai/zen/go/v1/usage)
// ---------------------------------------------------------------------------

// The API key is read from the environment only — never stored, logged or
// written to disk. DSH_OPENCODE_GO_KEY takes precedence; DEEPSEEK_API_KEY is
// the fallback (the default credential env of the deepseek provider, which is
// the same key when that provider points at the OpenCode Go gateway).
function opencodeKey() {
  return (process.env && process.env.DSH_OPENCODE_GO_KEY) || (process.env && process.env.DEEPSEEK_API_KEY) || ''
}

function quotaWindow(u, name) {
  const w = u && u[name]
  return {
    name,
    percent: w && typeof w.percent === 'number' ? w.percent : null,
    resetsAt: w && typeof w.resetsAt === 'string' ? w.resetsAt : null,
  }
}

const quotaCache = { value: null, at: 0 }

async function fetchOfficialQuota() {
  const now = Date.now()
  if (quotaCache.value && now - quotaCache.at < QUOTA_TTL_MS) return quotaCache.value
  const key = opencodeKey()
  if (!key) {
    quotaCache.value = { status: 'missing-key', error: null, windows: [], cachedAt: now }
    quotaCache.at = now
    return quotaCache.value
  }
  let value
  try {
    const res = await fetch(QUOTA_URL, {
      headers: { Authorization: 'Bearer ' + key },
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) {
      value = { status: 'error', error: 'HTTP ' + res.status, windows: [], cachedAt: now }
    } else {
      const data = await res.json()
      const u = data && typeof data === 'object' ? data.usage : null
      value = {
        status: 'ok',
        error: null,
        windows: [
          quotaWindow(u, 'rolling'),
          quotaWindow(u, 'weekly'),
          quotaWindow(u, 'monthly'),
        ],
        cachedAt: now,
      }
    }
  } catch (error) {
    value = { status: 'error', error: 'network', windows: [], cachedAt: now }
  }
  quotaCache.value = value
  quotaCache.at = now
  return value
}

function getQuery(req) {
  return new URL(req.url || '/', 'http://localhost').searchParams
}

function respond(res, obj) {
  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(obj))
}

function readBody(req) {
  return new Promise((resolvePromise) => {
    let body = ''
    let done = false
    req.on('data', (chunk) => {
      if (done) return
      body += String(chunk)
      if (body.length > 1_000_000) {
        done = true
        req.destroy()
        resolvePromise({})
      }
    })
    req.on('end', () => {
      if (done) return
      done = true
      try {
        resolvePromise(body ? JSON.parse(body) : {})
      } catch (err) {
        resolvePromise({})
      }
    })
    req.on('error', () => {
      if (!done) {
        done = true
        resolvePromise({})
      }
    })
  })
}

// ---------------------------------------------------------------------------
// Plugin body
// ---------------------------------------------------------------------------

function apply(ctx) {
  const buckets = new Map()
  const loading = new Set()
  const mode = { value: 'auto' }
  const custom = {} // { modelKey: { name?, official?: {peak,off}, go?: {...} } }

  function bucket(sid) {
    let b = buckets.get(sid)
    if (!b) {
      b = { calls: [], seqs: new Set(), loadedSeqs: new Set(), requested: false, nextId: 1 }
      buckets.set(sid, b)
    }
    return b
  }

  function goPrice(key) {
    return (custom[key] && custom[key].go) || GO[key] || null
  }

  function offPrice(key) {
    return (custom[key] && custom[key].official) || OFF[key] || null
  }

  function priceOf(model, usage, t) {
    const key = normModel(model)
    const go = goPrice(key)
    const off = offPrice(key)
    const goPeakable = !!(go && go.peak && go.off)
    const peak = off || goPeakable ? isPeakAt(t) : false
    const input = num(usage.inputTokens)
    const cacheRead = num(usage.cacheReadTokens)
    const cacheWrite = num(usage.cacheWriteTokens)
    const output = num(usage.outputTokens)
    let goCost = null
    if (go) {
      // DeepSeek plan models carry { off, peak } tiers; other models a flat card.
      const g = goPeakable ? go[peak ? 'peak' : 'off'] : go
      goCost = (input * num(g.in) + cacheRead * num(g.cache) + cacheWrite * num(g.cacheWrite != null ? g.cacheWrite : g.cache) + output * num(g.out)) / 1e6
    }
    const offCost = off
      ? (input * num(off[peak ? 'peak' : 'off'].in) + cacheRead * num(off[peak ? 'peak' : 'off'].cache) + output * num(off[peak ? 'peak' : 'off'].out)) / 1e6
      : null
    return { go: goCost, goQuota: go && num(go.quota) > 0 ? num(go.quota) : null, off: offCost, peak }
  }

  function callUsage(c) {
    return {
      inputTokens: c.input,
      outputTokens: c.output,
      cacheReadTokens: c.cacheRead,
      cacheWriteTokens: c.cacheWrite,
    }
  }

  function addCall(sid, event) {
    const data = event && event.data
    if (!data || !data.usage || !data.message) return
    const src = data.message.source || {}
    const usage = data.usage
    const t = typeof event.time === 'number' ? event.time : Date.now()
    const b = bucket(sid)
    b.calls.push({
      id: b.nextId++,
      t,
      tEnd: t,
      model: String(src.model || 'unknown'),
      provider: String(src.provider || ''),
      input: num(usage.inputTokens),
      output: num(usage.outputTokens),
      cacheRead: num(usage.cacheReadTokens),
      cacheWrite: num(usage.cacheWriteTokens),
      reasoning: num(usage.reasoningTokens),
      status: 'done',
      live: false,
    })
    if (b.calls.length > MAX_CALLS) b.calls.splice(0, b.calls.length - MAX_CALLS)
  }

  // ---------- Live collection: wrap every streaming model call ----------

  function startLive(sid, model, provider, startT) {
    const b = bucket(sid)
    const rec = {
      id: b.nextId++,
      t: startT,
      tEnd: 0,
      model,
      provider,
      input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0,
      status: 'running',
      live: true,
    }
    b.calls.push(rec)
    if (b.calls.length > MAX_CALLS) b.calls.splice(0, b.calls.length - MAX_CALLS)
    return rec.id
  }

  function updateLive(sid, id, patch) {
    const b = buckets.get(sid)
    if (!b) return
    for (let i = b.calls.length - 1; i >= 0; i--) {
      const c = b.calls[i]
      if (c.id === id) {
        if (patch.output != null) c.output = patch.output
        if (patch.reasoning != null) c.reasoning = patch.reasoning
        if (patch.input != null) c.input = patch.input
        if (patch.cacheRead != null) c.cacheRead = patch.cacheRead
        if (patch.cacheWrite != null) c.cacheWrite = patch.cacheWrite
        return
      }
    }
  }

  function finishLive(sid, id, tEnd) {
    const b = buckets.get(sid)
    if (!b) return
    for (let i = b.calls.length - 1; i >= 0; i--) {
      const c = b.calls[i]
      if (c.id === id) {
        c.tEnd = tEnd
        if (c.status === 'running') c.status = 'done'
        return
      }
    }
  }

  // When an assistant/message commits, finalize the matching live record with
  // the exact usage (avoid estimation residue and duplicate entries).
  function finalizeLive(sid, event) {
    const b = buckets.get(sid)
    if (!b) return false
    const data = event && event.data
    if (!data || !data.message) return false
    const model = String((data.message.source && data.message.source.model) || 'unknown')
    const t = typeof event.time === 'number' ? event.time : Date.now()
    for (let i = b.calls.length - 1; i >= 0; i--) {
      const c = b.calls[i]
      const end = c.tEnd || c.t
      if (c.live && c.status === 'running' && c.model === model && t >= end && t - end < 15000) {
        if (data.usage) {
          c.input = num(data.usage.inputTokens)
          c.output = num(data.usage.outputTokens)
          c.cacheRead = num(data.usage.cacheReadTokens)
          c.cacheWrite = num(data.usage.cacheWriteTokens)
          c.reasoning = num(data.usage.reasoningTokens)
        }
        c.tEnd = t
        c.status = 'done'
        return true
      }
    }
    return false
  }

  function sweepStale(b) {
    const now = Date.now()
    for (const c of b.calls) {
      if (c.status === 'running' && now - (c.tEnd || c.t) > STALE_LIVE_MS) c.status = 'done'
    }
  }

  ctx.on('llm/stream', (options, next) => {
    const stream = next()
    const sid = options && typeof options.sessionId === 'string' ? options.sessionId : ''
    if (!sid) {
      return stream
    }
    const model = String((options && options.model) || 'unknown')
    const provider = String((options && options.provider) || '')
    const startT = Date.now()
    const liveId = startLive(sid, model, provider, startT)
    let estChars = 0
    let reasonChars = 0
    return (async function* () {
      try {
        for await (const chunk of stream) {
          if (chunk && chunk.type === 'text-delta' && typeof chunk.text === 'string') {
            estChars += chunk.text.length
            updateLive(sid, liveId, { output: Math.floor((estChars + reasonChars) / 3) })
          } else if (chunk && chunk.type === 'reasoning-delta' && typeof chunk.text === 'string') {
            reasonChars += chunk.text.length
            updateLive(sid, liveId, { output: Math.floor((estChars + reasonChars) / 3), reasoning: Math.floor(reasonChars / 3) })
          } else if (chunk && chunk.type === 'usage' && chunk.usage) {
            updateLive(sid, liveId, {
              input: num(chunk.usage.inputTokens),
              output: num(chunk.usage.outputTokens),
              cacheRead: num(chunk.usage.cacheReadTokens),
              cacheWrite: num(chunk.usage.cacheWriteTokens),
              reasoning: num(chunk.usage.reasoningTokens),
            })
          }
          yield chunk
        }
        finishLive(sid, liveId, Date.now())
      } catch (error) {
        finishLive(sid, liveId, Date.now())
        throw error
      }
    })()
  })

  // Incremental commits: finalize a matching live record first, otherwise
  // follow the normal seq-deduplicated path.
  ctx.on('session/event', (session, event) => {
    if (!session || !event || event.type !== 'assistant/message') return
    const b = bucket(session.id)
    if (finalizeLive(session.id, event)) {
      b.seqs.add(event.seq)
      return
    }
    if (b.loadedSeqs.has(event.seq) || b.seqs.has(event.seq)) return
    b.seqs.add(event.seq)
    addCall(session.id, event)
  })

  // Preload: rebuild historical usage from the persisted log (bidirectional
  // seq dedup against live collection).
  async function preload(sid) {
    if (loading.has(sid)) return
    loading.add(sid)
    try {
      const q = ctx.get('sessionQuery')
      if (!q) return
      const snap = await q.readSession(sid)
      const b = bucket(sid)
      const events = (snap && snap.events) || []
      for (const event of events) {
        if (!event || event.type !== 'assistant/message') continue
        if (b.seqs.has(event.seq) || b.loadedSeqs.has(event.seq)) continue
        b.loadedSeqs.add(event.seq)
        addCall(sid, event)
      }
    } catch (error) {
      // The log may be absent or unreadable; live collection still works.
    } finally {
      loading.delete(sid)
    }
  }

  // Aggregate with dynamic pricing: every read re-prices from the current
  // price table, so custom price edits immediately affect historical costs.
  function aggregate(sid) {
    const b = bucket(sid)
    sweepStale(b)
    const totals = {
      input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0,
      calls: b.calls.length, running: 0, goCost: 0, offCost: 0,
    }
    // Per-model plan quota accounting: each OpenCode Go model has its own
    // monthly quota, so consumption must be grouped by model (summing all
    // models against one quota would be wrong).
    const goByModel = new Map()
    let lastModel = null
    let lastProvider = null
    let lastT = 0
    for (const c of b.calls) {
      totals.input += c.input
      totals.output += c.output
      totals.cacheRead += c.cacheRead
      totals.cacheWrite += c.cacheWrite
      totals.reasoning += c.reasoning
      if (c.status === 'running') totals.running += 1
      const p = priceOf(c.model, callUsage(c), c.t)
      if (typeof p.go === 'number' && Number.isFinite(p.go)) {
        totals.goCost += p.go
        let entry = goByModel.get(c.model)
        if (!entry) {
          entry = { cost: 0, quota: p.goQuota }
          goByModel.set(c.model, entry)
        }
        entry.cost += p.go
        if (typeof p.goQuota === 'number') entry.quota = p.goQuota
      }
      if (typeof p.off === 'number' && Number.isFinite(p.off)) totals.offCost += p.off
      if (c.t >= lastT) {
        lastT = c.t
        lastModel = c.model
        lastProvider = c.provider
      }
    }
    const quotas = []
    for (const [model, entry] of goByModel) {
      if (entry.quota != null && entry.quota > 0) {
        quotas.push({
          model,
          cost: Math.round(entry.cost * 1e6) / 1e6,
          quota: entry.quota,
          pct: Math.min(100, entry.cost / entry.quota * 100),
        })
      }
    }
    quotas.sort((a, q) => q.cost - a.cost)
    return { totals, quotas, lastModel, lastProvider }
  }

  // ---------- Custom price persistence ----------

  async function pricesTarget() {
    const fs = ctx.get('fs')
    const sp = ctx.get('sandboxPolicy')
    if (!fs || !sp) return null
    return fs.resolve('.dsh-usage-prices.json', { cwd: sp.workspaceRoot })
  }

  async function loadCustom() {
    try {
      const fs = ctx.get('fs')
      const target = await pricesTarget()
      if (!fs || !target) return
      const text = await fs.readText(target)
      const parsed = JSON.parse(text)
      if (parsed && typeof parsed === 'object' && parsed.custom && typeof parsed.custom === 'object') {
        for (const k of Object.keys(parsed.custom)) {
          if (parsed.custom[k] && typeof parsed.custom[k] === 'object') custom[k] = parsed.custom[k]
        }
      }
    } catch (error) {
      // File absent or broken: fall back to built-in prices silently.
    }
  }

  async function saveCustom() {
    try {
      const fs = ctx.get('fs')
      const target = await pricesTarget()
      if (!fs || !target) return
      await fs.writeText(target, JSON.stringify({ custom }, null, 2))
    } catch (error) {
      // Persistence is best-effort; in-memory overrides still apply.
    }
  }

  loadCustom()

  // ---------- Export download routes ----------

  function registerExport(ws, filename, mime, content) {
    const token = Math.random().toString(36).slice(2, 10)
    const path = '/usage-export-' + token
    const dispose = ws.register({
      kind: 'exact',
      path,
      handler: (req, res) => {
        res.statusCode = 200
        res.setHeader('Content-Type', mime)
        res.setHeader('Content-Disposition', 'attachment; filename="' + filename + '"')
        res.setHeader('Cache-Control', 'no-store')
        res.end(content)
      },
    })
    const timer = ctx.get('timer')
    if (timer) timer.timeout(() => { try { dispose() } catch (e) { /* already gone */ } }, EXPORT_TTL_MS)
    return path
  }

  function escCsv(v) {
    const s = String(v == null ? '' : v)
    return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
  }

  function buildCsv(sid, b) {
    const pad = (x) => (x < 10 ? '0' : '') + x
    const stamp = new Date()
    const timeStr = stamp.getFullYear() + '-' + pad(stamp.getMonth() + 1) + '-' + pad(stamp.getDate()) + ' ' + pad(stamp.getHours()) + ':' + pad(stamp.getMinutes()) + ':' + pad(stamp.getSeconds())
    const lines = []
    lines.push(['Session usage export', '', '', '', '', '', '', '', '', '', ''])
    lines.push(['Session', sid, '', '', '', '', '', '', '', '', ''])
    lines.push(['Exported at', timeStr, '', '', '', '', '', '', '', '', ''])
    lines.push([])
    lines.push(['time', 'model', 'status', 'input', 'output', 'cache_hit', 'cache_write', 'reasoning', 'period', 'official_cost_cny', 'plan_cost_usd'])
    let tIn = 0
    let tOut = 0
    let tCache = 0
    let tOff = 0
    let tGo = 0
    for (const c of b.calls) {
      const d = new Date(c.t)
      const ts = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds())
      const p = priceOf(c.model, callUsage(c), c.t)
      lines.push([ts, c.model, c.status === 'running' ? 'generating' : 'done', c.input, c.output, c.cacheRead, c.cacheWrite, c.reasoning, p.peak ? 'peak' : 'off-peak', p.off == null ? '' : p.off.toFixed(6), p.go == null ? '' : p.go.toFixed(6)])
      tIn += c.input
      tOut += c.output
      tCache += c.cacheRead
      if (typeof p.off === 'number') tOff += p.off
      if (typeof p.go === 'number') tGo += p.go
    }
    lines.push([])
    lines.push(['TOTAL', b.calls.length, '', tIn, tOut, tCache, '', '', '', tOff.toFixed(6), tGo.toFixed(6)])
    return lines.map((row) => row.map(escCsv).join(',')).join('\r\n')
  }

  function buildJson(sid, b) {
    const a = aggregate(sid)
    return JSON.stringify({
      app: 'dsh-plugin-usage',
      sessionId: sid,
      exportedAt: new Date().toISOString(),
      lastModel: a.lastModel,
      totals: a.totals,
      calls: b.calls.map((c) => {
        const p = priceOf(c.model, callUsage(c), c.t)
        return {
          time: new Date(c.t).toISOString(),
          model: c.model,
          status: c.status,
          input: c.input,
          output: c.output,
          cacheRead: c.cacheRead,
          cacheWrite: c.cacheWrite,
          reasoning: c.reasoning,
          peak: p.peak,
          officialCost: p.off,
          goCost: p.go,
        }
      }),
    }, null, 2)
  }

  // ---------- HTTP API routes ----------

  const webServer = ctx.get('webServer')
  if (webServer) {
    const route = (path, handler) => {
      webServer.register({ kind: 'exact', path, handler })
    }

    route('/usage-api/state', async (req, res) => {
      const sid = String(getQuery(req).get('sessionId') || '')
      if (!sid) return respond(res, { ok: false })
      const b = bucket(sid)
      if (!b.requested) {
        b.requested = true
        preload(sid)
      }
      const a = aggregate(sid)
      respond(res, {
        ok: true,
        mode: mode.value,
        now: Date.now(),
        peakNow: isPeakAt(Date.now()),
        lastModel: a.lastModel == null ? null : String(a.lastModel),
        lastProvider: a.lastProvider == null ? null : String(a.lastProvider),
        totals: a.totals,
        quotas: a.quotas,
        officialQuota: await fetchOfficialQuota(),
        calls: b.calls.slice(-200).reverse().map((c) => {
          const p = priceOf(c.model, callUsage(c), c.t)
          return {
            t: c.t, model: c.model, input: c.input, output: c.output,
            cacheRead: c.cacheRead, cacheWrite: c.cacheWrite, reasoning: c.reasoning,
            go: p.go == null ? null : p.go, off: p.off == null ? null : p.off, peak: !!p.peak,
            status: c.status,
          }
        }),
      })
    })

    route('/usage-api/mode', async (req, res) => {
      const body = await readBody(req)
      const next = body && typeof body.mode === 'string' ? body.mode : 'auto'
      mode.value = next === 'go' || next === 'official' ? next : 'auto'
      respond(res, { ok: true, mode: mode.value })
    })

    route('/usage-api/prices', async (req, res) => {
      const keys = new Set()
      for (const k of Object.keys(GO)) keys.add(k)
      for (const k of Object.keys(OFF)) keys.add(k)
      for (const k of Object.keys(custom)) keys.add(k)
      const go = {}
      const official = {}
      for (const k of keys) {
        const g = goPrice(k)
        if (g) {
          go[k] = g.peak && g.off
            ? {
                peak: { in: g.peak.in, out: g.peak.out, cache: g.peak.cache },
                off: { in: g.off.in, out: g.off.out, cache: g.off.cache },
                quota: g.quota,
              }
            : { in: g.in, out: g.out, cache: g.cache, cacheWrite: g.cacheWrite == null ? null : g.cacheWrite, quota: g.quota }
        }
        const o = offPrice(k)
        if (o) official[k] = { peak: { in: o.peak.in, cache: o.peak.cache, out: o.peak.out }, off: { in: o.off.in, cache: o.off.cache, out: o.off.out } }
      }
      const customOut = {}
      for (const k of Object.keys(custom)) {
        const c = custom[k]
        const cg = c.go
        customOut[k] = {
          name: typeof c.name === 'string' ? c.name : k,
          official: c.official ? { peak: { in: c.official.peak.in, cache: c.official.peak.cache, out: c.official.peak.out }, off: { in: c.official.off.in, cache: c.official.off.cache, out: c.official.off.out } } : null,
          go: cg
            ? cg.peak && cg.off
              ? { peak: { in: cg.peak.in, out: cg.peak.out, cache: cg.peak.cache }, off: { in: cg.off.in, out: cg.off.out, cache: cg.off.cache }, quota: cg.quota }
              : { in: cg.in, out: cg.out, cache: cg.cache, cacheWrite: cg.cacheWrite == null ? null : cg.cacheWrite, quota: cg.quota }
            : null,
        }
      }
      respond(res, { ok: true, go, official, custom: customOut })
    })

    route('/usage-api/setprice', async (req, res) => {
      const body = await readBody(req)
      const model = body && typeof body.model === 'string' ? String(body.model).trim() : ''
      if (!model) return respond(res, { ok: false, error: 'empty model name' })
      const key = normModel(model)
      if (body && body.remove) {
        delete custom[key]
        await saveCustom()
        return respond(res, { ok: true })
      }
      const entry = { name: model }
      if (body.official && typeof body.official === 'object') {
        const o = body.official
        const pk = o.peak || {}
        const ok2 = o.off || {}
        entry.official = {
          peak: { in: cleanNum(pk.in), cache: cleanNum(pk.cache), out: cleanNum(pk.out) },
          off: { in: cleanNum(ok2.in), cache: cleanNum(ok2.cache), out: cleanNum(ok2.out) },
        }
      }
      if (body.go && typeof body.go === 'object') {
        const g = body.go
        if (g.peak && typeof g.peak === 'object' && g.off && typeof g.off === 'object') {
          entry.go = {
            peak: { in: cleanNum(g.peak.in), out: cleanNum(g.peak.out), cache: cleanNum(g.peak.cache) },
            off: { in: cleanNum(g.off.in), out: cleanNum(g.off.out), cache: cleanNum(g.off.cache) },
            quota: cleanNum(g.quota),
          }
        } else {
          entry.go = { in: cleanNum(g.in), out: cleanNum(g.out), cache: cleanNum(g.cache), cacheWrite: cleanNum(g.cacheWrite), quota: cleanNum(g.quota) }
        }
      }
      if (!entry.official && !entry.go) return respond(res, { ok: false, error: 'no prices provided' })
      custom[key] = entry
      await saveCustom()
      respond(res, { ok: true })
    })

    route('/usage-api/export', async (req, res) => {
      const query = getQuery(req)
      const sid = String(query.get('sessionId') || '')
      const format = String(query.get('format') || 'both')
      if (!sid) return respond(res, { ok: false, error: 'no session' })
      const b = bucket(sid)
      sweepStale(b)
      const stamp = Date.now().toString(36)
      const urls = {}
      if (format === 'csv' || format === 'both') {
        urls.csv = registerExport(webServer, 'usage-' + stamp + '.csv', 'text/csv; charset=utf-8', buildCsv(sid, b))
      }
      if (format === 'json' || format === 'both') {
        urls.json = registerExport(webServer, 'usage-' + stamp + '.json', 'application/json; charset=utf-8', buildJson(sid, b))
      }
      respond(res, { ok: true, urls })
    })
  }
}

export { apply }
export const inject = ['webServer', 'timer']
