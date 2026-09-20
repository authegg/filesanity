/** FileSanity Cloud plans. Prices and checkout links live here and nowhere else; the /cloud page and the API's own
 *  page read them. Checkout links are the Lemon Squeezy "buy" URLs for each variant. */
export type PlanKey = 'starter' | 'business'
export const PLANS: Record<PlanKey, { name: string; price: number; files: number; maxBytes: number; checkout: string; who: string }> = {
  starter: { name: 'Starter', price: 19, files: 10_000, maxBytes: 100e6, checkout: 'https://filesanity.lemonsqueezy.com/buy/STARTER_VARIANT_UUID', who: 'one product, one key' },
  business: { name: 'Business', price: 79, files: 100_000, maxBytes: 100e6, checkout: 'https://filesanity.lemonsqueezy.com/buy/BUSINESS_VARIANT_UUID', who: 'a platform, several keys' },
}
export const TRIAL = { name: 'Trial', price: 0, files: 500, maxBytes: 25e6, checkout: '', who: 'to try it' }
export const CLOUD = 'https://api.filesanity.com'
