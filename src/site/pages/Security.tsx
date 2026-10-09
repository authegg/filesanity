import { REPO } from '../content'
import { Block, Head } from '../ui'

export const meta = {
  title: 'Security: how to check that your file stays on your device',
  description: 'Three ways to check that FileSanity never uploads your file, what the account stores, how sign-in works, and how to report a problem.',
}

export default function Security() {
  return (
    <>
      <Head h1="Don't trust us. Check." lede="The claim is simple: on this website, your file never leaves your device. Here is how to check it in a minute, without reading any code." />
      <Block id="h-check" title="Three checks">
        <ol>
          <li><b>The counter.</b> Under the cleaner, the page counts every network request it makes after your file arrives, from the browser's own resource timing. Clean a file and watch it stay at 0.</li>
          <li><b>The network panel.</b> Open your browser's developer tools (F12), choose Network, then clean a file. No request carries it.</li>
          <li><b>Offline.</b> Load the page, turn off Wi-Fi or switch to aeroplane mode, and clean a file. It works, because nothing needed sending.</li>
        </ol>
      </Block>
      <Block id="h-page" title="What the page loads">
        <p>The site's own HTML, script, styles, font and images, all from filesanity.com. No analytics, no advertising, no tracking pixel, no third-party script. The one exception is the sign-in page, which loads Cloudflare Turnstile to stop automated sign-up requests; it never sees a file.</p>
        <p>The pages are served with a Content Security Policy that only lets them connect back to filesanity.com, so even a mistake in our code could not send a file somewhere else.</p>
      </Block>
      <Block id="h-account" title="What an account stores">
        <p>Your email address, your plan and its renewal date from Lemon Squeezy, the names and last four characters of your API keys (the keys themselves are stored only as SHA-256 hashes), your team's email addresses, your saved policy, and a monthly count of API files. Nothing about any file you clean in the browser, because we never see one.</p>
        <p>Sign-in is by a link sent to your email, good once for 15 minutes. The session is one cookie, HttpOnly and Secure, that lasts 30 days or until you sign out.</p>
      </Block>
      <Block id="h-api" title="The hosted API">
        <p>Files sent to the <a href="/developers">API</a> are held in memory on Cloudflare's network for one request and are not written anywhere. If that is not acceptable for a file, <a href={REPO}>self-host the same API</a>.</p>
      </Block>
      <Block id="h-report" title="Report a problem">
        <p>If you find a security problem, or a file that FileSanity said was clean but was not, email <a href="mailto:hello@filesanity.com?subject=Security">hello@filesanity.com</a> with "Security" in the subject or open an issue on <a href={`${REPO}/issues`}>GitHub</a>. Please send a sample file with invented data, not a real one.</p>
      </Block>
    </>
  )
}
