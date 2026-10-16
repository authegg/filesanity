import { applyPolicy, cleanName, fieldCount, inspect, strip } from '../../src/lib/index'

/** The clean copy of a file under a policy (kinds of field to keep), or null if FileSanity cannot read it. */
export async function cleanFile(f: File, keep: string[], rename = false): Promise<{ file: File; removed: number } | null> {
  try {
    const report = applyPolicy(await inspect(f), keep)
    const out = await strip(f, report)
    return { file: new File([out], rename ? cleanName(f.name) : f.name, { type: f.type || out.type, lastModified: f.lastModified }), removed: fieldCount(report) }
  } catch {
    return null
  }
}
