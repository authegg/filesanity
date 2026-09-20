import { PageHead, Pill, Section } from '../ui/bits'

export const meta = {
  title: 'Page not found',
  description: 'There is no page at this address. The link may be mistyped or the page may have moved. Nothing was sent anywhere by trying.',
}

export default function NotFound() {
  return (
    <>
      <PageHead eyebrow="404" title="There is no page here." lede="The address may be mistyped, or the page may have moved. Nothing was sent anywhere by trying." />
      <Section>
        <div className="flex flex-wrap gap-4">
          <Pill href="/">Clean a file</Pill>
          <Pill href="/faq" ghost>Read the FAQ</Pill>
        </div>
      </Section>
    </>
  )
}
