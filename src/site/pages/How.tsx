import { API_LIMITS } from '../plans'
import { Block, Head } from '../ui'

export const meta = {
  title: 'How FileSanity works: read, show, remove, in the browser',
  description: 'How FileSanity reads a file\'s metadata and writes a clean copy inside your browser tab, what it changes, what it leaves, and when a file does leave your device.',
}

export default function How() {
  return (
    <>
      <Head h1="It reads the file where the file already is." lede="A browser can open a file's bytes, find the parts that describe the file, and write a copy without them. FileSanity is the code that does that, a few thousand lines you can read, and the page around it." />
      <Block id="h-read" title="1. Read">
        <p>When you drop, paste or choose a file, the browser hands its bytes to the page. Nothing is sent anywhere. FileSanity looks at the first bytes to decide what the file is, whatever its name says, and then walks its structure.</p>
        <ul>
          <li><b>JPEG:</b> the APP segments before the image data: EXIF, XMP, IPTC, Photoshop blocks and comments.</li>
          <li><b>PNG:</b> the text chunks, eXIf, iTXt XMP and the time chunk.</li>
          <li><b>HEIC and WebP:</b> the Exif and XMP items or chunks.</li>
          <li><b>MP4 and MOV video, M4A and MP3 audio:</b> the user-data and metadata boxes, header times, and ID3 tags.</li>
          <li><b>Word, Excel, PowerPoint and OpenDocument:</b> the zip's core, app and custom property parts, the thumbnail, comments, and tracked changes.</li>
          <li><b>PDF:</b> the document information dictionary and the XMP metadata stream.</li>
        </ul>
      </Block>
      <Block id="h-show" title="2. Show">
        <p>Every field found is listed with its value, sorted by what it gives away: who made the file, where it was, when, and on what. Technical fields like exposure come last. If a part could not be read, the list says so and says why.</p>
      </Block>
      <Block id="h-remove" title="3. Remove">
        <p>FileSanity writes a new copy. In JPEG, PNG and WebP the metadata segments are left out of the copy; in HEIC and video they are blanked in place, at the same length, so the file's offsets hold. In Office files the property parts are replaced with empty ones, the thumbnail and the comments are dropped, and tracked changes are accepted: inserted text stays, deleted text goes. In PDFs the text of each field is blanked in place, so the byte offsets the PDF depends on stay valid. Otherwise the picture, the text, the cells and the slides are copied as they are.</p>
        <p>One limit, said plainly: when a PDF is encrypted, FileSanity shows its metadata and keeps it, and the result tells you, instead of calling the file clean.</p>
      </Block>
      <Block id="h-keep" title="Keeping some fields">
        <p>Sometimes you want a field to stay: the copyright line on a photographer's picture, or the title of a contract. With a <a href="/batch">batch</a> you set a policy, the kinds of field to keep, and it applies to every file. Pro and Team accounts save the policy so it is the same next time.</p>
      </Block>
      <Block id="h-leave" title="When a file does leave">
        <p>Once, by design: the <a href="/developers">hosted API</a> is for your own systems, which call it with a key. A file sent to the API is held on our server for the length of one request: in memory, or, over {API_LIMITS.memory / 1e6} MB, in temporary storage that is deleted when the reply is sent. It is not kept. Everything on this website, batches included, runs in your browser.</p>
      </Block>
    </>
  )
}
