/** Shared across the tools: the formats line. */
export const CHROME = 'https://chromewebstore.google.com/detail/nlhdbbnjdjaeloofbgddkladdagleghk'
export const FIREFOX = 'https://addons.mozilla.org/firefox/addon/filesanity/'
/** The store for this browser, or null where extensions do not install (phones, Safari). Client-only: call after hydration. */
export const store = () => /Android|iPhone|iPad|Mobile/.test(navigator.userAgent) ? null : /Firefox\//.test(navigator.userAgent) ? { name: 'Firefox', href: FIREFOX } : /Chrome\//.test(navigator.userAgent) ? { name: 'Chrome', href: CHROME } : null
export const FORMATS = 'JPEG, PNG, HEIC, WebP, MP4, MOV, M4A, MP3, Word, Excel, PowerPoint, OpenDocument and PDF'
