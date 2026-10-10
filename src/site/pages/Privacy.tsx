import { MAIL, UPDATED } from '../content'
import { Block, Head } from '../ui'

export const meta = {
  title: 'Privacy policy',
  description: 'What FileSanity collects: nothing from the files you clean in your browser; an email address and plan for accounts; files sent to the hosted API only for one request.',
}

export default function Privacy() {
  return (
    <>
      <Head h1="Privacy policy" lede={`Last updated ${UPDATED}. In short: files cleaned on this website never reach us. An account holds your email address and plan. The hosted API sees a file for one request.`} />
      <Block id="p-who" title="Who we are">
        <p>FileSanity is run by authegg, an independent studio based in the Philippines. Write to <a href={`mailto:${MAIL}`}>{MAIL}</a> about anything on this page.</p>
      </Block>
      <Block id="p-files" title="Files you clean on this website">
        <p>They are read and rewritten inside your browser. We never receive them, so we cannot store, read or share them. This holds for single files and for batches.</p>
      </Block>
      <Block id="p-visit" title="Visiting the website">
        <p>We run no analytics, advertising or tracking. Our host, Cloudflare, processes the technical data any web request carries (your IP address, browser, the page asked for) to deliver the page and stop attacks, under its own privacy policy. We set no cookie unless you sign in.</p>
      </Block>
      <Block id="p-account" title="Accounts">
        <p>If you create an account we keep: your email address; your plan, its status and renewal date; your API keys' names and creation dates, with the keys stored only as hashes; the email addresses you add to a team; your saved policy; and a monthly count of API files. We use them to run your account and nothing else.</p>
        <p>Sign-in emails are sent through Cloudflare Email Sending, which processes your email address for that purpose. Signing in sets one cookie, <code>fs_s</code>, needed to keep you signed in; it lasts 30 days or until you sign out. Your account page also keeps your plan's name in this browser's storage, so the pricing page can mark it without asking our server; signing out removes it. The sign-in page uses Cloudflare Turnstile to block automated requests.</p>
      </Block>
      <Block id="p-pay" title="Payment">
        <p>Lemon Squeezy sells the paid plans as merchant of record. It collects your payment details, billing address and tax information under its own privacy policy and tells us your email address, plan and subscription status. We never see your card.</p>
      </Block>
      <Block id="p-api" title="The hosted API">
        <p>A file sent to the API is held in memory on Cloudflare's network for the length of one request, cleaned, returned, and dropped. It is not written to disk or logged. We keep only the count of files for your quota.</p>
      </Block>
      <Block id="p-keep" title="How long, and your rights">
        <p>Account data is kept while the account exists and deleted within 30 days of a request to close it; payment records are kept by Lemon Squeezy as tax law requires. Under the Philippine Data Privacy Act of 2012, and similar laws where you live, you can ask to see, correct, export or delete your data, and complain to the National Privacy Commission. Email <a href={`mailto:${MAIL}`}>{MAIL}</a> from your account's address.</p>
      </Block>
      <Block id="p-change" title="Changes">
        <p>If this policy changes, the date above changes, and account holders are emailed about any change to what we collect.</p>
      </Block>
    </>
  )
}
