import type { ReactNode } from 'react'
import { CTA } from '../content'
import { Block, Head } from '../ui'

/** How-to guides: the manual ways first, FileSanity as one option. Menu paths are cited inline to the vendor page they came from. */
export const GUIDES_CHECKED = '9 October 2026'

type Guide = { slug: string; title: string; description: string; h1: string; lede: string; body: ReactNode }

/** The one in-body action on a guide: what FileSanity does for this case, then the button. */
function Here({ children }: { children: ReactNode }) {
  return (
    <Block id="h-here" title="Or clean it here">
      {children}
      <p><a className="btn" href="/#cleaner">{CTA}</a></p>
    </Block>
  )
}

function Checked({ on = GUIDES_CHECKED }: { on?: string }) {
  return (
    <Block id="h-checked" title="Checked">
      <p>Menu paths checked on {on} against the pages linked above. Menus move between versions; when yours differs, the vendor's page is the authority. Found a mistake? <a href="/contact">Tell us</a>.</p>
      <p><a href="/guides">All guides</a></p>
    </Block>
  )
}

const APPLE_SHARE = 'https://support.apple.com/guide/iphone/share-photos-and-videos-iphf28f17237/ios'
const APPLE_SAFETY = 'https://support.apple.com/guide/personal-safety/manage-location-metadata-in-photos-ips0d7a5df82/web'
const PIXEL = 'https://support.google.com/pixelcamera/answer/2838995'
const SAMSUNG = 'https://www.samsung.com/ae/support/mobile-devices/how-can-i-activate-location-tags-on-my-galaxy-device/'
const GPHOTOS = 'https://support.google.com/photos/answer/6153599'
const INSPECTOR = 'https://support.microsoft.com/en-us/office/remove-hidden-data-and-personal-information-by-inspecting-documents-presentations-or-workbooks-356b7b5d-77af-44fe-a07f-9aa4d085966f'
const MAC_WORD = 'https://learn.microsoft.com/en-us/answers/questions/5874148/how-to-remove-personal-information-from-a-word-doc'
const OFFICE_INFO = 'https://support.microsoft.com/en-us/office/the-info-tab-ad7ee2ae-300f-40f2-88d5-449cb1e5d3f0'
const ACRO_PROPS = 'https://helpx.adobe.com/acrobat/current/pdf-properties-metadata.html'
const ACRO_SANITIZE = 'https://helpx.adobe.com/acrobat/desktop/protect-documents/redact-pdfs/sanitize.html'
const EXIF_PDF = 'https://exiftool.org/TagNames/PDF.html'
const EXIF_TAGS = 'https://exiftool.org/TagNames/EXIF.html'
const GPS_TAGS = 'https://exiftool.org/TagNames/GPS.html'
const IPTC_TAGS = 'https://exiftool.org/TagNames/IPTC.html'
const IPTC_STD = 'https://www.iptc.org/std/photometadata/specification/IPTC-PhotoMetadata'
const EXIF_FAQ = 'https://exiftool.org/faq.html'
const PNG_SPEC = 'https://www.w3.org/TR/png-3/'
const PREVIEW = 'https://support.apple.com/guide/preview/prvw9c94f0a4/mac'
const META_POLICY = 'https://www.facebook.com/privacy/policy/'
const EBAY_POLICY = 'https://www.ebay.com/help/policies/member-behaviour-policies/user-privacy-notice-privacy-policy?id=4260'
const KASPERSKY = 'https://www.kaspersky.com/blog/exif-privacy/13356/'
const OPENAI_C2PA = 'https://help.openai.com/en/articles/8912793'
const PIXEL_C2PA = 'https://blog.google/security/pixel-android-trusted-images-c2pa-content-credentials/'
const C2PA_SPEC = 'https://spec.c2pa.org/specifications/specifications/2.1/specs/C2PA_Specification.html'
const CAI_VERIFY = 'https://opensource.contentauthenticity.org/docs/verify'
const IPTC_AI = 'https://iptc.org/?p=6867'
const EXIF_JUMBF = 'https://exiftool.org/TagNames/Jpeg2000.html'
const WIN_DETAILS = 'https://www.floridabar.org/tech-tips/windows-how-to-easily-remove-metadata-from-files-via-file-explorer/'

