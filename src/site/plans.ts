/** Plans: one table read by the pricing page, the account page and the Worker. Billing is Paddle (merchant of
 *  record); the API quotas are still the owner's to confirm. */
export type PlanKey = 'free' | 'pro' | 'team' | 'api'

export type Plan = {
  name: string
  price: number // US dollars a month
  who: string
  seats: number
  batch: boolean // batches of more than one file, saved policies, the batch record
  apiFiles: number // hosted API files a month
  maxBytes: number // largest file the hosted API takes
  checkout: string // Paddle price id; '' while plans are not on sale
  items: string[]
}

// Paddle.js overlay checkout on /account. The client token is public; an empty token keeps the plans off sale. Sandbox
// and live have their own token and price ids (the Worker's PADDLE_PRICE_* must match).
export const PADDLE = { env: 'sandbox' as 'sandbox' | 'production', token: '' }
const sell = (price: string) => (PADDLE.token ? price : '')

export const PLANS: Record<PlanKey, Plan> = {
  free: {
    name: 'Free', price: 0, who: 'For anyone', seats: 1, batch: false, apiFiles: 50, maxBytes: 10e6, checkout: '',
    items: ['Every format, one file at a time', 'The report for each file', 'Works offline, no account needed'],
  },
  pro: {
    name: 'Pro', price: 6, who: 'For one person who sends files often', seats: 1, batch: true, apiFiles: 1000, maxBytes: 50e6,
    checkout: sell('pri_01m530fy3k84nhmp59dzwc0ekj'),
    items: ['Batches of any size, zips in and out', 'Saved policy: choose what to keep', 'A record of every batch'],
  },
  team: {
    name: 'Team', price: 24, who: 'For a firm of up to five', seats: 5, batch: true, apiFiles: 5000, maxBytes: 50e6,
    checkout: sell('pri_01m530fynd1297384r6bjax1tz'),
    items: ['Pro for five people', 'One policy shared by the team', 'Signed reports from the API'],
  },
  api: {
    name: 'API', price: 29, who: 'For systems that clean files', seats: 1, batch: true, apiFiles: 50000, maxBytes: 100e6,
    checkout: sell('pri_01m530fz6h64z1gqjvb3bn17b0'),
    items: ['50,000 files a month by API key', 'Signed reports', 'Files go to our server for one request, then are gone'],
  },
}

export const PAID: PlanKey[] = ['pro', 'team', 'api']
export const fmtPrice = (p: Plan) => (p.price ? `$${p.price}` : '$0')
