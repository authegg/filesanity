import { ClientNote, Closer, PageHead, Section } from '../ui/bits'

export const meta = {
  title: 'About FileSanity',
  description: 'A small company that makes a metadata cleaner which runs in the browser. What it is, what it will not do, and who makes it.',
}

export default function About() {
  return (
    <>
      <PageHead eyebrow="About" title="A small company, one job." lede="FileSanity removes the metadata a file carries about the person who made it, and does so without ever seeing the file. That is the whole product." />
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
              <li>Upload a file, ever. A future feature that needs a server will be a separate product with its own page and its own policy.</li>
              <li>Add analytics, advertising or a tracking pixel to this site.</li>
              <li>Ask for an account to use what is free today.</li>
              <li>Claim a file is clean when a part of it was not read. The result says what was kept and why.</li>
            </ul>
          </div>
        </div>
      </Section>
      <Section labelledBy="h-who">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <h2 id="h-who" className="text-[1.75rem] sm:text-[2.25rem] lg:col-span-4">Who makes it.</h2>
          <div className="prose lg:col-span-8">
            <p>FileSanity is made and run by a small company with no investors and no data business. The people behind it and the registered company details will be listed here before launch.</p>
            <ClientNote>Client to supply: the founders' names and roles, the company's legal name and registration number, and the country of incorporation.</ClientNote>
          </div>
        </div>
      </Section>
      <Closer title="The product is the argument." text="Drop a file on the home page and watch what it does." />
    </>
  )
}
