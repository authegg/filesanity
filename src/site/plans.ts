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
  maxBytes: number // largest file the hosted API takes (two copies must fit a Worker's 128 MB); the browser has no limit
  checkout: string // Paddle price id; '' while plans are not on sale
  items: string[]
}

// Paddle.js overlay checkout on /account. The client token (VITE_PADDLE_TOKEN at build) is public; none keeps the plans
// off sale. A test_ token means sandbox. Sandbox and live have their own price ids (the Worker's PADDLE_PRICE_* must match).
const token: string = import.meta.env?.VITE_PADDLE_TOKEN ?? '' // the Worker imports this file and has no import.meta.env
export const PADDLE = { env: token.startsWith('test_') ? 'sandbox' : 'production', token }
const sell = (live: string, sandbox: string) => (!PADDLE.token ? '' : PADDLE.env === 'sandbox' ? sandbox : live)

export const PLANS: Record<PlanKey, Plan> = {
  free: {
    name: 'Free', price: 0, who: 'For anyone', seats: 1, batch: false, apiFiles: 50, maxBytes: 10e6, checkout: '',
    items: ['Every format, one file at a time', 'The report for each file', 'Works offline, no account needed'],
  },
  pro: {
    name: 'Pro', price: 6, who: 'For one person who sends files often', seats: 1, batch: true, apiFiles: 1000, maxBytes: 25e6,
    checkout: sell('pri_01m53tp6e6hx9m8bqbyazpaq6z', 'pri_01m530fy3k84nhmp59dzwc0ekj'),
    items: ['Batches of any size, zips in and out', 'Saved policy: choose what to keep', 'A record of every batch'],
  },
  team: {
    name: 'Team', price: 24, who: 'For a firm of up to five', seats: 5, batch: true, apiFiles: 5000, maxBytes: 25e6,
    checkout: sell('pri_01m53tpag4n7018wk8cnnewn46', 'pri_01m530fynd1297384r6bjax1tz'),
    items: ['Pro for five people', 'One policy shared by the team', 'Signed reports from the API'],
  },
  api: {
    name: 'API', price: 29, who: 'For systems that clean files', seats: 1, batch: true, apiFiles: 50000, maxBytes: 25e6,
    checkout: sell('pri_01m53tpckbwe97hcwjbarjtgyg', 'pri_01m530fz6h64z1gqjvb3bn17b0'),
    items: ['50,000 files a month by API key', 'Signed reports', 'Files go to our server for one request, then are gone'],
  },
}

export const PAID: PlanKey[] = ['pro', 'team', 'api']
export const fmtPrice = (p: Plan) => (p.price ? `$${p.price}` : '$0')
