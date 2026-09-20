import { POSTS, fmtDate } from '../posts'
import { Closer, PageHead, Section } from '../ui/bits'

export const meta = {
  title: 'Blog: notes on the metadata files carry',
  description: 'Short, factual posts on the metadata inside photographs, Office documents and PDFs, how FileSanity removes it, and what to check before you send a file.',
}

export default function Blog() {
  return (
    <>
      <PageHead eyebrow="Blog" title="Notes on what files carry." lede="One post per subject, written from the parsers. No news, no announcements; the changelog has those." />
      <Section>
        <ol className="rows border-b border-hair-2">
          {POSTS.map(({ meta: m }, i) => (
            <li key={m.slug} className="grid grid-cols-1 gap-4 py-8 md:grid-cols-12 md:gap-8" data-reveal="" style={{ '--d': `${i * 60}ms` } as React.CSSProperties}>
              <div className="bezel max-w-[16rem] md:col-span-3 md:max-w-none">
                <div className="plate overflow-hidden">
                  <img src={`/img/blog/${m.image.name}-768.avif`} width={768} height={512} loading="lazy" decoding="async" alt={m.image.alt} className="aspect-[3/2] w-full object-cover" />
                </div>
              </div>
              <div className="md:col-span-9">
                <p className="text-[0.9375rem] text-muted">
                  <time dateTime={m.date}>{fmtDate(m.date)}</time>
                  <span className="mx-2" aria-hidden="true">&middot;</span>
                  {m.readingMinutes} min read
                </p>
                <h2 className="mt-2 text-[1.375rem]"><a href={`/blog/${m.slug}`} className="hover:text-accent">{m.title}</a></h2>
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
