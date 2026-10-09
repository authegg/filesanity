import { MAKER, REPO } from '../content'
import { Block, Head } from '../ui'

export const meta = {
  title: 'About FileSanity',
  description: 'FileSanity is an open-source metadata cleaner that works in the browser, made by authegg under the MIT licence.',
}

export default function About() {
  return (
    <>
      <Head h1="A small tool that does one job." lede="FileSanity removes what a file says about the person who made it, without ever seeing the file. It is open source, and it is made by a small studio." />
      <Block id="h-why" title="Why it exists">
        <p>Journalists, lawyers, HR staff, freelancers and people selling things online are told to strip metadata before a file goes to a stranger. Most tools for it either need installing or ask you to upload the file to their server, which is the very thing a careful person hesitates at.</p>
        <p>A browser can do the job by itself. FileSanity is that code, with a page around it that says plainly what it reads, what it removes and what it cannot do yet.</p>
      </Block>
      <Block id="h-wont" title="What it will not do">
        <ul>
          <li>Upload a file from this website. The hosted API is the one service that receives files, and it says so.</li>
          <li>Add analytics, advertising or tracking.</li>
          <li>Call a file clean when part of it could not be read.</li>
          <li>Put cleaning a single file behind an account or a payment.</li>
        </ul>
      </Block>
      <Block id="h-who" title="Who makes it">
        <p>FileSanity is made by {MAKER}, an independent studio based in the Philippines, and published under the MIT licence. The parsers are written for this project, with tests that check every claim on this site against real files. They are all in <a href={REPO}>one repository on GitHub</a>.</p>
        <p>Payments for the paid plans go through Lemon Squeezy, which acts as the seller and handles tax and invoices.</p>
      </Block>
    </>
  )
}
