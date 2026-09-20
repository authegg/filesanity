export const meta = {
  slug: 'what-a-pdf-carries',
  title: 'What a PDF carries, and the honest limits',
  description: 'The Info dictionary and the XMP packet are where a PDF stores its author, software and dates. FileSanity blanks them in place. What it cannot reach yet, and how the page tells you.',
  date: '2026-09-16',
  readingMinutes: 3,
}

export default function Post() {
  return (
    <>
      <p>A PDF is a file of numbered objects and a table that says where each one starts. That table is the reason PDF metadata is awkward to remove: take bytes out of the middle of the file and every offset after them is wrong. This post explains where the metadata lives, what FileSanity does about it, and where it stops.</p>

      <h2>The Info dictionary</h2>
      <p>The oldest place. The file's trailer names one object as Info, and that object holds a handful of strings: Title, Author, Subject, Keywords, Creator, Producer, CreationDate and ModDate. Creator is the application that made the original, such as Word; Producer is the library that wrote the PDF, with its version. The dates carry a time zone. The author is whatever name the application had for you.</p>
      <p>A PDF that has been saved several times can hold several trailers, each pointing at an Info object, and an older Info can survive below a newer one. FileSanity follows every Info reference in the file and finds every copy of each object.</p>

      <h2>The XMP packet</h2>
      <p>The newer place, the same XML packet that photographs carry. It repeats the Info fields and adds identifiers: a document ID, an instance ID, and often a history of the versions this file went through. The packet sits in a stream object marked as Metadata.</p>
      <p>Here is the distinction that matters. The stream can be stored as plain text, which some producers do, or compressed, which Word and Acrobat almost always do. A plain packet can be found and edited. A compressed one cannot be edited without decompressing it, recompressing it and then rewriting the offset table for everything after it.</p>

      <h2>What FileSanity does</h2>
      <p>It blanks values in place, at the same length. Each Info string becomes the same number of spaces. Each attribute value and each text node in a plain XMP packet becomes spaces too, while the tags, the namespace declarations and the packet markers stay, so the packet is still well-formed XML and still exactly as long. Because nothing moves, the offset table is still correct and the file opens in every reader.</p>
      <p>That is the whole edit. The page content, the fonts, the images and the structure are untouched.</p>

      <h2>What it shows and keeps</h2>
      <p>A compressed XMP stream is detected and listed in the table as a compressed stream, kept, with the reason beside it. The result line then reads, for example, eight removed, one kept, and the note under the table says that the file carries a compressed packet that this version does not rewrite. You are told, rather than shown a green tick.</p>
      <p>Some PDFs, especially those written by recent versions of Acrobat and by print workflows, store most of their objects inside compressed object streams, including the Info dictionary. When FileSanity sees object streams and finds no Info dictionary to blank, the note says so and tells you to treat the file as not cleaned. Files over 256 MB are not scanned at all.</p>

      <h2>What no metadata cleaner reaches</h2>
      <p>A PDF can carry a name in places that are not metadata. Each comment and annotation has an author field. Form fields hold whatever was typed into them. A file can have attachments, each with its own metadata. A redaction drawn as a black box over text leaves the text underneath. Bookmarks and the document outline can be written by a person. FileSanity reads none of those in this version, and neither does the table pretend to.</p>

      <h2>What to do when the note appears</h2>
      <p>If you need the file clean and the result says a compressed packet was kept, or that the file was not cleaned, there are two reliable routes. Open the PDF and print it to a new PDF, which produces a fresh file with only the printing application's own metadata, and then clean that one. Or go back to the source document, clean it, and export the PDF again from the clean source. Either way, drop the final file on the home page and read the table before you send it. The table is the check, and it is honest about what it cannot see.</p>
    </>
  )
}
