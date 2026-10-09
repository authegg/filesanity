/** Plans: one table read by the pricing page, the account page and the Worker. Prices, quotas and the Lemon Squeezy
 *  buy links are placeholders until the owner confirms them (PLACEHOLDERS.md); the page marks every price as such. */
export type PlanKey = 'free' | 'pro' | 'team' | 'api'

export type Plan = {
  name: string
  price: number // US dollars a month
  who: string
  seats: number
  batch: boolean // batches of more than one file, saved policies, the batch record
  apiFiles: number // hosted API files a month
  maxBytes: number // largest file the hosted API takes
  checkout: string // Lemon Squeezy buy link; '' for free
  items: string[]
}

export const PLANS: Record<PlanKey, Plan> = {
  free: {
    name: 'Free', price: 0, who: 'For anyone', seats: 1, batch: false, apiFiles: 50, maxBytes: 10e6, checkout: '',
    items: ['Every format, one file at a time', 'The report for each file', 'Works offline, no account needed'],
  },
  pro: {
    name: 'Pro', price: 6, who: 'For one person who sends files often', seats: 1, batch: true, apiFiles: 1000, maxBytes: 50e6,
    checkout: '', // ponytail: empty until the Lemon Squeezy buy link exists; the account page says paid plans open soon
    items: ['Batches of any size, one zip', 'Saved policy: choose what to keep', 'A record of every batch'],
  },
  team: {
    name: 'Team', price: 24, who: 'For a firm of up to five', seats: 5, batch: true, apiFiles: 5000, maxBytes: 50e6,
    checkout: '', // ponytail: empty until the Lemon Squeezy buy link exists; the account page says paid plans open soon
    items: ['Pro for five people', 'One policy shared by the team', 'Signed reports from the API'],
  },
  api: {
    name: 'API', price: 29, who: 'For systems that clean files', seats: 1, batch: true, apiFiles: 50000, maxBytes: 100e6,
    checkout: '', // ponytail: empty until the Lemon Squeezy buy link exists; the account page says paid plans open soon
    items: ['50,000 files a month by API key', 'Signed reports', 'Files go to our server for one request, then are gone'],
  },
}

export const PAID: PlanKey[] = ['pro', 'team', 'api']
export const fmtPrice = (p: Plan) => (p.price ? `$${p.price}` : '$0')
