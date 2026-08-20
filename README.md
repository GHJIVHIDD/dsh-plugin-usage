# dsh-plugin-usage

> Deployment-level **用量 / Usage** plugin for [DeepSeek Harness](https://github.com/deepseek-ai/DeepSeek-Harness) (DSH).

A real-time token & cost dashboard tab for the current session, placed next to Chat / Trajectory in the conversation view ring. It records input / output / cache-hit tokens and prices every model call with both the **DeepSeek official peak/off-peak rate card** and the **OpenCode Go plan rate card**, refreshes every second, shows animated gradient-blue status bars, supports a **fully editable custom price table** (persisted across restarts) and **CSV/JSON export**.

> 中文文档见 [README.zh.md](README.zh.md)（Chinese documentation is in README.zh.md）。

---

## ✨ Features

- **New "用量" tab in the conversation view ring** — sits right after Trajectory (`order: 11`), native DSH UI style (theme tokens, compact toolbar, card sections).
- **Real-time live tracking** — wraps every `llm/stream` model call: a "generating" row appears the moment a call starts, output/reasoning tokens are estimated per chunk and updated every second, then replaced by the adapter's exact usage; the committed `assistant/message` finalizes the record (15s match window, no duplicates).
- **Per-session accounting** — input (cache miss), output (incl. reasoning), cache hit, cache write; totals and per-call details with timestamps.
- **History preload** — the first time a session is opened, the full history is rebuilt from the persisted session log (seq-level dedup against live collection).
- **Dual pricing, auto-adjusted** — every call is priced by its own timestamp:
  - **DeepSeek official** (CNY / 1M tokens, effective 2026-08-17): peak hours (Beijing 09:00–12:00, 14:00–18:00) are 2× off-peak. V4 Pro: peak 9/0.3/27, off 4.5/0.15/13.5 (in/cache/out); V4 Flash: peak 3/0.1/9, off 1.5/0.05/4.5.
  - **OpenCode Go plan** (USD / 1M tokens + monthly quota): 20 built-in models (DeepSeek V4 Pro/Flash, Grok 4.5, GPT 5.6 Luna, GLM, Kimi, MiMo, MiniMax, Qwen3, Hy3), e.g. V4 Flash off-peak 0.22/0.007/0.66 and peak 0.44/0.014/1.32 with $15/month quota (DeepSeek plan models are billed in two peak tiers); plan is $10/month ≈ 6× usage value.
  - Three display modes: **Auto** (both), **Official** only, **Plan** only.
- **Animated gradient-blue status bars** — input / output / cache-hit distribution, smooth width transitions refreshed every second.
- **OpenCode Go official quota** — reads the official account quota (rolling 5h / weekly / monthly windows with reset times) straight from the `opencode.ai/zen/go/v1/usage` API, matching the console numbers.
- **Custom price table** — add, edit or remove prices for any model (official peak/off + plan prices + quota). Custom entries override the built-in cards, are persisted to `<workspaceRoot>/.dsh-usage-prices.json`, and historical costs are **re-priced immediately** after a change.
- **CSV / JSON export** — one-click download links (60s validity) for the full call detail list with per-call prices and totals.
- **Peak/off-peak indicator** — the toolbar shows whether the current Beijing time is peak or off-peak.

---

## 🔐 Privacy

- No API keys, credentials, tokens or machine-specific paths are read, logged, or stored. Only usage numbers are kept in memory.
- The custom price file stores prices only (no conversation content, no tokens, no keys).
- The plugin never sends data anywhere: all computation is local; exports are served from the local DSH HTTP server as one-shot links.

---

## 🚀 Install

> ⚠️ **Important: register the plugin exactly once.** Do not combine installation paths.
>
> - `dsh plugin add` (Method A / B) adds the plugin to `dsh.profile.bundles`; the bundled `cordis.patch.yml` is applied automatically as a bundle layer — **do not also add `ui-usage` manually**.
> - `./install.sh` or manual patching (Method C / D) registers through `cordis.patch.yml` — **do not also use `dsh plugin add`**.
> - If two `ui-usage` entries exist, DSH fails with `duplicate loader entry id: ui-usage`. Fix: remove one. `./install.sh` automatically removes the plugin from `dsh.profile.bundles` to prevent this.

### Prerequisites

- DeepSeek Harness installed and the `web` profile initialized at least once (`dsh web`), so `~/.dsh/profiles/web` exists.

### Method A: install from the GitHub repository (recommended)

```bash
dsh plugin --profile web add github:GHJIVHIDD/dsh-plugin-usage
```

Pin a commit for reproducibility:

```bash
dsh plugin --profile web add github:GHJIVHIDD/dsh-plugin-usage#<commit-sha>
```

> **pnpm ≥ 10 build authorization**: if the first run fails because pnpm refuses to run the git dependency's `prepare` script, add this to the profile's `pnpm-workspace.yaml`:

```yaml
# File: ~/.dsh/profiles/web/pnpm-workspace.yaml
allowBuilds:
  "@deepseek-ai/dsh-plugin-usage": true
```

Then re-run the install command.

### Method B: install from the GitHub Release tarball

The install package is published in GitHub Releases (not in the source tree):

```bash
curl -L -o dsh-plugin-usage-0.1.5.tgz \
  https://github.com/GHJIVHIDD/dsh-plugin-usage/releases/download/v0.1.5/dsh-plugin-usage-0.1.5.tgz

dsh plugin --profile web add ./dsh-plugin-usage-0.1.5.tgz
```

Or download it from the Releases page:

```text
https://github.com/GHJIVHIDD/dsh-plugin-usage/releases
```

You can also add a local source directory:

```bash
dsh plugin --profile web add /path/to/dsh-plugin-usage
```

### Method C: no-pnpm manual install script

```bash
git clone https://github.com/GHJIVHIDD/dsh-plugin-usage.git
cd dsh-plugin-usage
./install.sh
```

The script copies the plugin into `~/.dsh/profiles/web/node_modules/@deepseek-ai/dsh-plugin-usage`, writes the `ui-usage` patch into `cordis.patch.yml`, and removes the plugin from `dsh.profile.bundles` (with a `package.json.bak` backup) if present. Customize the target:

```bash
DSH_HOME=/path/to/.dsh DSH_PROFILE=web ./install.sh
```

### Method D: manual copy + patch

```bash
# 1. Copy the package into the profile's node_modules
mkdir -p ~/.dsh/profiles/web/node_modules/@deepseek-ai
cp -R dsh-plugin-usage ~/.dsh/profiles/web/node_modules/@deepseek-ai/

# 2. Make sure ~/.dsh/profiles/web/cordis.patch.yml contains:
# - insert:
#     - id: ui-usage
#       name: '@deepseek-ai/dsh-plugin-usage'
```

### Verify the installation

```bash
# The profile must compose without errors:
dsh --profile web --dump-config > /dev/null && echo OK
```

Then start (or refresh) your web profile and open the **用量** tab:

```bash
dsh web
```

If the tab is missing, check the browser console for `usage-api` fetch failures, and confirm the patch entry exists exactly once (`grep -n ui-usage ~/.dsh/profiles/web/cordis.patch.yml ~/.dsh/profiles/web/package.json`).

---

## 🧭 Usage guide

1. Start a conversation and let the agent run (each model call is tracked).
2. Open the **用量** tab (next to Trajectory).
3. The page refreshes every second:
   - **Session overview** — input / output (incl. reasoning) / cache hit / cost (official ¥ and plan $), current model and call count.
   - **Usage distribution** — gradient-blue bars for input, output and cache hit (with a pulsing dot and "generating" label on the in-flight call).
   - **OpenCode Go official quota** — rolling (5h) / weekly / monthly usage percentages with reset times, identical to the OpenCode console; requires the API key (see below).
   - **Call details** — time, model, input/output/cache tokens and per-call official ¥ / plan $ costs; the in-flight row shows a blue pulse indicator.
   - **Price table** (collapsible) — full merged rate card; `Edit` any model, `+ Add model` for new ones, `Remove` for custom entries.
4. **Export** — click `Export` in the Call details header, then download **CSV** or **JSON** (links valid for 60 s; click again to regenerate).
5. **Pricing mode** — toolbar switches: Auto (both) / Official / Plan.

### OpenCode Go official quota

- The official quota card queries `GET https://opencode.ai/zen/go/v1/usage` with your OpenCode Go API key and shows the **account-level** rolling (5h) / weekly / monthly usage percentages and reset times — the same numbers as the OpenCode console.
- The key is read from the environment only (never stored or logged), in order:
  - `DSH_OPENCODE_GO_KEY` — dedicated key (recommended), or
  - `OPENCODE_GO_API_KEY` — the env name used by the llm-pi-ai `opencode-go` provider config, or
  - `DEEPSEEK_API_KEY` — used automatically when your deepseek provider points at the OpenCode Go gateway.
- Set it before starting dsh, e.g. `export DSH_OPENCODE_GO_KEY=sk-...`, then restart. The card refreshes every 30 s.
- The session-scoped plan cost (¥/$ in the overview) is separate from the account quota: it reflects only this session.

### Custom price table

- Units: official CNY per 1M tokens (peak & off-peak), plan USD per 1M tokens + monthly quota.
- Leave a field empty to omit that price group field.
- Changes apply immediately to the whole session history (dynamic re-pricing) and are saved to `<workspaceRoot>/.dsh-usage-prices.json`.
- Removing a custom entry falls back to the built-in card.

### Peak / off-peak

Peak hours are **Beijing time 09:00–12:00 and 14:00–18:00**; official prices are 2× during peak. The toolbar badge shows the current period; per-call prices use the call's own timestamp, so history stays correct after the period changes.

---

## 🗂️ Package layout

```
dsh-plugin-usage/
├── package.json          # npm package manifest with dsh.bundle.patch + dsh.client metadata
├── cordis.patch.yml      # loader patch: inserts the ui-usage entry
├── install.sh            # no-pnpm manual installer (Method C)
├── lib/
│   ├── index.js          # host half (ESM): collection, pricing, /usage-api/* routes
│   ├── client.js         # client half (web ModuleLoader bundle)
│   └── types/index.d.ts  # TypeScript declarations
├── scripts/verify.mjs    # structural + privacy verification (dev-time)
├── README.md             # this file (English)
├── README.zh.md          # Chinese documentation
└── LICENSE               # Apache-2.0
```

### HTTP API (internal, same-origin)

| Route | Method | Purpose |
|---|---|---|
| `/usage-api/state?sessionId=` | GET | Aggregated session usage + per-call details (polled every second) |
| `/usage-api/mode` | POST | Switch pricing mode: `{ "mode": "auto" \| "official" \| "go" }` |
| `/usage-api/prices` | GET | Merged price table (built-in + custom) |
| `/usage-api/setprice` | POST | Add/edit/remove custom prices (persisted) |
| `/usage-api/export?sessionId=&format=csv\|json\|both` | GET | Create one-shot download links |
| `/usage-export-<token>` | GET | Download the exported CSV/JSON (60 s TTL) |

---

## 🧩 Compatibility

- Built and tested against DSH web profile (conversation view ring, `conversation.view` slot).
- Uses the same packaging conventions as `dsh-plugin-canvas` / `dsh-plugin-vm-sandbox` (`dsh.bundle.patch` + `dsh.client` metadata, `./client` export, loader patch).
- No external runtime dependencies; the host half uses only DSH core services (`webServer`, `timer`, `fs`, `sandboxPolicy`, `sessionQuery`, `llm/stream`, `session/event`).

---

## ❓ FAQ

**Q: The tab shows "Failed to load usage data".**
A: The host half is not serving `/usage-api/*`. Confirm the plugin is registered exactly once (see Install), then restart the profile. Check `dsh --profile web --dump-config` output for the `ui-usage` row.

**Q: Why do numbers change after I edit a price?**
A: Costs are computed dynamically from the current price table on every read, so historical calls are re-priced immediately. This is by design.

**Q: Is my conversation content stored?**
A: No. Only token counts, model names and timestamps are kept in memory; exports contain the same data. The custom price file contains prices only.

**Q: Can I use it with the headless profile?**
A: The UI is web-only; the host half works in any profile, but the dashboard requires the web client.

---


### License

This project is licensed under the Apache License 2.0.
See the full license at https://www.apache.org/licenses/LICENSE-2.0.
