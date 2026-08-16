export interface UsageTotals {
  input: number
  output: number
  cacheRead: number
  cacheWrite: number
  reasoning: number
  calls: number
  running: number
  goCost: number
  offCost: number
  goQuota: number | null
}

export interface UsageCall {
  t: number
  model: string
  input: number
  output: number
  cacheRead: number
  cacheWrite: number
  reasoning: number
  go: number | null
  off: number | null
  peak: boolean
  status: 'running' | 'done'
}

export interface UsageState {
  ok: boolean
  mode: 'auto' | 'official' | 'go'
  now: number
  peakNow: boolean
  lastModel: string | null
  lastProvider: string | null
  totals: UsageTotals
  calls: UsageCall[]
}

export interface PriceEntry {
  in: number
  out: number
  cache: number
  cacheWrite?: number | null
  quota?: number | null
}

export interface OfficialPrice {
  peak: { in: number; cache: number; out: number }
  off: { in: number; cache: number; out: number }
}

export interface PriceTable {
  ok: boolean
  go: Record<string, PriceEntry>
  official: Record<string, OfficialPrice>
  custom: Record<string, {
    name: string
    official: OfficialPrice | null
    go: PriceEntry | null
  }>
}

export function apply(ctx: any): void
export const inject: string[]
