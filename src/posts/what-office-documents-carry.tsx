export const meta = {
  slug: 'what-office-documents-carry',
  title: 'What a Word, Excel or PowerPoint file carries',
  description: 'A .docx, .xlsx or .pptx is a zip of XML parts. Three of them are about you: core, app and custom properties. Plus a thumbnail, the zip timestamps, and the names on tracked changes.',
  date: '2026-09-17',
  readingMinutes: 4,
}

export default function Post() {
  return (
    <>
      <p>Rename a .docx to .zip and open it. What you see is a folder of XML files, called parts, with a manifest that says which is which. The text of the document is in one part, the styles in another, each picture in its own file. Excel and PowerPoint packages are built the same way. This is the Office Open XML format, and it is why FileSanity can read these files without Word.</p>
      <p>Three of the parts are about you rather than about the document. They sit in a folder called <code>docProps</code>.</p>

      <h2>core.xml</h2>
      <p>The properties Office shows under File and Info. The author, which is the name in your Office account. The person who last saved it, which is often a different name and often the more interesting one. The creation and modification dates. The revision count, which is how many times the file has been saved. The title, subject, keywords, category and comments fields, sometimes filled by a template years ago. The date it was last printed.</p>

      <h2>app.xml</h2>
      <p>What the application recorded about itself and its environment. The application name and version. The company, taken from the Office installation, which on a work laptop is your employer even when the document is personal. A manager field. The template the file was started from, with its file name. The total editing time in minutes. Page, word, character, line and paragraph counts, or slide and note counts, and the titles of the parts. A hyperlink base, which can be a folder path on your machine or a share on your network.</p>

      <h2>custom.xml</h2>
      <p>Anything else an organisation chose to attach: a document management system's identifiers, a classification label, a client code, a matter number. Most personal files have none. Files that have left a corporate system usually do.</p>

      <h2>The thumbnail</h2>
      <p>If the file was saved with a preview, there is a small picture of the first page in <code>docProps</code>. It is a rendering of the page as it was at that save, so a document that was later edited can still carry its earlier first page.</p>

      <h2>The zip's own timestamps</h2>
      <p>Every entry in a zip archive has a modification date and time of its own, separate from anything in the XML. Office writes the moment of saving into each one. They are metadata too, and most cleaners leave them alone.</p>

      <h2>What FileSanity does</h2>
      <p>The three property parts are replaced with empty ones. Not removed: the package's manifest still expects them, and Office opens an empty property part without complaint. The thumbnail is dropped and the relationship that pointed at it is removed from the package's root relationships, so nothing dangles. Every entry's timestamp is reset to the first of January 1980, the earliest date the format allows.</p>
      <p>Every other part is copied byte for byte, still compressed. The document text, the styles, the pictures, the formulas, the slides: none of it is inflated, parsed or re-saved. The clean file opens in Word, Excel or PowerPoint exactly as before, with the properties blank.</p>

      <h2>What is shown and kept</h2>
      <p>In a Word document, every tracked change and every comment carries the name of the person who made it. FileSanity reads <code>word/document.xml</code> and <code>word/comments.xml</code>, counts the changes and comments by author, and lists each name with its count in the table, marked as kept.</p>
      <p>Kept, because removing them is not a metadata operation. Accepting a tracked change alters the text of the document; deleting a comment deletes something a person wrote. Those are decisions about the document itself, and they belong in Word, where you can see what each one says. What FileSanity can do is tell you the names are there before you send the file. If you did not know the document still carried a reviewer's name, that is the point at which you find out.</p>
      <p>Excel and PowerPoint comments are not listed in this version, and the pictures pasted inside any Office document keep their own EXIF. A photograph inserted into a report still carries its position and its camera until you clean the photograph first and insert the clean one.</p>

      <h2>The legacy formats</h2>
      <p>A .doc, .xls or .ppt is not a zip. It is a binary compound file, and it carries the same properties in a different structure, along with things the newer format dropped, such as the names of the last ten authors. FileSanity does not read it yet. If you have one, save it as .docx first and clean that.</p>
    </>
  )
}
