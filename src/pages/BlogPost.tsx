import type { ComponentType } from 'react'
import { fmtDate, type Post } from '../posts'
import { PageHead, Pill } from '../ui/bits'

/** One route per post: the title as h1, the date line, the body in .prose, the one CTA at the end. */
export const postPage = (post: Post): ComponentType => function PostPage() {
  const { meta: m, default: Body } = post
  return (
    <article>
      <PageHead eyebrow="Blog" title={m.title}>
        <p className="mt-5 text-[0.9375rem] text-muted">
          <time dateTime={m.date}>{fmtDate(m.date)}</time>
          {m.updated && <>, updated <time dateTime={m.updated}>{fmtDate(m.updated)}</time></>}
          <span className="mx-2" aria-hidden="true">&middot;</span>
          {m.readingMinutes} min read
          <span className="mx-2" aria-hidden="true">&middot;</span>
          <span>FileSanity</span>
        </p>
      </PageHead>
      <div className="container-x pt-12 sm:pt-16">
        <div className="prose max-w-[68ch]">
          <Body />
        </div>
        <div className="mt-12 flex flex-wrap items-center gap-6 border-t border-hair-2 pt-8">
          <Pill href="/">Clean a file</Pill>
          <a className="link" href="/blog">All posts</a>
        </div>
      </div>
    </article>
  )
}
