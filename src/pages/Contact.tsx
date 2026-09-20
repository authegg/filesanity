import { MAIL, REPO } from '../content'
import { Mailbox, PageHead, Pill, Section } from '../ui/bits'

export const meta = {
  title: 'Contact FileSanity: email or an issue on GitHub',
  description: 'How to reach FileSanity: an email address, or an issue on GitHub. There is no contact form, because a form would need a server and the site has none.',
}

export default function Contact() {
  return (
    <>
      <PageHead eyebrow="Contact" title="Write to us." lede="There is no contact form, because a form would need a server. Email works, and so does an issue on GitHub." />
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
              <h2 className="text-[1.5rem]">GitHub</h2>
              <p className="mt-2 max-w-[44ch] text-muted">A file that was not cleaned the way the page said, a format you need, or a fix: open an issue or a pull request. The whole project is there under the MIT licence.</p>
              <p className="mt-4 text-[1.125rem] font-medium"><a className="link [overflow-wrap:anywhere]" href={REPO}>github.com/authegg/filesanity</a></p>
              <div className="mt-6"><Pill href={`${REPO}/issues`} ghost>Open an issue</Pill></div>
            </div>
          </div>
        </div>
      </Section>
    </>
  )
}
