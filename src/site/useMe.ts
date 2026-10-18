import { useCallback, useEffect, useState } from 'react'
import type { PlanKey } from './plans'

export type Me = {
  email: string; plan: PlanKey; via?: string; invite?: string; pending: string[]; own: PlanKey; status?: string; renews?: string; ends?: string; portal?: string
  team: string[]; keys: { id: string; name: string; hint: string; created: string; scope?: 'ext' }[]; keep: string[]; used: number; quota: number; period: string
}

/** The signed-in account (/api/me answers null when signed out), null when signed out, undefined while loading. Pages that need it call it; marketing pages never do. */
export function useMe() {
  const [me, setMe] = useState<Me | null | undefined>(undefined)
  // Only the API's own null means signed out; a dropped request or a 5xx keeps what the page already shows.
  const load = useCallback(() => fetch('/api/me').then((r) => (r.ok ? r.json() : Promise.reject())).then((m: Me | null) => { remember(m && !m.via && ['active', 'trialing'].includes(m.status ?? '') ? m.own : undefined); setMe(m) }, () => {}), [])
  useEffect(() => { load() }, [load])
  return { me, reload: load }
}

/** The plan this browser's account pays for and can switch from, kept so the pricing page can mark it without an API call (marketing pages make none). */
const PLAN_KEY = 'fs-plan'
export function remember(plan?: PlanKey) {
  try { if (plan) localStorage.setItem(PLAN_KEY, plan); else localStorage.removeItem(PLAN_KEY) } catch { /* storage blocked: pricing just shows no mark */ }
}
export function knownPlan(): PlanKey | null {
  try { return localStorage.getItem(PLAN_KEY) as PlanKey | null } catch { return null }
}

/** A same-origin JSON call to the account API; returns the body or throws its error message. */
export async function call<T = unknown>(method: string, path: string, body?: unknown): Promise<T> {
  const r = await fetch(path, { method, headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(j.error ?? `Failed (${r.status}).`)
  return j as T
}
