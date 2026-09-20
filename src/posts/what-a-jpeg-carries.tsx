export const meta = {
  slug: 'what-a-jpeg-carries',
  title: 'What a JPEG carries, and what comes out',
  description: 'EXIF, XMP, IPTC, Photoshop resources and comments: the five places a JPEG stores metadata, what each says about you, and what FileSanity removes and keeps.',
  date: '2026-09-18',
  readingMinutes: 4,
  image: { name: 'jpeg', alt: 'A single charcoal SD memory card lying on a grey surface, one small dark red tab on its side' },
}

export default function Post() {
  return (
    <>
      <p>A JPEG is a sequence of segments. The picture itself starts at a marker called SOS, start of scan, and everything before it is header: the tables the decoder needs, and any metadata an application chose to write. FileSanity reads only those header bytes. It never decodes the picture, and the clean file is built from slices of the original, so the pixels are byte for byte what they were.</p>
      <p>This post lists what sits in that header, in the order the parser meets it.</p>

      <h2>EXIF</h2>
      <p>Written by the camera or the phone at the moment of capture, in an APP1 segment that begins with the word Exif. It is a small TIFF file: a directory of tagged values, with a second directory for the camera settings and a third for position.</p>
      <p>The fields people expect are there: make, model, lens, exposure, ISO, focal length. The ones people forget are there too. The date and time the shutter fired, with a time zone on newer phones. The GPS latitude, longitude and altitude, to a few metres, plus the satellite time. A body serial number and a lens serial number. A camera owner or artist name, typed once into a menu and written into every file since. The software that last saved the file, and sometimes the host computer's name. A user comment. A unique image identifier. A maker note, which is a vendor's private block and can hold anything.</p>
      <p>The last directory holds a thumbnail: a small copy of the picture. If the picture was cropped or blurred after capture and the software did not rebuild the thumbnail, the thumbnail still shows the original. FileSanity lists it with its size and removes it with the rest of the segment.</p>

      <h2>XMP</h2>
      <p>Adobe's XML packet, in a second kind of APP1 segment. Editing software writes it, and so do newer phones. It often repeats what EXIF said, and then adds what EXIF cannot hold: the creator tool, a history of every edit with the software and the time of each, a document identifier and an instance identifier that tie this file to its earlier versions, keywords, a rights line, a city and a country. A long packet is split across an extended XMP segment; that is removed too.</p>

      <h2>IPTC and Photoshop resources</h2>
      <p>The press standard lives in an APP13 segment labelled Photoshop 3.0. Inside it are image resource blocks. One block holds the IPTC datasets: by-line, credit, source, city, province, country, caption, keywords, copyright notice, and dates. Other blocks hold Photoshop's own resolution settings and, sometimes, a second copy of the EXIF, the XMP or the colour profile. FileSanity lists the IPTC fields by name and the other blocks by size, and removes the whole segment.</p>

      <h2>Comments</h2>
      <p>A COM segment is free text. Old tools wrote their name there; some conversion pipelines write a version string. It is shown and removed.</p>

      <h2>What stays</h2>
      <p>The ICC colour profile, in an APP2 segment, is kept. It says how the colours are meant to look, not who took the picture or where, and removing it makes a wide-gamut photo look dull on most screens. The table lists it as kept, with that reason.</p>
      <p>Everything the decoder needs stays as well: the quantisation and Huffman tables, the frame header, the JFIF or Adobe marker that names the colour layout. None of those describe you.</p>
      <p>There is one value FileSanity writes back. If the EXIF orientation was anything other than 1, the photo was shot sideways or upside down and the camera recorded the fact rather than rotating the pixels. Remove that flag and the picture displays the wrong way up. So the clean file gets a minimal EXIF block of one entry, orientation, and nothing else. The result says when this has happened.</p>

      <h2>PNG, briefly</h2>
      <p>A PNG has no EXIF of its own, but screenshots and exports carry text chunks: tEXt, zTXt and iTXt, with keys like Software, Author, Comment and Source, and sometimes an XMP packet in iTXt. Newer files can carry an eXIf chunk and a tIME chunk. FileSanity removes those five kinds and keeps the colour profile, iCCP, for the same reason as the JPEG one.</p>

      <h2>Checking the result</h2>
      <p>Drop the clean copy back on the home page. The table should show nothing to remove, and one kept row for the colour profile if there was one. If you prefer another tool, any EXIF reader will report the same: no EXIF, no XMP, no IPTC, and the same picture.</p>
    </>
  )
}
