import { MAIL, UPDATED } from '../content'
import { Block, Head } from '../ui'

export const meta = {
  title: 'Refund policy',
  description: 'Paid FileSanity plans: a full refund within 14 days of the first payment, and how to cancel.',
}

export default function Refunds() {
  return (
    <>
      <Head h1="Refund policy" lede={`Last updated ${UPDATED}.`} />
      <Block id="r-14" title="14 days, in full">
        <p>If a paid plan is not right for you, write to <a href={`mailto:${MAIL}`}>{MAIL}</a> from your account's address within 14 days of your first payment and we refund it in full.</p>
      </Block>
      <Block id="r-after" title="After 14 days">
        <p>A month already started is not refunded, except where the law where you live says otherwise. Cancel at any time from your account page and the plan runs to the end of the month paid for; nothing more is charged.</p>
      </Block>
      <Block id="r-how" title="How the refund is paid">
        <p>Paid plans are sold by Paddle as merchant of record, so the refund goes back through Paddle to the card or account you paid with. You can also ask Paddle directly through the link in your receipt email.</p>
      </Block>
    </>
  )
}
