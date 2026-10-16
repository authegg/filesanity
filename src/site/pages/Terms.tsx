import { LEGAL, MAIL, REPO, UPDATED } from '../content'
import { Block, Head } from '../ui'

export const meta = {
  title: 'Terms of service',
  description: 'The terms for using FileSanity: the free cleaner, accounts, paid plans, refunds and the hosted API.',
}

export default function Terms() {
  return (
    <>
      <Head h1="Terms of service" lede={`Last updated ${UPDATED}. By using FileSanity you agree to these terms.`} />
      <Block id="t-what" title="The service">
        <p>FileSanity is run by {LEGAL}, a sole proprietorship registered with the DTI in the Philippines (&ldquo;we&rdquo;). It removes metadata from files. The website does this in your browser; the hosted API does it on our server for one request. The software is also published under the <a href={`${REPO}/blob/main/LICENSE`}>MIT licence</a>, which governs the code; these terms govern the service at filesanity.com.</p>
      </Block>
      <Block id="t-check" title="Check the result">
        <p>FileSanity tells you what it removed and what it kept. It does not read every format or every place metadata can hide, and it does not remove content such as tracked changes, comments, hidden text or what a picture shows. You are responsible for checking a file before you send it. The service is provided as is, without warranty.</p>
      </Block>
      <Block id="t-account" title="Accounts">
        <p>Keep access to your email address and your API keys to yourself; anything done with them is treated as done by you. A Team owner may add and remove people and decides the team's policy. We may suspend an account used to abuse the service or others.</p>
      </Block>
      <Block id="t-pay" title="Paid plans">
        <p>Paid plans are sold by Paddle as merchant of record, under its terms of sale, billed monthly in advance. You can cancel at any time from your account page; the plan runs to the end of the period paid for.</p>
        <p>Refunds: a full refund within 14 days of your first payment, as set out in the <a href="/refunds">refund policy</a>.</p>
        <p> We will give 30 days' notice of a price change by email.</p>
      </Block>
      <Block id="t-api" title="The API">
        <p>Use the API only for files you have the right to process. Quotas reset monthly and unused files do not carry over. Do not try to get around a quota or load-test the service.</p>
      </Block>
      <Block id="t-limit" title="Liability">
        <p>To the extent the law allows, our total liability for any claim about the service is limited to what you paid us in the twelve months before it, and we are not liable for indirect loss. Nothing here limits liability that cannot be limited by law.</p>
      </Block>
      <Block id="t-law" title="Law and contact">
        <p>These terms are governed by the laws of the Republic of the Philippines. Write to <a href={`mailto:${MAIL}`}>{MAIL}</a> first; most problems are solved by email.</p>
      </Block>
    </>
  )
}