export const GUIDES: Guide[] = [
  {
    slug: 'remove-location-from-photos',
    title: 'Remove the location from a photo before you send it',
    description: 'Stop iPhone and Android cameras recording where you are, share one photo without its location, and clean the GPS out of a photo that already has it.',
    h1: 'Remove the location from a photo before you send it.',
    lede: 'Phones can write the GPS position into every photo they take. Here is how to stop that on iPhone and Android, how to share one photo without it, and how to clean a file that already carries it.',
    body: (
      <>
        <Block id="h-why" title="Where the location sits">
          <p>A photo's position is stored in its EXIF data as <code>GPSLatitude</code> and <code>GPSLongitude</code>, often with <code>GPSAltitude</code> and the direction the camera faced. It is written when the camera app has permission to use your location. Anyone who receives the file itself, not a re-encoded copy, can read it with free tools.</p>
          <p>There are three separate jobs, and it helps to know which one you need: stop new photos recording a location, share one photo without it, or remove it from a file you already have. The first two are settings on the phone. The third needs the file cleaned.</p>
        </Block>
        <Block id="h-ios-share" title="iPhone: share one photo without it">
          <p>Apple's guide says that sharing a photo also shares its metadata, such as the date and time, location, device and captions. To leave the location out of one share, from <a href={APPLE_SAFETY}>Apple's personal safety guide</a>:</p>
          <ol>
            <li>Open Photos and select the photos you want to send.</li>
            <li>Tap the Share button, then tap <b>Options</b> at the top of the share sheet.</li>
            <li>Turn off <b>Location</b>.</li>
            <li>Share as usual.</li>
          </ol>
          <p>The switch applies to that share only, and it removes the location, not the date or the camera model. The same Options screen sets the format: <a href={APPLE_SHARE}>Apple's sharing guide</a> says Most Compatible may convert the file to JPEG.</p>
        </Block>
        <Block id="h-ios-remove" title="iPhone: remove it from a photo, or stop recording it">
          <p>To remove the location from a photo in your library, Apple's <a href={APPLE_SAFETY}>guide</a> says: open the photo in Photos, tap the More button, tap <b>Adjust Info</b>, tap <b>Adjust Location</b>, then tap <b>No Location</b>.</p>
          <p>To stop the camera recording it at all: <b>Settings &gt; Privacy &amp; Security &gt; Location Services &gt; Camera</b>, then tap <b>Never</b>. This only affects photos you take from now on. Photos already taken keep their position.</p>
          <p>On a Mac, in Photos, select the photos and choose <b>Image &gt; Location &gt; Hide Location</b>.</p>
        </Block>
        <Block id="h-android" title="Android: stop recording it">
          <p>Each maker's camera app puts the switch in a different place. On a Pixel, from <a href={PIXEL}>Google's Pixel Camera help</a>: open Camera, tap <b>Settings</b> at the bottom left, then <b>More settings</b>, and turn off <b>Save location</b>.</p>
          <p>On a Samsung Galaxy, from <a href={SAMSUNG}>Samsung's support page</a>: open Camera, tap the Settings gear, and set <b>Location tags</b> off.</p>
          <p>For photos already taken, Google Photos has a limit worth knowing. Its <a href={GPHOTOS}>help page</a> says that if a location was added automatically by your camera, you cannot update or remove it in Google Photos; only estimated and manually added locations can be removed. Google Photos does let you turn off <b>Share photo locations</b> for a shared album or conversation, but a photo sent as a file, attached to an email or uploaded somewhere else still carries what the camera wrote.</p>
        </Block>
        <Block id="h-enough" title="When the setting alone is enough">
          <p>If the camera's location was off when you took the photo, there is no position in the file to remove. If you share from the iPhone share sheet with Location off, the copy that leaves your phone has none either. In both cases you are done with the location.</p>
          <p>What the settings do not touch is everything else: the date and time, the phone's make and model, the software version, and on edited photos sometimes a name. If those matter for this recipient, or the photo came from someone else's phone, clean the file itself. <a href="/guides/photo-metadata-explained">What a photo carries</a> lists the fields.</p>
        </Block>
        <Block id="h-file" title="Clean a file that already has it">
          <p>On a computer, the command-line tool exiftool removes the GPS group from a JPEG while leaving the rest:</p>
          <pre><code>exiftool -gps:all= photo.jpg</code></pre>
          <p>It keeps a copy of the original next to it, named <code>photo.jpg_original</code>; delete that before you send anything from the folder. To remove more than the location, see the exiftool <a href={EXIF_FAQ}>FAQ</a> on deleting all metadata while keeping the colour profile.</p>
        </Block>
        <Here>
          <p>FileSanity's <a href="/photos">photo cleaner</a> reads a JPEG, PNG or iPhone HEIC in your browser tab, lists the position in plain words beside the time, the device and any names, removes them and downloads the clean copy. The picture is not re-encoded and the file is not uploaded; <a href="/security">here is how to check that</a>.</p>
        </Here>
        <Checked />
      </>
    ),
  },
  {
    slug: 'remove-author-from-office-files',
    title: 'Remove the author and company from Word, Excel and PowerPoint',
    description: 'Where Word, Excel and PowerPoint store the author, last editor and company, how to remove them with Document Inspector on Windows and on a Mac, and what it misses.',
    h1: 'Remove the author and company from Word, Excel and PowerPoint.',
    lede: 'Office files record who wrote them, who saved them last, the company and how many minutes were spent editing. Here is where that lives, how to remove it in Office, and what to check that the properties do not cover.',
    body: (
      <>
        <Block id="h-where" title="Where it is stored">
          <p>A .docx, .xlsx or .pptx file is a zip of XML parts. Three of them are metadata:</p>
          <table className="spec"><tbody>
            <tr><th scope="row">docProps/core.xml</th><td>Author (<code>dc:creator</code>), last modified by (<code>cp:lastModifiedBy</code>), created and modified dates, revision number, title, subject, keywords</td></tr>
            <tr><th scope="row">docProps/app.xml</th><td>Company, Manager, total editing time (<code>TotalTime</code>, in minutes), application and version, template</td></tr>
            <tr><th scope="row">docProps/custom.xml</th><td>Custom properties a firm or a document system adds, such as client or matter numbers</td></tr>
          </tbody></table>
          <p>Some files also carry <code>docProps/thumbnail</code>, a small picture of the first page or slide.</p>
          <p>Separate from those, the document's content can name people: comments and tracked changes record their authors, and headers, footers and hidden text can hold anything. Those are part of the document, not its properties, and need their own check.</p>
        </Block>
        <Block id="h-windows" title="Windows: Document Inspector">
          <p>Word, Excel and PowerPoint on Windows have a built-in tool. From <a href={INSPECTOR}>Microsoft's support page</a>:</p>
          <ol>
            <li>Save a copy first (<b>File &gt; Save As</b>, new name). Microsoft warns that it is not always possible to restore what the inspector removes, and Undo may not bring it back.</li>
            <li>In the copy, choose <b>File &gt; Info &gt; Check for Issues &gt; Inspect Document</b>.</li>
            <li>Tick the kinds of content to check and choose <b>Inspect</b>.</li>
            <li>Choose <b>Remove All</b> next to <b>Document Properties and Personal Information</b>, and next to any other result you want gone, such as comments and revisions.</li>
            <li>Save the copy.</li>
          </ol>
          <p>Microsoft notes two limits. The inspector cannot find text hidden by other means, such as white text on a white background. And in Excel, if a workbook has been saved as a shared workbook, you cannot remove comments, document properties and personal information until you copy it and turn sharing off.</p>
        </Block>
        <Block id="h-mac" title="Mac">
          <p>Document Inspector is not in the File menu of current Word for Mac. In a <a href={MAC_WORD}>Microsoft Q&amp;A thread</a> about Word for Mac 16.108, the accepted answer points to <b>Tools &gt; Protect Document</b>, where the option to remove personal information on save sits. Turn it on, then save, and check the result as described below: a Q&amp;A answer is not official documentation.</p>
        </Block>
        <Block id="h-check" title="See what is left">
          <p><b>File &gt; Info</b> shows the properties on the right, including who last edited the file and the total editing time, per <a href={OFFICE_INFO}>Microsoft's page on the Info tab</a>. Choose <b>Show All Properties</b> to see Company and Manager. If a field still shows a name after cleaning, it was not removed. <a href="/guides/check-a-file-is-clean">Check a file is clean</a> covers other ways to look.</p>
        </Block>
        <Block id="h-enough" title="When Office alone is enough">
          <p>If you have desktop Office on Windows, Document Inspector does more than a metadata cleaner: it also removes comments, tracked changes, hidden text and invisible objects. For a contract or a disciplinary letter going outside, that is the right tool, and you may not need anything else.</p>
          <p>A separate cleaner helps when you do not have desktop Office to hand, when you are on a Mac or a phone, or when you have a folder of files and want them all done the same way.</p>
        </Block>
        <Here>
          <p>FileSanity's <a href="/documents">document cleaner</a> reads a .docx, .xlsx or .pptx in your browser, shows the author, last editor, company, manager, editing time, custom properties and thumbnail, and downloads a copy with those parts emptied. Every word, cell and slide is copied as it was. It does not touch comments or tracked changes, because they are content: accept or delete them in Office first. Legacy .doc, .xls and .ppt are not read yet; save them as the newer format.</p>
        </Here>
        <Checked />
      </>
    ),
  },
  {
    slug: 'remove-pdf-metadata',
    title: 'See and remove the metadata in a PDF',
    description: 'How to read a PDF\'s author, title, creator program and dates, remove them with Acrobat Pro or on the command line, and why editing the fields is not always enough.',
    h1: 'See and remove the metadata in a PDF.',
    lede: 'A PDF records who made it, what program made it and when. Some PDFs also keep earlier versions of those fields inside the same file. Here is how to see them, remove them, and know when a PDF is not as clean as it looks.',
    body: (
      <>
        <Block id="h-what" title="What a PDF carries">
          <p>Most PDFs have a document information dictionary with up to eight fields: <code>Title</code>, <code>Author</code>, <code>Subject</code>, <code>Keywords</code>, <code>Creator</code> (the program the document was written in), <code>Producer</code> (the program that made the PDF), <code>CreationDate</code> and <code>ModDate</code>. Many also carry an XMP packet that repeats those fields and can add more.</p>
          <p>A PDF exported from Word usually inherits Word's author. So the cleanest fix often starts in the source document: see <a href="/guides/remove-author-from-office-files">removing the author from Office files</a>, then export again.</p>
        </Block>
        <Block id="h-see" title="See it">
          <p>In Acrobat or Acrobat Reader, open the document properties: <b>File &gt; Properties</b> in older versions, <b>Menu &gt; Document properties</b> on Windows or <b>File &gt; Document properties</b> on Mac in newer ones, or press Ctrl+D (Cmd+D on Mac). The <b>Description</b> tab shows title, author, subject and keywords, and <b>Additional Metadata</b> shows the XMP. <a href={ACRO_PROPS}>Adobe's page on PDF properties</a> describes the fields.</p>
          <p>On a Mac, Preview shows the same under <b>Tools &gt; Show Inspector</b>, or the Info button in newer versions, per <a href={PREVIEW}>Apple's Preview guide</a>.</p>
        </Block>
        <Block id="h-acrobat" title="Remove it with Acrobat Pro">
          <p>Acrobat Pro has a sanitize command. From <a href={ACRO_SANITIZE}>Adobe's help</a>: go to <b>All tools &gt; Redact a PDF</b>, choose <b>Sanitize document</b>, then <b>Remove all</b>, and save under a new name. <b>Selectively remove</b> lets you choose items in the Hidden Information panel instead. Sanitizing removes more than metadata, including comments and hidden layers, so check the result before you send it.</p>
        </Block>
        <Block id="h-revisions" title="Why editing the fields is not always enough">
          <p>A PDF can be saved by appending changes to the end of the file instead of rewriting it. The old values stay in the bytes and can be recovered. The exiftool documentation is plain about its own behaviour: <a href={EXIF_PDF}>its PDF page</a> says edits are written as an incremental update, are reversible, and that old information is never actually deleted from the file. It suggests rewriting the file with qpdf afterwards:</p>
          <pre><code>exiftool -all= in.pdf{'\n'}qpdf --linearize in.pdf out.pdf</code></pre>
          <p>Send <code>out.pdf</code>, not <code>in.pdf</code>. Then open it again and check the properties are empty.</p>
        </Block>
        <Block id="h-order" title="In order, for a PDF going outside">
          <ol>
            <li>Remove the author and company from the source document, if you have it, and export the PDF again.</li>
            <li>Open the new PDF's properties (Ctrl+D or Cmd+D) and read the Description tab and Additional Metadata.</li>
            <li>If a name, a company or a program you did not expect is still there, sanitize with Acrobat Pro, or remove it with exiftool and rewrite the file with qpdf.</li>
            <li>Open the file you will actually send and read the properties once more.</li>
          </ol>
          <p>Four steps, a few minutes, and the second and fourth are the ones people skip.</p>
        </Block>
        <Block id="h-enough" title="When you need more than a cleaner">
          <p>If the PDF will be read by someone with a reason to dig, such as the other side in a dispute, use Acrobat Pro's sanitize or rebuild the PDF from a cleaned source document. Metadata is only one part: hidden layers, form data, attachments and text under a black box are content, and redacting them is a separate job.</p>
        </Block>
        <Here>
          <p>FileSanity's <a href="/pdf">PDF cleaner</a> shows the document information and XMP in your browser and blanks them in place, including copies left by earlier saves, so the PDF opens exactly as before. Some PDFs, often ones saved from Word or Acrobat, keep the XMP or all their objects in compressed streams. FileSanity cannot rewrite those yet: it shows what it found, keeps it, and says the file is not fully clean instead of calling it done.</p>
        </Here>
        <Checked />
      </>
    ),
  },
  {
    slug: 'photo-metadata-explained',
    title: 'What a photo carries: EXIF, XMP and IPTC',
    description: 'The real field names in a photo\'s EXIF, XMP and IPTC data: GPS position, camera make and serial number, dates, creator and city. What each one says and which to keep.',
    h1: 'What a photo carries: EXIF, XMP and IPTC.',
    lede: 'A JPEG can hold three separate blocks of metadata, written by different programs for different reasons. Here are the fields that say something about you, under the names the tools use.',
    body: (
      <>
        <Block id="h-three" title="Three blocks">
          <p><b>EXIF</b> is written by the camera when the photo is taken: the device, the settings, the time and, if allowed, the position. <b>XMP</b> is written by editing and cataloguing software, and repeats some EXIF fields while adding its own. <b>IPTC</b> is the older press standard for captions, credits and places, still used by news photo desks. A file can carry all three, and cleaning one leaves the others.</p>
        </Block>
        <Block id="h-exif" title="EXIF">
          <p>Field names as listed in exiftool's <a href={EXIF_TAGS}>EXIF</a> and <a href={GPS_TAGS}>GPS</a> tables:</p>
          <table className="spec"><tbody>
            <tr><th scope="row">Place</th><td><code>GPSLatitude</code>, <code>GPSLongitude</code> and their <code>Ref</code> fields, <code>GPSAltitude</code>, <code>GPSImgDirection</code> (which way the camera faced), <code>GPSSpeed</code>, <code>GPSDateStamp</code> and <code>GPSTimeStamp</code>. They sit in a sub-block that <code>GPSInfo</code> (0x8825) points to.</td></tr>
            <tr><th scope="row">Device</th><td><code>Make</code> (0x010f), <code>Model</code> (0x0110), <code>LensModel</code> (0xa434), <code>SerialNumber</code> (0xa431, called BodySerialNumber in the EXIF standard), <code>Software</code> (0x0131)</td></tr>
            <tr><th scope="row">Time</th><td><code>DateTimeOriginal</code> (0x9003) and <code>OffsetTimeOriginal</code> (0x9011), which gives the time zone and so roughly where in the world</td></tr>
            <tr><th scope="row">Person</th><td><code>Artist</code> (0x013b), <code>Copyright</code> (0x8298), <code>OwnerName</code> (0xa430, CameraOwnerName in the standard)</td></tr>
            <tr><th scope="row">Words</th><td><code>ImageDescription</code> (0x010e), <code>UserComment</code> (0x9286)</td></tr>
          </tbody></table>
          <p>EXIF can also hold a small preview copy of the picture, made by the camera or an editor.</p>
        </Block>
        <Block id="h-xmp" title="XMP">
          <p>XMP is a block of XML text inside the file. The fields that identify people and places, with the property names from the <a href={IPTC_STD}>IPTC Photo Metadata Standard</a>:</p>
          <ul>
            <li><code>dc:creator</code>: the photographer</li>
            <li><code>dc:rights</code>: the copyright notice</li>
            <li><code>dc:description</code>: the caption</li>
            <li><code>photoshop:City</code>, <code>photoshop:State</code>, <code>photoshop:Country</code>: the place, typed in by a person or filled from GPS by software</li>
          </ul>
          <p>An edited photo often also carries <code>xmp:CreatorTool</code>, the editing program, and an edit history.</p>
        </Block>
        <Block id="h-iptc" title="IPTC">
          <p>The older IPTC block uses numbered datasets. Names from exiftool's <a href={IPTC_TAGS}>IPTC table</a>:</p>
          <table className="spec"><tbody>
            <tr><th scope="row">2:80</th><td><code>By-line</code>: the creator</td></tr>
            <tr><th scope="row">2:90, 2:92, 2:95, 2:101</th><td><code>City</code>, <code>Sub-location</code>, <code>Province-State</code>, <code>Country-PrimaryLocationName</code></td></tr>
            <tr><th scope="row">2:120</th><td><code>Caption-Abstract</code>: the caption</td></tr>
            <tr><th scope="row">2:122</th><td><code>Writer-Editor</code>: who wrote the caption</td></tr>
            <tr><th scope="row">2:116, 2:118</th><td><code>CopyrightNotice</code>, <code>Contact</code></td></tr>
            <tr><th scope="row">2:25</th><td><code>Keywords</code></td></tr>
          </tbody></table>
          <p>A caption written on a news desk can name a source or a street that never appears in the picture. Read it before the file goes anywhere.</p>
        </Block>
        <Block id="h-png" title="PNG">
          <p>PNG files use chunks instead. The <a href={PNG_SPEC}>PNG specification</a> defines <code>eXIf</code> for an EXIF block, <code>tEXt</code>, <code>zTXt</code> and <code>iTXt</code> for text, which is where XMP and fields like Author or Comment go, and <code>tIME</code> for the last-modified time. Screenshots are often PNGs, and some screenshot tools write text chunks.</p>
        </Block>
        <Block id="h-keep" title="What to keep">
          <p>Not every field is a leak. The <code>Orientation</code> tag keeps the photo the right way up, and the ICC colour profile keeps its colours. exiftool's <a href={EXIF_FAQ}>FAQ</a> warns that removing all metadata can remove colour space information, and its recommended command keeps the profile. A good cleaner removes what describes you and keeps what describes the picture.</p>
          <p>To read your own files, see <a href="/guides/check-a-file-is-clean">check a file is clean</a>. To remove the position only, see <a href="/guides/remove-location-from-photos">remove the location from a photo</a>.</p>
        </Block>
        <Here>
          <p>FileSanity's <a href="/photos">photo cleaner</a> reads all three blocks from a JPEG, and the text and EXIF chunks from a PNG, and lists them in plain words: who, where, when and on what. It removes them, keeps orientation and the colour profile, and does not re-encode the picture. The file stays in your browser.</p>
        </Here>
        <Checked />
      </>
    ),
  },
  {
    slug: 'marketplace-photo-metadata',
    title: 'What Facebook Marketplace and eBay do with photo metadata',
    description: 'What Meta and eBay say they collect from the photos you upload, what they do not promise to remove, and how to test any marketplace yourself before you list.',
    h1: 'What Facebook Marketplace and eBay do with your photo\'s metadata.',
    lede: 'Sellers often hear that the big sites strip location from photos. Some may remove it from the copy buyers see. But the sites read it first, and few of them publish what they keep. Here is what their own policies say.',
    body: (
      <>
        <Block id="h-short" title="The short answer">
          <p>We could not find a help page from Meta or eBay that promises to remove the location from listing photos, or says which fields buyers can see. Both privacy policies say they collect metadata from what you upload. So the safe assumption is: the site reads everything in the file, and buyers may or may not be able to. If the photo was taken at home, remove the location before it leaves your phone.</p>
        </Block>
        <Block id="h-meta" title="Meta: Facebook, Marketplace and Messenger">
          <p><a href={META_POLICY}>Meta's privacy policy</a> lists "metadata about content and messages" among what it collects, and describes metadata as information such as where a photo was taken and when a file was created. It also says that if you give Meta access to your camera roll, it collects metadata from and about your photos and videos, including the date and time they were made.</p>
          <p>A <a href={KASPERSKY}>Kaspersky test</a> reported that Facebook removed EXIF from the picture files people could download but kept the information in its own database. Meta does not document which fields it removes from that copy or whether that holds for every route a photo can take, so treat it as unconfirmed.</p>
        </Block>
        <Block id="h-ebay" title="eBay">
          <p><a href={EBAY_POLICY}>eBay's User Privacy Notice</a> lists, among the information it collects, "certain metadata recording the settings of your camera included in images of items you upload for sale". We found no eBay help page that says whether the position is removed from listing photos.</p>
        </Block>
        <Block id="h-others" title="Other marketplaces">
          <p>For Etsy, Vinted, Depop and Craigslist we found no published statement either way. Sites change their image pipelines without notice, and the same site can treat the app and the website differently. Test it yourself:</p>
          <ol>
            <li>Take a photo with location on, somewhere that is not your home.</li>
            <li>Post it in a draft or a listing you remove afterwards.</li>
            <li>Open the photo in the listing at full size, save it, and read its metadata as in <a href="/guides/check-a-file-is-clean">check a file is clean</a>.</li>
          </ol>
          <p>That tells you what buyers can read today. It does not tell you what the site kept.</p>
        </Block>
        <Block id="h-direct" title="Messages and email are different">
          <p>When a buyer asks for more photos and you send them directly, the platform's processing may not apply at all. An email attachment arrives as the file you attached. Apple's <a href={APPLE_SHARE}>sharing guide</a> says sharing a photo from an iPhone shares its metadata, such as date and time, location, device and captions, unless you turn Location off under Options. Google Photos does not share a location it estimated, but a location the camera recorded goes with the file, per <a href={GPHOTOS}>its help page</a>.</p>
        </Block>
        <Block id="h-do" title="What to do">
          <p>Take listing photos with the camera's location off. On iPhone that is <b>Settings &gt; Privacy &amp; Security &gt; Location Services &gt; Camera &gt; Never</b>; on Android it is in the camera app's own settings. <a href="/guides/remove-location-from-photos">Remove the location from a photo</a> has the steps for each. That alone is enough for the position: a photo taken without it has none to leak. The camera model and the time are still in the file, which matters less for most sellers.</p>
        </Block>
        <Here>
          <p>For photos you have already taken, FileSanity's <a href="/photos">photo cleaner</a> removes the position, the device, the dates and any names from JPEG, PNG and HEIC files in your browser, without uploading them. With a Pro plan, the <a href="/batch">batch page</a> does a whole listing's photos at once.</p>
        </Here>
        <Checked />
      </>
    ),
  },
  {
    slug: 'check-a-file-is-clean',
    title: 'Check a file is clean before you send it',
    description: 'How to read the metadata in a photo, an Office document or a PDF on Windows, Mac and the command line, and a short list of what to look for before a file goes out.',
    h1: 'Check a file is clean before you send it.',
    lede: 'Whatever tool removed the metadata, check the copy you are about to send, not the original. It takes a minute, and it is the only way to know.',
    body: (
      <>
        <Block id="h-copy" title="Check the copy you will send">
          <p>Most cleaners, FileSanity included, write a new file and leave the original alone. exiftool keeps the original next to the new one. The photo in your library may still carry everything after you shared a clean copy. So open the exact file you will attach, from where you will attach it.</p>
        </Block>
        <Block id="h-photos" title="Photos">
          <p><b>Mac:</b> open the photo in Preview and choose <b>Tools &gt; Show Inspector</b> (or the Info button in newer versions). <a href={PREVIEW}>Apple's Preview guide</a> says the More Info pane shows information about the image, including where a photo was taken. In the Photos app, select the photo and click the Info button to review its location, per <a href={APPLE_SAFETY}>Apple's guide</a>.</p>
          <p><b>Windows:</b> right-click the file, choose <b>Properties</b>, then the <b>Details</b> tab, which lists the properties stored in the file, as described in this <a href={WIN_DETAILS}>Florida Bar tech tip</a>.</p>
        </Block>
        <Block id="h-office" title="Word, Excel and PowerPoint">
          <p>Open the file and choose <b>File &gt; Info</b>. The right side shows the properties, including who last edited it and the total editing time, per <a href={OFFICE_INFO}>Microsoft</a>; <b>Show All Properties</b> adds Company and Manager. On Windows you can also run <b>Check for Issues &gt; Inspect Document</b> and read the results without choosing Remove: it reports comments, revisions and hidden text the properties do not show. See <a href="/guides/remove-author-from-office-files">removing the author from Office files</a>.</p>
        </Block>
        <Block id="h-pdf" title="PDF">
          <p>In Acrobat or Reader, press Ctrl+D (Cmd+D on Mac) for document properties and read the <b>Description</b> tab and <b>Additional Metadata</b>, per <a href={ACRO_PROPS}>Adobe</a>. Empty fields there do not prove that older values are gone from the file; <a href="/guides/remove-pdf-metadata">see and remove PDF metadata</a> explains why, and how to rewrite the file.</p>
        </Block>
        <Block id="h-cli" title="Any file, on the command line">
          <p>exiftool reads photos, Office files and PDFs. This lists every field with the block it came from, duplicates included:</p>
          <pre><code>exiftool -a -G1 -s file.jpg</code></pre>
          <p><code>-a</code> shows duplicate fields, <code>-G1</code> names the group (such as GPS, IFD0, XMP-photoshop or IPTC), and <code>-s</code> prints the short field names used in <a href="/guides/photo-metadata-explained">what a photo carries</a>. A clean photo should show no GPS group, no Artist, no By-line and no City.</p>
        </Block>
        <Block id="h-self" title="Send it to yourself first">
          <p>Email, chat and upload services can each change a file, or leave it exactly as it was. The surest check of what the recipient will get is to send the file to yourself the same way, download what arrives, and read that copy with the tools above. It also catches the wrong attachment before anyone else sees it.</p>
        </Block>
        <Block id="h-list" title="What to look for">
          <ul>
            <li><b>Place:</b> GPS fields, City, State, Country, Sub-location.</li>
            <li><b>People:</b> Author, Last modified by, Artist, By-line, Creator, Manager, and the names on comments and tracked changes.</li>
            <li><b>Organisation:</b> Company, custom properties such as client or matter numbers, template paths.</li>
            <li><b>Time:</b> created, modified and taken dates, total editing time, time zone offset.</li>
            <li><b>Device:</b> camera make, model and serial number, software versions.</li>
            <li><b>The file name.</b> No tool cleans it. "draft for client X" travels with the file.</li>
          </ul>
        </Block>
        <Here>
          <p>Drop the cleaned copy into FileSanity's cleaner and read the list. For a file it cleaned, it should find nothing left to remove. For a PDF it could not fully reach, it says so. Either way the file stays in your browser; the <a href="/security">security page</a> shows three ways to check that for yourself.</p>
        </Here>
        <Checked />
      </>
    ),
  },
  {
    slug: 'remove-ai-labels-from-images',
    title: 'Remove Content Credentials and AI labels from an image',
    description: 'What the C2PA Content Credentials in a photo or AI image record, who adds them, how to see them, how to remove them, and what removing them does not change.',
    h1: 'Remove Content Credentials and AI labels from an image.',
    lede: 'AI image tools, some cameras and photo editors now sign a record into the file: what made it, who signed it, what was edited and whether AI was involved. Here is what it holds, how to read it, and how to remove it before you send the file.',
    body: (
      <>
        <Block id="h-what" title="What the label is">
          <p>Content Credentials follow an open standard called <a href={C2PA_SPEC}>C2PA</a>. The record is a signed block inside the file: in a JPEG it sits in APP11 segments, in a PNG in a <code>caBX</code> chunk. It can name the app that made the image, the certificate that signed it, the actions taken (created, edited, cropped), the files it was made from and, through a "digital source type", whether it was made by AI or by a camera. The standard also allows the record to carry a thumbnail of the image and of the files it was made from.</p>
          <p>A second, older label sits in the photo's XMP metadata: the IPTC digital source type. <a href={IPTC_AI}>IPTC</a> notes that platforms such as Meta read both kinds when deciding whether to show an AI label.</p>
        </Block>
        <Block id="h-who" title="Who adds it">
          <ul>
            <li><b>OpenAI:</b> images made with ChatGPT, Codex and the API carry C2PA metadata and a SynthID watermark, per <a href={OPENAI_C2PA}>OpenAI's help article</a>.</li>
            <li><b>Pixel phones:</b> <a href={PIXEL_C2PA}>Google says</a> Pixel Camera on the Pixel 10 attaches Content Credentials to every JPEG it captures, and Google Photos adds them to images edited with AI tools.</li>
            <li><b>Editing apps:</b> photo editors that support the standard can add a record when you export, listing the edits.</li>
          </ul>
          <p>So a label does not only mean "made by AI". A plain photo from a recent phone can carry one too.</p>
        </Block>
        <Block id="h-why" title="Why remove it, and what it does not change">
          <p>The record is about the file's history, and history can be more than you meant to send: the app and version, the signer, the list of edits, the files it was built from, and possibly a thumbnail of the image before it was cropped. Removing it is the same as removing EXIF: the recipient gets the picture and not its paper trail.</p>
          <p>It does not change what the picture is. OpenAI adds an invisible SynthID watermark to the pixels precisely so a signal survives when the metadata does not, and removing metadata leaves that watermark in place. Visible watermarks stay too. If a platform's rules ask you to say that an image was made with AI, removing the record does not change that.</p>
        </Block>
        <Block id="h-check" title="See whether a file has one">
          <ul>
            <li><b>Content Credentials Verify:</b> the <a href={CAI_VERIFY}>Verify tool</a> at contentcredentials.org reads the record and shows the signer and the edits. You upload the file to their site to do it.</li>
            <li><b>OpenAI:</b> openai.com/verify checks for an OpenAI record or a SynthID watermark, per <a href={OPENAI_C2PA}>OpenAI</a>.</li>
            <li><b>Google Photos:</b> on a JPEG with credentials, the details appear in a section of the About panel, per <a href={PIXEL_C2PA}>Google</a>.</li>
            <li><b>exiftool:</b> the record is in the <code>JUMBF</code> group. <code>exiftool -a -G1 -s file.jpg</code> lists it with everything else.</li>
          </ul>
        </Block>
        <Block id="h-remove" title="Remove it with the tools you have">
          <p>exiftool deletes the record from JPEG, PNG, WebP, TIFF-based and QuickTime-based files by deleting the JUMBF group, per its <a href={EXIF_JUMBF}>documentation</a>. Add <code>-xmp:all=</code> to remove the XMP, where the IPTC label sits:</p>
          <pre><code>exiftool -jumbf:all= -xmp:all= file.jpg</code></pre>
          <p>exiftool keeps the original as <code>file.jpg_original</code>; send the other one. A screenshot or a re-export to a new file also usually drops the record, as <a href={OPENAI_C2PA}>OpenAI notes</a>, but it re-encodes the picture and can carry the screen's own metadata.</p>
        </Block>
        <Here>
          <p>FileSanity reads Content Credentials in JPEG and PNG files and lists what they say, the app, the signer, whether it is marked as AI and the edits, then removes the record along with the EXIF and XMP. The picture is not re-encoded. Credentials inside HEIC and WebP files are not removed yet. The file stays in your browser.</p>
        </Here>
        <Checked on="10 October 2026" />
      </>
    ),
  },
]

export function guideModule(g: Guide) {
  function GuidePage() {
    return (
      <>
        <Head h1={g.h1} lede={g.lede} />
        {g.body}
      </>
    )
  }
  return { meta: { title: g.title, description: g.description }, default: GuidePage }
}

export const meta = {
  title: 'Guides: removing metadata before you send a file',
  description: 'Plain how-to guides for removing location from photos, author and company from Office files and metadata from PDFs, with the phone and Office settings and how to check the result.',
}

export default function Guides() {
  return (
    <>
      <Head h1="Before you send a file." lede="Seven guides to the metadata in photos, Office documents and PDFs: where it sits, how to remove it with the tools you already have, and when those are enough." />
      <Block id="h-guides" title="Guides">
        <ul className="guide-list">
          {GUIDES.map((g) => <li key={g.slug}><a href={`/guides/${g.slug}`}>{g.title}</a><p>{g.description}</p></li>)}
        </ul>
      </Block>
    </>
  )
}
