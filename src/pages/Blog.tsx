import { POSTS, fmtDate } from '../posts'
import { Closer, PageHead, Section } from '../ui/bits'

export const meta = {
  title: 'Blog: notes on what files carry',
  description: 'Short, factual posts on the metadata inside photographs, Office documents and PDFs, how FileSanity removes it in the browser, and what to check before you send a file.',
}

export default function Blog() {
  return (
    <>
      <PageHead eyebrow="Blog" title="Notes on what files carry." lede="One post per subject, written from the parsers. No news, no announcements; the changelog has those." />
      <Section>
        <ol className="rows border-b border-hair-2">
          {POSTS.map(({ meta: m }, i) => (
            <li key={m.slug} className="grid grid-cols-1 gap-3 py-8 md:grid-cols-12 md:gap-8" data-reveal="" style={{ '--d': `${i * 60}ms` } as React.CSSProperties}>
              <p className="text-[0.9375rem] text-muted md:col-span-4">
                <time dateTime={m.date}>{fmtDate(m.date)}</time>
                <span className="mx-2" aria-hidden="true">&middot;</span>
                {m.readingMinutes} min read
              </p>
              <div className="md:col-span-8">
                <h2 className="text-[1.375rem]"><a href={`/blog/${m.slug}`} className="hover:text-accent">{m.title}</a></h2>
                <p className="mt-2 max-w-[60ch] text-[0.9375rem] text-muted">{m.description}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-6 text-[0.8125rem] text-muted"><a className="link" href="/blog/feed.xml">RSS feed</a></p>
      </Section>
      <Closer title="The table is quicker than the post." text="Drop a file on the home page and read what it carries." />
    </>
  )
}
