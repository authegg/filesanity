import { ClientNote, Mailbox, PageHead, Section } from '../ui/bits'
import { LAUNCH } from '../content'

export const meta = {
  title: 'Privacy policy for a site that collects nothing',
  description: 'FileSanity collects nothing: no upload, no account, no cookies, no analytics. The whole privacy policy, in plain words and dated, on one page.',
}

export default function Privacy() {
  return (
    <>
      <PageHead eyebrow="Privacy policy" title="We collect nothing." lede={`Effective ${LAUNCH}. This policy is short because the site has no server, no account and no analytics. It describes what does not happen, and the two things that do.`}>
        <ClientNote>Marked for legal review before launch.</ClientNote>
      </PageHead>
      <Section>
        <div className="prose max-w-[68ch]">
          <h2>1. Your files</h2>
          <p>A file you drop, paste or choose is opened by your browser on your device. The page reads parts of it and writes a clean copy, on your device. The file is never transmitted to us or to anyone else, and we cannot see it, store it or recover it. When you close the tab, the browser discards everything the page held.</p>
          <h2>2. What the site loads</h2>
          <p>Opening a page loads its HTML, one stylesheet, one script and one font file from the same server that serves the page. The sample photograph is loaded only when you press "Try a sample". Like any web server, ours may keep ordinary access logs (the address the request came from, the time, the page requested) for a short period for the purpose of keeping the site running. Those logs do not include any file you clean, because no file is ever sent.</p>
          <h2>3. Cookies, analytics and third parties</h2>
          <p>The site sets no cookies and uses no local storage. It loads no analytics, advertising or error-reporting script and embeds nothing from a third party. There is no cookie banner because there is nothing to consent to.</p>
          <h2>4. Email</h2>
          <p>If you write to us at <Mailbox />, we keep your message for as long as it takes to answer it and for our records after that. We do not add you to a list. You can ask us to delete the correspondence at any time.</p>
          <h2>5. Your rights</h2>
          <p>Because we hold no data about your use of the site, there is nothing to access, correct, export or erase, other than any email you have sent us, which you may ask us to delete.</p>
          <h2>6. Changes</h2>
          <p>If the site ever gains a feature that collects anything, this page will be rewritten before that feature ships, the date at the top will change, and the changelog will say so.</p>
          <h2>7. Who we are</h2>
          <p>The company that operates this site is named on the about page, with its address on the contact page. Questions about this policy go to <Mailbox />.</p>
          <ClientNote>Client to supply: the operating company's legal name and address, here and on the about and contact pages.</ClientNote>
        </div>
      </Section>
    </>
  )
}
