const COLS: [string, [string, string][]][] = [
  ['Product', [['/how-it-works', 'How it works'], ['/formats', 'Formats'], ['/pricing', 'Pricing'], ['/changelog', 'Changelog'], ['/blog', 'Blog']]],
  ['Tools', [['/batch', 'Batch'], ['/cli', 'Command line'], ['/api', 'API'], ['/extension', 'Extension'], ['/source/', 'Source']]],
  ['What files carry', [['/photos', 'Photos'], ['/documents', 'Documents'], ['/pdf', 'PDF'], ['/security', 'Security'], ['/faq', 'FAQ']]],
  ['Company', [['/about', 'About'], ['/contact', 'Contact'], ['/privacy', 'Privacy policy'], ['/terms', 'Terms']]],
]

export function Footer({ path }: { path: string }) {
  return (
    <footer className="container-x mt-24 pb-10 sm:mt-32">
      <div className="rows">
        <div className="grid grid-cols-1 gap-8 pt-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <a href="/" className="text-[0.9375rem] font-semibold tracking-[-0.01em]">FileSanity</a>
            <p className="mt-3 max-w-[34ch] text-[0.875rem] leading-relaxed text-muted">
              Reads and removes the metadata in a file, inside your browser. Nothing is uploaded, stored or counted.
            </p>
          </div>
          {COLS.map(([head, links]) => (
            <div key={head} className="md:col-span-2 md:first:col-start-5">
              <h2 className="text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-muted">{head}</h2>
              <ul className="mt-3 space-y-2">
                {links.map(([href, label]) => (
                  <li key={href}>
                    <a href={href} aria-current={path === href ? 'page' : undefined} className="text-[0.875rem] text-ink hover:text-accent aria-[current=page]:text-accent">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-10 pt-6 text-[0.8125rem] text-muted">
          No account, no cookies, no analytics. The sample photograph is generated and its metadata is invented.
        </p>
      </div>
    </footer>
  )
}
