import { Closer, PageHead, Section } from '../ui/bits'
import { MAKER, REPO } from '../content'

export const meta = {
  title: 'About FileSanity: an open-source project, no data business',
  description: 'An open-source metadata cleaner that runs in the browser, made by authegg under the MIT licence. What it is, what it will not do, and who makes it.',
}

export default function About() {
  return (
    <>
      <PageHead eyebrow="About" title="An open-source project that does one thing." lede="FileSanity removes the metadata a file carries about the person who made it, and does so without ever seeing the file. The code is public under the MIT licence. That is the whole product." />
      <Section labelledBy="h-why">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <h2 id="h-why" className="text-[1.75rem] sm:text-[2.25rem] lg:col-span-4">Why it exists.</h2>
          <div className="prose lg:col-span-8">
            <p>People who send files to strangers, journalists, lawyers, HR staff, freelancers, marketplace sellers, have been told for years to strip the metadata first. The tools for it either need installing or ask for the file to be uploaded to someone's server, which is the very thing a cautious person hesitates at.</p>
            <p>A browser can do the job by itself. Reading a file's header and writing a copy without it is a small amount of code, and it can run on the machine the file is already on. FileSanity is that code, with a page around it that says plainly what it reads, what it removes, and what it cannot do yet.</p>
          </div>
        </div>
      </Section>
      <Section labelledBy="h-wont">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <h2 id="h-wont" className="text-[1.75rem] sm:text-[2.25rem] lg:col-span-4">What it will not do.</h2>
          <div className="prose lg:col-span-8">
            <ul>
              <li>Upload a file, ever. A feature that needs a server would be a separate thing with its own page and its own policy; the API you can host yourself is the closest it comes.</li>
              <li>Add analytics, advertising or a tracking pixel to this site.</li>
              <li>Ask for an account, or charge for any of it.</li>
              <li>Claim a file is clean when a part of it was not read. The result says what was kept and why.</li>
            </ul>
          </div>
        </div>
      </Section>
      <Section labelledBy="h-who">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <h2 id="h-who" className="text-[1.75rem] sm:text-[2.25rem] lg:col-span-4">Who makes it.</h2>
          <div className="prose lg:col-span-8">
            <p>FileSanity is made by {MAKER}, a small design studio, and published as open source under the MIT licence. There is no company behind it with investors to answer to and no data business to feed. The parsers, the site, the command line tool, the API and the extension are all in <a className="link" href={REPO}>one repository on GitHub</a>; bug reports, pull requests and a reading of the code are equally welcome there.</p>
            <p>The parsers are hand-written for this project, a few hundred lines each, with no metadata library behind them. Every claim on this site about what is removed is checked by the test suite in that repository against real files.</p>
          </div>
        </div>
      </Section>
      <Closer title="The product is the argument." text="Drop a file on the home page and watch what it does." />
    </>
  )
}
