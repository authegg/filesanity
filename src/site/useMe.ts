import { useCallback, useEffect, useState } from 'react'
import type { PlanKey } from './plans'

export type Me = {
  email: string; plan: PlanKey; via?: string; own: PlanKey; status?: string; renews?: string; ends?: string; portal?: string
  team: string[]; keys: { id: string; name: string; hint: string; created: string; scope?: 'ext' }[]; keep: string[]; used: number; quota: number; period: string
}

/** The signed-in account (/api/me answers null when signed out), null when signed out, undefined while loading. Pages that need it call it; marketing pages never do. */
export function useMe() {
  const [me, setMe] = useState<Me | null | undefined>(undefined)
  const load = useCallback(() => fetch('/api/me').then((r) => (r.ok ? r.json() : null)).catch(() => null).then(setMe), [])
  useEffect(() => { load() }, [load])
  return { me, reload: load }
}

/** A same-origin JSON call to the account API; returns the body or throws its error message. */
export async function call<T = unknown>(method: string, path: string, body?: unknown): Promise<T> {
  const r = await fetch(path, { method, headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(j.error ?? `Failed (${r.status}).`)
  return j as T
}
