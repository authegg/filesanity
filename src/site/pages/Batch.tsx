import { useEffect, useState } from 'react'
import { AppWindow } from '../../shared/AppWindow'
import { useBatch } from '../../shared/useBatch'
import { POLICY } from '../../lib'
import { PLANS } from '../plans'
import { Block, Head } from '../ui'
import { call, useMe } from '../useMe'

export const meta = {
  title: 'Batch: clean many files at once, with a policy and a record',
  description: 'Drop a folder\'s worth of photos, documents and PDFs, or a zip of them. FileSanity cleans them all in your browser into one zip, checks every clean copy, and writes a record with fingerprints.',
}

export default function Batch() {
  const b = useBatch()
  const { me } = useMe()
  const can = !!me && PLANS[me.plan].batch
  const [saved, setSaved] = useState('')

  // A saved policy loads once the account is known.
  useEffect(() => { if (me?.keep.length) b.setKeep(me.keep) }, [me]) // eslint-disable-line react-hooks/exhaustive-deps

  const save = async () => {
    setSaved('Saving…')
    try { await call('PUT', '/api/policy', { keep: b.keep }); setSaved('Saved. It loads here next time.') } catch (e) { setSaved((e as Error).message) }
  }

  return (
    <>
      <Head h1="Many files, one zip, one record." lede="Drop a folder's worth of photos, documents and PDFs, or a zip of them. They are read and cleaned in this tab, like a single file, and come back as one zip, same folders, with a record of what was removed." />
      <section className="batch" aria-label="The batch cleaner">
        <div className="wrap">
          <AppWindow batch={b} canBatch={can} hold={me === undefined} />
          <div className="policy" role="group" aria-labelledby="pol">
            <div className="policy-head">
              <h2 id="pol">Policy: keep these kinds of field</h2>
              <p>{b.keep.length ? `Keeping ${b.keep.length} kind${b.keep.length === 1 ? '' : 's'}; everything else is removed.` : 'Nothing is kept: everything FileSanity can remove is removed.'}</p>
            </div>
            <div className="policy-list">
              {POLICY.map((p) => (
                <label key={p.key}><input type="checkbox" checked={b.keep.includes(p.key)} onChange={() => b.toggle(p.key)} /> {p.label} <span>{p.formats}</span></label>
              ))}
            </div>
            <p className="policy-foot">
              {me === undefined ? ' ' : !me ? <><a href="/sign-in">Sign in</a> to clean a whole batch at once and save this policy.</> : !can ? <>Your plan cleans one file at a time. <a href="/pricing">Pro</a> cleans the batch at once and saves this policy.</> : me.via ? <>Your team's policy, set by {me.via}.</> : <><button className="link-btn" onClick={save}>Save this policy</button> <span role="status">{saved}</span></>}
            </p>
          </div>
        </div>
      </section>
      <Block id="h-record" title="The record">
        <p>Every batch zip carries <code>filesanity-record.txt</code>: the date, the policy, and for each file what was removed and what was kept, field by field, with SHA-256 fingerprints of the file before and after. Each clean copy is read again before the zip is made, and the record says what that check found. File it with the matter, the listing or the job. <b>Download report</b> saves the record on its own before cleaning.</p>
        <p>Files whose names give something away, a camera date, an email address, "draft", are saved under plain names such as <code>photo-01.jpg</code>; the record pairs each new name with the old one. Untick the box under the window to keep the names.</p>
      </Block>
      <Block id="h-local" title="Still on your machine">
        <p>A batch is read and cleaned in this tab, like a single file. The account is only asked what your plan is and what your policy keeps; the files themselves are never sent. The counter at the top of the window shows it.</p>
      </Block>
    </>
  )
}
