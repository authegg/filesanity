import { MAIL, REPO } from '../content'
import { Head } from '../ui'

export const meta = {
  title: 'Contact FileSanity',
  description: 'Email FileSanity about the cleaner, an account, billing or the API, or open an issue on GitHub.',
}

export default function Contact() {
  return (
    <>
      <Head h1="Write to us." lede="Email reaches a person. For a file that did not clean the way the page said, an issue on GitHub is the fastest route." />
      <section className="sec first" aria-label="Ways to reach us">
        <div className="wrap contact">
          <div><h2>Email</h2><p>The cleaner, accounts, billing and the API.</p><a className="contact-big" href={`mailto:${MAIL}`}>{MAIL}</a></div>
          <div><h2>Security</h2><p>A security problem, or a file reported clean that was not.</p><a className="contact-big" href={`mailto:${MAIL}?subject=Security`}>{MAIL}</a><p className="small">Put "Security" in the subject.</p></div>
          <div><h2>GitHub</h2><p>Bugs, formats you need, and pull requests.</p><a className="contact-big" href={`${REPO}/issues`}>Open an issue</a></div>
        </div>
      </section>
    </>
  )
}
