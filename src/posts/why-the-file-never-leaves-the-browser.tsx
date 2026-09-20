export const meta = {
  slug: 'why-the-file-never-leaves-the-browser',
  title: 'Why the file never leaves your browser',
  description: 'A page can read bytes from a file and write a new one with no server. How the File API, byte-range reads and Blobs do it, and how the network panel shows it.',
  date: '2026-09-19',
  readingMinutes: 4,
}

export default function Post() {
  return (
    <>
      <p>Most metadata cleaners on the web are upload forms. The file goes to a server, a program there rewrites it, and the result comes back. That design asks you to trust the server's storage, its logs and its deletion policy, and to trust that nothing between you and it kept a copy. FileSanity is built so that the question never arises. Here is what that means in practice.</p>

      <h2>A handle, not a copy</h2>
      <p>When you drop, paste or choose a file, the browser gives the page a File object. It is a handle: a name, a size and permission to read. Nothing is read until the page asks, and the page asks by byte range. A JPEG parser reads the header segments and stops at the start of the picture. An Office package is read at its end, where the zip directory is, and then only the three property parts and the thumbnail are inflated. A PDF is the exception; it is scanned whole, because its metadata can sit anywhere.</p>
      <p>These reads happen in the browser's own memory, with the browser's own APIs. There is no plugin and no library from a third party. The two compression steps that Office files need use the DecompressionStream and CompressionStream that ship in every current browser.</p>

      <h2>A new file from slices</h2>
      <p>The clean copy is a Blob, which is the browser's word for a sequence of bytes that can be saved. It is assembled from pieces: a slice of the original from here to there, a small block the page wrote, another slice. For a JPEG the pieces are the segments that were not metadata, and the picture. For a PDF they are the original with a few runs of spaces in place of the values. Nothing is decoded, rendered or re-encoded, so the picture or the document is not touched.</p>
      <p>The browser then offers the Blob as a download, under the original name with -clean before the extension. Once the tab closes, the handle, the report and the Blob are gone.</p>

      <h2>How to check it yourself</h2>
      <p>The proof is not this page. It is your browser's network panel, which lists every request a page makes.</p>
      <ul>
        <li>In Firefox, press Ctrl+Shift+E (Cmd+Option+E on a Mac). In Chrome or Edge, press F12 and choose the Network tab.</li>
        <li>Load the home page, then clear the list.</li>
        <li>Drop a file, wait for the table, press Remove all and download.</li>
      </ul>
      <p>No request to any server appears. No upload, no call to an API, no beacon that reports which file kind was dropped. The counter beside the result, Requests since read, shows the same fact from inside the page: it is fed by the browser's own performance observer, and it stays at zero.</p>
      <p>Then go further. Turn off your network connection and repeat the steps. The page still reads and cleans the file, because nothing was needed from anywhere. The one thing the site fetches on demand is the sample photograph, and only when you press Try a sample.</p>

      <h2>What the page is made of</h2>
      <p>The site is static files served from one place: the HTML for each page, a stylesheet, a script and a font. There is no server-side code, no account system and no database. The site sets no cookies and loads no analytics, which is why there is no banner. The parsers are published as plain text at /source, and the shipped script carries a source map, so the developer tools show the original files rather than a minified bundle. Each parser is a few hundred lines. You can read the JPEG one in the time it takes to drink a coffee.</p>

      <h2>What this does not protect</h2>
      <p>The browser is the boundary. A browser extension with access to the page, a synced downloads folder, or software on the machine can see the file regardless. And a clean file is only clean of metadata: a photograph of your street still shows your street, and a document that names you still names you. The security page lists the threat model in full.</p>
      <p>What the design does guarantee is narrow and checkable. The file is opened on your device, read on your device, rewritten on your device, and saved on your device. That is not a policy. It is the absence of anywhere else for it to go.</p>
    </>
  )
}
