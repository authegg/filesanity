import { REPO } from '../content'
import { Block, Head } from '../ui'

export const meta = {
  title: 'Browser extension: clean files as you upload them',
  description: 'The FileSanity extension for Chrome and Firefox removes metadata from a photo, document or PDF the moment you choose it for upload, on any site. Free, and the file never leaves your browser.',
}

const RELEASES = `${REPO}/releases`

export default function Extension() {
  return (
    <>
      <Head h1="Clean every upload, on every site." lede="Choose a photo, a Word file or a PDF on any website and the extension removes its metadata before the site sees it. The cleaning happens inside your browser, as it does on this site.">
        <div className="sheet group" aria-labelledby="h-install">
          <h2 id="h-install">Install</h2>
          <p><a className="btn" href={RELEASES}>Get it for Chrome</a></p>
          <p><a className="btn ghost" href={RELEASES}>Get it for Firefox</a></p>
          <p className="small">Store listings pending review. Until they are live, the builds are on the GitHub releases page with steps to load them.</p>
        </div>
      </Head>
      <Block id="h-free" title="Free, no account">
        <ul>
          <li>Cleans JPEG, PNG, HEIC, MP4, MOV, Word, Excel, PowerPoint and PDF files the moment you choose, drop or paste them into an upload, on every site.</li>
          <li>The toolbar button shows how many files were cleaned on this tab and today, and pauses cleaning for the site you are on.</li>
          <li>Drop one file on the toolbar panel to clean it and download the copy.</li>
        </ul>
        <p>Cleaning a single file is never behind a paywall, here or in the extension.</p>
      </Block>
      <Block id="h-paid" title="With Pro, Team or API">
        <ul>
          <li>Your saved policy (the kinds of field you keep) applies to every upload. On Team, the owner's policy applies to everyone.</li>
          <li>Rules per site: always clean, never clean, or ask first.</li>
          <li>Right-click an image and choose "Save without metadata".</li>
          <li>A log of your last 100 cleans: site, file name and fields removed. It stays in the extension and is never sent anywhere.</li>
        </ul>
        <p>To connect it, open your <a href="/account">account</a>, create a connection token and paste it into the extension's options.</p>
      </Block>
      <Block id="h-perms" title="What it asks for">
        <table className="spec"><tbody>
          <tr><th scope="row">Read and change all sites</th><td>To see when you choose a file for upload and swap in the clean copy. It reads nothing else on the page.</td></tr>
          <tr><th scope="row">Storage</th><td>Your counts, paused sites, rules, the log and the connection token, kept in your browser.</td></tr>
          <tr><th scope="row">Context menus</th><td>The "Save without metadata" item on images.</td></tr>
          <tr><th scope="row">Downloads</th><td>To save the clean copy of an image you right-clicked.</td></tr>
          <tr><th scope="row">filesanity.com</th><td>Only when connected: one request that asks for your plan and policy. No file, file name or site is sent.</td></tr>
        </tbody></table>
      </Block>
      <Block id="h-limits" title="What it does not do">
        <p>It does not clean uploads a site builds in its own code without a file picker or a drop. Compressed metadata inside some PDFs is kept, as on this site. The source is in the <a href={REPO}>open-source repository</a>.</p>
      </Block>
    </>
  )
}
