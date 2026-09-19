import { fmtBytes, type Report, type Segment } from './lib'

/** The generic anatomy shown before any file is dropped. What each part usually carries, in the manual's words. */
const ANATOMY: Segment[] = [
  { id: 'a-exif', label: 'EXIF', what: 'what the camera wrote', bytes: 0, strip: true, fields: [
    { name: 'Camera model', value: 'and its serial number' }, { name: 'GPS position', value: 'where you were standing' }, { name: 'Date and time', value: 'to the second' }] },
  { id: 'a-xmp', label: 'XMP', what: 'what the editing software wrote', bytes: 0, strip: true, fields: [
    { name: 'Creator tool', value: 'and every save since' }, { name: 'Your name', value: 'from the software licence' }] },
  { id: 'a-core', label: 'core.xml', what: 'what Office wrote', bytes: 0, strip: true, fields: [
    { name: 'Author', value: 'and last modified by' }, { name: 'Revision count', value: 'and total editing time' }] },
]

const SHOW = 4

/** Plate width as a share of the column: the log of the part's size against the body's, so a 700 B EXIF block is visibly
 *  a sliver next to a 196 kB picture, and a 40 kB XMP packet is not. */
const width = (bytes: number, body: number, fallback: number) => (bytes > 0 && body > 0 ? Math.round(45 + 55 * Math.min(1, Math.log10(1 + bytes) / Math.log10(1 + body))) : fallback)

export function Plates({ report, state, thumb }: { report: Report | null; state: 'empty' | 'ready' | 'cleaned'; thumb?: string }) {
  const segs = report ? report.segments : ANATOMY
  const bodyLabel = report ? report.body.label : 'Your photo or document'
  return (
    <ol className="relative m-0 list-none p-0" aria-label={report ? 'Parts of the file' : 'Parts of a typical file'}>
      {segs.map((s, i) => (
        <li key={s.id} className={`relative grid grid-cols-[5.5rem_1rem_1fr] items-center gap-x-2 py-1 sm:grid-cols-[minmax(6rem,11rem)_2rem_1fr] sm:gap-x-3 lg:grid-cols-[14rem_2rem_1fr] ${state === 'cleaned' && s.strip ? 'row-gone' : ''}`} style={{ paddingLeft: `${Math.min(i, 5) * 1}rem` }}>
          <div className="plate h-10 sm:h-12 lg:h-14" style={{ width: `${width(s.bytes, report?.body.bytes ?? 0, 70 + i * 8)}%` }} aria-hidden="true">
            <div className="plate-inner flex h-full items-center justify-center font-mono text-[0.6875rem] font-medium uppercase tracking-[0.06em]">{s.label}</div>
          </div>
          <div className="leader self-center" aria-hidden="true" />
          <div className="callout min-w-0 py-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="meta">{s.label}{report && s.bytes ? `, ${fmtBytes(s.bytes)}` : ''}</span>
              <span className={`tag ${s.strip ? '' : 'tag-kept'}`}>{s.strip ? (state === 'cleaned' ? 'removed' : 'remove') : 'kept'}</span>
            </div>
            <p className="m-0 mt-0.5 text-[0.8125rem] leading-snug text-muted">{s.what}</p>
            <ul className="m-0 mt-1 list-none p-0 font-mono text-[0.75rem] leading-[1.35]">
              {s.fields.slice(0, SHOW).map((f, k) => (
                <li key={k} className="field line-clamp-2 [overflow-wrap:anywhere] sm:line-clamp-none sm:truncate"><span className="text-muted">{f.name}: </span>{f.value}</li>
              ))}
              {s.fields.length > SHOW && <li className="text-muted">and {s.fields.length - SHOW} more, below</li>}
              {!s.fields.length && <li className="text-muted">nothing readable in it</li>}
            </ul>
          </div>
        </li>
      ))}
      <li className="relative grid grid-cols-[5.5rem_1rem_1fr] items-center gap-x-2 py-1 sm:grid-cols-[minmax(6rem,11rem)_2rem_1fr] sm:gap-x-3 lg:grid-cols-[14rem_2rem_1fr]" style={{ paddingLeft: `${Math.min(segs.length, 5) * 1}rem` }}>
        <div className="plate h-14 overflow-hidden sm:h-20 lg:h-24" style={{ background: 'var(--paper-2)' }} aria-hidden="true">
          {thumb ? <img src={thumb} alt="" className="plate-inner h-full w-full scale-[1.6] object-cover" decoding="async" /> : <div className="plate-inner flex h-full items-center justify-center font-mono text-[0.6875rem] font-medium uppercase tracking-[0.06em] text-muted">{report ? report.kind : 'file'}</div>}
        </div>
        <div className="leader self-center" aria-hidden="true" />
        <div className="callout min-w-0 py-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="meta">{bodyLabel}{report ? `, ${fmtBytes(report.body.bytes)}` : ''}</span>
            <span className="tag tag-kept">stays</span>
          </div>
          <p className="m-0 mt-0.5 text-[0.8125rem] leading-snug text-muted">{report ? 'Untouched. Not decoded, not re-encoded, not re-saved.' : 'The part you meant to send. Untouched.'}</p>
        </div>
      </li>
    </ol>
  )
}
