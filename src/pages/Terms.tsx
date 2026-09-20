import { ClientNote, Mailbox, PageHead, Section } from '../ui/bits'
import { LAUNCH, MAKER, REPO } from '../content'

export const meta = {
  title: 'Terms of use for a site that collects nothing',
  description: 'The terms for using FileSanity, in plain words and dated: what the site does, what it does not promise, and what you agree to by cleaning a file here.',
}

export default function Terms() {
  return (
    <>
      <PageHead eyebrow="Terms" title="Terms of use." lede={`Effective ${LAUNCH}. Using the site means agreeing to these. They are short because the site does little on our side.`}>
        <ClientNote>Written for a site that collects nothing; not yet read by a lawyer.</ClientNote>
      </PageHead>
      <Section>
        <div className="prose max-w-[68ch]">
          <h2>1. What the service is</h2>
          <p>FileSanity is a web page that reads and removes metadata from files inside your browser, with a batch page, a command line tool, a self-hosted API and a browser extension built from the same code. It is provided free, without an account, for personal and commercial use, by {MAKER}. The code is open source under the MIT licence at <a className="link" href={REPO}>{REPO.replace('https://', '')}</a>; the licence there governs your use of the code itself.</p>
          <h2>2. What it does, and does not, promise</h2>
          <p>The page removes the fields it lists on the formats page, and it says in each result what was removed and what was kept. It does not remove content, it does not read formats marked as not yet, and it does not open compressed PDF streams. It is provided as is. We do not warrant that a cleaned file is free of every piece of identifying information, and you remain responsible for checking a file before you send it, especially where the consequences of a leak are serious.</p>
          <h2>3. Your files</h2>
          <p>Your files stay on your device and remain yours. We take no licence to them, because we never receive them.</p>
          <h2>4. Acceptable use</h2>
          <p>Do not use the site to interfere with its operation, and do not present the site as your own or as endorsed by us. Beyond that, clean whatever files you have the right to clean.</p>
          <h2>5. Liability</h2>
          <p>To the extent the law allows, we are not liable for any loss arising from use of the site, including loss caused by a field that was not removed. Nothing in these terms limits liability that cannot be limited by law.</p>
          <h2>6. Changes and law</h2>
          <p>We may change these terms; the date at the top and the changelog will say when. These terms are governed by the laws of the Republic of the Philippines, where {MAKER} is based, and any dispute goes to its courts.</p>
          <ClientNote>Marked for legal review: the governing law is an assumption until confirmed.</ClientNote>
          <h2>7. Contact</h2>
          <p>Questions about these terms go to <Mailbox />.</p>
        </div>
      </Section>
    </>
  )
}
