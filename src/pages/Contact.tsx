import { MAIL, POSTAL } from '../content'
import { ClientNote, Mailbox, PageHead, Pill, Section } from '../ui/bits'

export const meta = {
  title: 'Contact FileSanity: an email and a postal address',
  description: 'How to reach FileSanity: an email address and a postal address. There is no contact form, because a form would need a server and the site has none.',
}

export default function Contact() {
  return (
    <>
      <PageHead eyebrow="Contact" title="Write to us." lede="There is no contact form, because a form would need a server. Email works, and so does post." />
      <Section>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="bezel" data-reveal="">
            <div className="plate flex h-full flex-col p-6 sm:p-8">
              <h2 className="text-[1.5rem]">Email</h2>
              <p className="mt-2 max-w-[44ch] text-muted">Reports about a parser or the site are answered first. Anything else within a few days.</p>
              <p className="mt-4 text-[1.125rem] font-medium"><Mailbox /></p>
              <div className="mt-6"><Pill href={`mailto:${MAIL}`}>Email us</Pill></div>
            </div>
          </div>
          <div className="bezel" data-reveal="" style={{ '--d': '80ms' } as React.CSSProperties}>
            <div className="plate flex h-full flex-col p-6 sm:p-8">
              <h2 className="text-[1.5rem]">Post</h2>
              <p className="mt-2 max-w-[44ch] text-muted">For anything that needs a signature.</p>
              {POSTAL ? (
                <address className="mt-4 not-italic leading-relaxed text-muted">{POSTAL.map((l) => <span key={l} className="block">{l}</span>)}</address>
              ) : (
                <ClientNote>Client to supply: the registered postal address. The block renders once it is set in src/content.ts.</ClientNote>
              )}
            </div>
          </div>
        </div>
      </Section>
    </>
  )
}
