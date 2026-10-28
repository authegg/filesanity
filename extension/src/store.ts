/** What the extension keeps, all in the browser's own extension storage. Nothing here is ever sent anywhere except the
 *  token, which goes to filesanity.com/api/ext/me only, to read back the plan and the policy. */

// Firefox has `browser` (promises); Chrome MV3's `chrome` returns promises too.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ext: any = (globalThis as any).browser ?? (globalThis as any).chrome

export const API = 'https://filesanity.com'
export type Plan = 'free' | 'pro' | 'team' | 'api'
export type Rule = 'always' | 'never' | 'ask'
export type Entry = { at: string; site: string; name: string; removed: number }
export type State = {
  paused: string[] // hosts where the free auto-clean is off
  day: string // YYYY-MM-DD for `today`
  today: number
  token: string // fs_ext_..., from the account page
  plan: Plan
  policy: string[] // field groups to keep (src/lib POLICY keys)
  rules: Record<string, Rule> // host -> rule, subscribers only
  log: Entry[] // last 100 cleans, subscribers only
}
export const DEFAULTS: State = { paused: [], day: '', today: 0, token: '', plan: 'free', policy: [], rules: {}, log: [] }

export const load = async (): Promise<State> => ({ ...DEFAULTS, ...(await ext.storage.local.get(null)) })
export const save = (s: Partial<State>): Promise<void> => ext.storage.local.set(s)
export const paid = (s: State) => !!s.token && s.plan !== 'free'
export const dayOf = () => new Date().toISOString().slice(0, 10)

/** Asks the server for the plan and policy that go with the token. Only the token is sent. */
export async function refresh(token: string): Promise<{ plan: Plan; policy: string[] }> {
  const r = await fetch(`${API}/api/ext/me`, { headers: { Authorization: `Bearer ${token}` }, credentials: 'omit' })
  if (r.status === 401) throw new Error('That token is unknown or was disconnected. Create a new one on your account page.')
  if (!r.ok) throw new Error(`filesanity.com answered ${r.status}. Try again in a minute.`)
  const j = (await r.json()) as { plan: Plan; policy: string[] }
  return { plan: j.plan, policy: Array.isArray(j.policy) ? j.policy : [] }
}
