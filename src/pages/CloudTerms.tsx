import { LAUNCH, MAKER, REPO } from '../content'
import { CLOUD } from '../cloud'
import { Mailbox, PageHead, Section } from '../ui/bits'

export const meta = {
  title: 'Cloud API terms and privacy',
  description: 'Terms and privacy for the hosted Cloud API at api.filesanity.com, the one FileSanity service that receives a file: what is kept, how long, and who bills you.',
}

export default function CloudTerms() {
  return (
    <>
      <PageHead eyebrow="Cloud API" title="Terms and privacy for the hosted API." lede={`Effective ${LAUNCH}. These cover ${CLOUD.replace('https://', '')} only. The site and every other tool are covered by the main privacy policy and terms, which say the file never leaves your browser; here it does, and this page says exactly what happens to it.`} />
      <Section>
        <div className="prose max-w-[68ch]">
          <h2>1. What the service is</h2>
          <p>A hosted copy of the FileSanity API: you send a file, it is read and rewritten, and the clean copy is returned in the same request. It is run by {MAKER} on Cloudflare Workers. The code is the same open-source handler as the self-hosted API, at <a className="link" href={REPO}>{REPO.replace('https://', '')}</a>.</p>
          <h2>2. Your files</h2>
          <p>A file is held in the Worker's memory for the length of one request and is discarded when the reply is sent. It is not written to disk, a database, a cache or a log by our code, and no person can see it. Cloudflare, as the host, records request metadata (time, size, source address, status) in its logs as it does for every Worker; it does not retain request bodies.</p>
          <h2>3. What we keep</h2>
          <p>For a trial key: the email address given for it, the time it was issued, and how many files it has cleaned. For a paid key: the plan, the email address Lemon Squeezy reports for the licence, and a count of files per month. Counts are kept for forty days; a trial record until the key is deleted on request. Nothing else.</p>
          <h2>4. Billing</h2>
          <p>Subscriptions are sold by Lemon Squeezy as the merchant of record. Lemon Squeezy takes payment, issues the invoice, applies VAT or sales tax, and holds your card details; we never see them. Its terms and privacy policy apply to the purchase. Cancel at any time from the receipt's link; the key stops at the end of the paid period. Refunds follow Lemon Squeezy's policy: write to us within fourteen days if the service did not work as described.</p>
          <h2>5. Limits and fair use</h2>
          <p>Each plan has a monthly file count and a file size, stated on the cloud page. Requests over the quota are refused with a clear error, not silently charged. A key is yours to use in your own systems; do not resell access to it. We may suspend a key used to attack the service or others.</p>
          <h2>6. What is promised</h2>
          <p>The service removes what the parsers list on the formats page and says in each reply what was removed and kept. It is provided as is, and we do not warrant that a cleaned file is free of every identifying detail; a signed report tells you what was done, not that nothing remains. We aim for the service to be available but do not offer a service level agreement on the plans listed. To the extent the law allows, liability is limited to the fees paid in the month the claim arises.</p>
          <h2>7. Changes, law and contact</h2>
          <p>Changes to this page are dated at the top and noted in the changelog. These terms are governed by the laws of the Republic of the Philippines. Questions, deletion requests and refunds go to <Mailbox />.</p>
        </div>
      </Section>
    </>
  )
}
