import { Closer, PageHead, Section } from '../ui/bits'

export const meta = {
  title: 'Photos: what a JPEG or PNG reveals about you',
  description: 'EXIF, GPS, XMP and IPTC in JPEG and PNG files: what each field reveals about you, which ones matter most, and what FileSanity removes in the browser.',
}

const BLOCKS: [string, string, [string, string][]][] = [
  ['EXIF', 'Written by the camera or phone at the moment of capture. The block most people have heard of, and the largest.', [
    ['Make, Model, LensModel', 'The exact phone or camera and lens. Combined with a serial number, it ties every photo you have ever posted to one device.'],
    ['DateTimeOriginal, OffsetTime', 'The second the shutter fired, and the time zone, so where you were and when.'],
    ['GPSLatitude, GPSLongitude, GPSAltitude', 'Where the picture was taken, to a few metres. A listing photo carries the street; a photo of a child carries the school.'],
    ['BodySerialNumber, LensSerialNumber', 'Identifiers for the hardware. Insurance records and warranty claims carry the same numbers.'],
    ['Artist, Copyright, OwnerName', 'A name, typed once into a camera menu or a phone setting and written into every file since.'],
    ['Software', 'What last saved the file. Editing software names itself, and so do some phone apps.'],
    ['The thumbnail (IFD1)', 'A small copy of the picture, sometimes from before it was cropped or redacted.'],
  ]],
  ['XMP', 'Adobe\'s XML packet, written by editing software and by newer phones. Often duplicates EXIF, and adds the history.', [
    ['CreatorTool, CreateDate, ModifyDate', 'Which program made and changed the file, and when.'],
    ['xmpMM:History', 'A list of every edit, with the software and the time of each. It can show a picture was altered, and when.'],
    ['dc:creator, dc:rights, photoshop:City, photoshop:Country', 'Who made it and where, as text.'],
    ['DocumentID, InstanceID', 'Unique identifiers that link this file to its earlier versions.'],
  ]],
  ['IPTC', 'The press metadata standard, written by photo software and newsroom systems.', [
    ['By-line, Credit, Source', 'The photographer and the agency.'],
    ['City, Province, Country', 'Where, as typed by a person.'],
    ['Caption, Keywords', 'Free text, sometimes including names of the people pictured.'],
  ]],
  ['PNG text chunks', 'PNG has no EXIF of its own, but screenshots and exports carry text.', [
    ['tEXt, zTXt, iTXt', 'Key and value pairs: Software, Author, Comment, Source, and an XMP packet in iTXt. A screenshot names the tool that took it; an export names the program and sometimes the file path.'],
    ['tIME', 'When the image was last changed.'],
    ['eXIf', 'A full EXIF block, when a converter copied it over from a JPEG.'],
  ]],
]

export default function Photos() {
  return (
    <>
      <PageHead
        eyebrow="Photos"
        title="A photo knows where it was taken."
        lede="A picture from a phone carries the phone, the second it was taken, the coordinates, sometimes your name, and a record of every edit. Here is each block, what it reveals, and what FileSanity does with it."
      />
      <Section>
        <div className="space-y-6">
          {BLOCKS.map(([name, what, fields], i) => (
            <div key={name} className="bezel" data-reveal="" style={{ '--d': `${i * 60}ms` } as React.CSSProperties}>
              <div className="plate grid grid-cols-1 gap-6 p-6 sm:p-8 lg:grid-cols-12">
                <div className="lg:col-span-4">
                  <h2 className="text-[1.5rem]">{name}</h2>
                  <p className="mt-2 max-w-[36ch] text-muted">{what}</p>
                </div>
                <dl className="rows lg:col-span-8">
                  {fields.map(([f, why]) => (
                    <div key={f} className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-12 sm:gap-6">
                      <dt className="text-[0.9375rem] font-medium sm:col-span-5">{f}</dt>
                      <dd className="text-[0.9375rem] text-muted sm:col-span-7">{why}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          ))}
        </div>
      </Section>
      <Section labelledBy="h-what">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <h2 id="h-what" className="text-[1.75rem] sm:text-[2.25rem] lg:col-span-4">What is removed.</h2>
          <div className="prose lg:col-span-8">
            <p>Every block above: EXIF with its GPS and thumbnail, XMP, IPTC, Photoshop resources and comments in a JPEG; every text chunk, eXIf and tIME in a PNG. The pixels are not decoded or re-saved, so the picture is byte for byte what it was.</p>
            <p>Two things stay. The ICC colour profile, because it is how the colours are meant to look, not who took the picture. And when a photo was shot sideways, a single EXIF orientation value is written back, thirty-two bytes, so the clean copy still displays the right way up. The result says when it has done that.</p>
            <p>Not read yet: HEIC and RAW files, and the EXIF inside a picture that has been pasted into a Word document.</p>
          </div>
        </div>
      </Section>
      <Closer title="Clean a photo before it goes anywhere." text="Drop it on the home page. The coordinates, the device and the history go; the picture stays." />
    </>
  )
}
