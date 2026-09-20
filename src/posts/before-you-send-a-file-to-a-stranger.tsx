export const meta = {
  slug: 'before-you-send-a-file-to-a-stranger',
  title: 'Before you send a file to a stranger: a checklist',
  description: 'Which metadata fields matter most for journalists, lawyers, HR and marketplace sellers, and the two-minute routine that catches them before the file goes.',
  date: '2026-09-20',
  readingMinutes: 4,
}

export default function Post() {
  return (
    <>
      <p>Most files are sent to people you know, and it does not matter that the document says who wrote it. The risk is the other case: a listing photo to a buyer, a source's document to a newsroom, a draft to the other side, a CV to a recruiter. This is a short list of what to look for in that case, by the kind of work, and a routine that takes two minutes.</p>

      <h2>The fields that matter most</h2>
      <p>Across every format, five kinds of value do most of the damage.</p>
      <ul>
        <li>Position. GPS latitude, longitude and altitude in a photograph. A listing photo carries the street; a photo of a child carries the school.</li>
        <li>Names. The author and last-saved-by fields in a document, the artist or owner field in a camera, the by-line in a press photo, the author of a tracked change.</li>
        <li>Times. The moment a photo was taken, with its time zone, and the created, modified and last-printed dates of a document.</li>
        <li>Identity of the device or the organisation. A camera body serial number, a phone model, the company field from an Office installation, a template name, a document management system's codes.</li>
        <li>History. The revision count and total editing time of a document, the edit history in an XMP packet, and the thumbnail that still shows the page or the picture before it was changed.</li>
      </ul>

      <h2>Journalists</h2>
      <p>A document from a source carries the source. The author, the last-saved-by name, the company and the template name in a Word file can identify a person or an office on their own. Clean the file before it goes anywhere, and read the kept rows: tracked-change and comment authors are listed, not removed, so if a name is there, the fix is in Word, not here. A photograph from a source carries where and when it was taken and what phone took it. Clean it before it is shared with anyone, including colleagues.</p>

      <h2>Lawyers</h2>
      <p>A draft sent to the other side carries the revision count, the editing time, the person who last saved it and, if changes were tracked, the name of everyone who touched it. A PDF exported from that draft carries the author and the software. Clean the Word file first, then export the PDF, then clean the PDF, then read its table: if it reports a compressed packet kept, the export tool wrote metadata FileSanity does not rewrite yet, and the safe route is to print the PDF to a fresh PDF and clean that. Remember that comments and tracked changes are content: accept or reject them in Word before you export.</p>

      <h2>HR</h2>
      <p>Offer letters, references and policy documents are usually started from a template, and the template's name, company, manager and author fields travel with every copy. An interview note or a reference carries its writer. Clean the file, and check the custom properties row: a classification label or a case number attached by an internal system will show there.</p>

      <h2>Marketplace sellers</h2>
      <p>The listing photo is the risk. Taken at home, it carries the home's position, the phone model, and the date. Many marketplaces strip metadata on upload; a photo sent as a file in a chat, an email attachment or a messaging app is usually sent whole. Clean the photo before it leaves the phone, and clean the sale document too if you send an invoice or a receipt from a template.</p>

      <h2>The routine</h2>
      <ul>
        <li>Finish the content first. Redact in the editor, accept or reject tracked changes, delete comments, crop the photo. Metadata cleaning comes last, because every save can write it back.</li>
        <li>Drop the file on the home page and read the table before you press anything. The table is the audit: it lists every field, and a value you did not expect is the one to notice.</li>
        <li>Press Remove all and download. Use the copy with -clean in its name, not the original.</li>
        <li>Drop the clean copy back. The table should show nothing to remove. For a PDF, read the note.</li>
        <li>Rename the file if the name says something. A file name is not metadata and FileSanity leaves it alone, apart from adding the suffix.</li>
      </ul>

      <h2>What a clean file still says</h2>
      <p>The content. A photograph of a room shows the room; a letter on headed paper shows the letterhead; a spreadsheet's formulas show how the numbers were made. Pictures pasted into a document keep their own metadata until you clean them separately and insert the clean ones. And a file cleaned on your machine is only as private as your machine.</p>
      <p>None of that is a reason to skip the two minutes. Metadata is the part a stranger can read without looking, and it is the part that is cheap to remove.</p>
    </>
  )
}
