import { useEffect, useState } from 'react'

/** Requests this page has started since `since` (performance.now()), from the browser's own resource timing. Blob and data URLs are local and not counted. */
export function useRequests(since: number | null) {
  const [n, setN] = useState(0)
  useEffect(() => {
    if (since == null) return
    const count = () => performance.getEntriesByType('resource').filter((e) => e.startTime >= since && !/^(blob|data):/.test(e.name)).length
    setN(count())
    const po = new PerformanceObserver(() => setN(count()))
    po.observe({ type: 'resource' })
    return () => po.disconnect()
  }, [since])
  return n
}
