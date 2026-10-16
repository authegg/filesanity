import { FAQ } from '../content'
import { Head } from '../ui'

export const meta = {
  title: 'FAQ: uploads, formats, accounts and billing',
  description: 'Answers about FileSanity: whether files are uploaded, what is removed, what cannot be cleaned yet, accounts, billing and the source code.',
}

export default function Faq() {
  return (
    <>
      <Head h1="Questions, answered plainly." lede="If yours is not here, write to us. The address is on the contact page." />
      {FAQ.map((g, i) => (
        <section className="sec faq" aria-labelledby={`g${i}`} key={g.group}>
          <div className="wrap faq-in">
            <h2 id={`g${i}`}>{g.group}</h2>
            <dl>{g.items.map(([q, a]) => <div key={q}><dt>{q}</dt><dd>{a}</dd></div>)}</dl>
          </div>
        </section>
      ))}
    </>
  )
}
