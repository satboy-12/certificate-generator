import { CertificateSize, CanvasElement, DynamicFieldDef, BrandingSettings } from '../types';

export const STANDARD_SIZES: Record<string, CertificateSize> = {
  A4_LANDSCAPE: {
    name: 'A4 Landscape',
    width: 297,
    height: 210,
    unit: 'mm',
    orientation: 'landscape',
    pxWidth: 1123,
    pxHeight: 794,
  },
  A4_PORTRAIT: {
    name: 'A4 Portrait',
    width: 210,
    height: 297,
    unit: 'mm',
    orientation: 'portrait',
    pxWidth: 794,
    pxHeight: 1123,
  },
  A5_LANDSCAPE: {
    name: 'A5 Landscape',
    width: 210,
    height: 148,
    unit: 'mm',
    orientation: 'landscape',
    pxWidth: 794,
    pxHeight: 559,
  },
  A5_PORTRAIT: {
    name: 'A5 Portrait',
    width: 148,
    height: 210,
    unit: 'mm',
    orientation: 'portrait',
    pxWidth: 559,
    pxHeight: 794,
  },
};

// SVG Assets for Original Seventh Sense World Records Certificates
export const SEVENTH_SENSE_LOGO_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
  <circle cx="150" cy="150" r="142" fill="#0e1838" stroke="#d4af37" stroke-width="6"/>
  <circle cx="150" cy="150" r="130" fill="#0e1838" stroke="#ffffff" stroke-width="2"/>
  <circle cx="150" cy="150" r="75" fill="#0e1838" stroke="#d4af37" stroke-width="2"/>
  <path id="topArc" d="M 35,150 A 115,115 0 1,1 265,150" fill="none"/>
  <path id="bottomArc" d="M 265,150 A 115,115 0 1,1 35,150" fill="none"/>
  <text fill="#ffffff" font-family="Arial, sans-serif" font-weight="900" font-size="20" letter-spacing="3">
    <textPath href="#topArc" startOffset="50%" text-anchor="middle">SEVENTH SENSE</textPath>
  </text>
  <text fill="#ffffff" font-family="Arial, sans-serif" font-weight="900" font-size="20" letter-spacing="3">
    <textPath href="#bottomArc" startOffset="50%" text-anchor="middle">★ WORLD RECORDS ★</textPath>
  </text>
  <g fill="#d4af37">
    <circle cx="120" cy="115" r="9"/>
    <circle cx="150" cy="105" r="9"/>
    <circle cx="180" cy="115" r="9"/>
    <circle cx="105" cy="140" r="9"/>
    <circle cx="135" cy="135" r="9"/>
    <circle cx="165" cy="135" r="9"/>
    <circle cx="195" cy="140" r="9"/>
    <circle cx="120" cy="165" r="9"/>
    <circle cx="150" cy="175" r="9"/>
    <circle cx="180" cy="165" r="9"/>
    <circle cx="150" cy="195" r="9"/>
  </g>
</svg>
`)}`;

export const SEVENTH_SENSE_RECORD_HOLDER_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 90" width="340" height="90">
  <rect x="5" y="22" width="330" height="46" fill="#0e1838" rx="4" stroke="#d4af37" stroke-width="2"/>
  <text x="65" y="52" fill="#ffffff" font-family="Arial, sans-serif" font-weight="900" font-size="20" letter-spacing="3" text-anchor="middle">RECORD</text>
  <text x="275" y="52" fill="#ffffff" font-family="Arial, sans-serif" font-weight="900" font-size="20" letter-spacing="3" text-anchor="middle">HOLDER</text>
  <circle cx="170" cy="45" r="40" fill="#0e1838" stroke="#d4af37" stroke-width="3"/>
  <circle cx="170" cy="45" r="36" fill="#0e1838" stroke="#ffffff" stroke-width="1"/>
  <path id="badgeArc" d="M 135,45 A 32,32 0 1,1 205,45" fill="none"/>
  <text fill="#ffffff" font-family="Arial, sans-serif" font-weight="bold" font-size="8">
    <textPath href="#badgeArc" startOffset="50%" text-anchor="middle">SEVENTH SENSE</textPath>
  </text>
  <g fill="#d4af37">
    <circle cx="162" cy="40" r="3"/>
    <circle cx="170" cy="36" r="3"/>
    <circle cx="178" cy="40" r="3"/>
    <circle cx="162" cy="50" r="3"/>
    <circle cx="170" cy="54" r="3"/>
    <circle cx="178" cy="50" r="3"/>
  </g>
</svg>
`)}`;

export const SAKTHIBALA_SIGNATURE_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 90" width="260" height="90">
  <path d="M 30,55 C 45,20 60,10 75,45 C 90,80 100,20 120,40 C 140,60 160,25 180,45 C 200,65 220,15 240,35" fill="none" stroke="#0e1838" stroke-width="3" stroke-linecap="round"/>
  <text x="135" y="52" font-family="Georgia, serif" font-style="italic" font-size="34" font-weight="bold" fill="#0e1838" text-anchor="middle">Sakthibala</text>
</svg>
`)}`;

export const SEVENTH_SENSE_MASTER_ORIGINAL_BACKGROUND_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 794 1123" width="794" height="1123">
  <defs>
    <pattern id="wm_original" width="260" height="100" patternUnits="userSpaceOnUse" patternTransform="rotate(-25)">
      <text x="0" y="25" fill="#000000" fill-opacity="0.04" font-family="Arial, sans-serif" font-weight="900" font-size="8.5" letter-spacing="1">SEVENTH SENSE WORLD RECORDS</text>
      <text x="130" y="75" fill="#000000" fill-opacity="0.04" font-family="Arial, sans-serif" font-weight="900" font-size="8.5" letter-spacing="1">SEVENTH SENSE WORLD RECORDS</text>
    </pattern>
  </defs>

  <!-- Outer Cream Padding -->
  <rect width="794" height="1123" fill="#fffbe6" />

  <!-- Inner Canvas Page -->
  <rect x="30" y="30" width="734" height="1063" fill="#ffffff" />
  <rect x="30" y="30" width="734" height="1063" fill="url(#wm_original)" />

  <!-- Outer Deep Navy Frame -->
  <rect x="30" y="30" width="734" height="1063" fill="none" stroke="#0e1838" stroke-width="12" />

  <!-- Inner Gold Accent Border -->
  <rect x="42" y="42" width="710" height="1039" fill="none" stroke="#d4af37" stroke-width="3" />

  <!-- Inner Navy Hairline Border -->
  <rect x="48" y="48" width="698" height="1027" fill="none" stroke="#0e1838" stroke-width="1.5" />

  <!-- Top Official Circular Seal Logo Emblem -->
  <g transform="translate(397, 210)">
    <circle cx="0" cy="0" r="90" fill="#0e1838" stroke="#d4af37" stroke-width="4"/>
    <circle cx="0" cy="0" r="80" fill="#0e1838" stroke="#ffffff" stroke-width="2"/>
    <circle cx="0" cy="0" r="48" fill="#0e1838" stroke="#d4af37" stroke-width="1.5"/>
    <path id="topArcMaster" d="M -68,0 A 68,68 0 1,1 68,0" fill="none"/>
    <path id="bottomArcMaster" d="M 68,0 A 68,68 0 1,1 -68,0" fill="none"/>
    <text fill="#ffffff" font-family="Arial, sans-serif" font-weight="900" font-size="11.5" letter-spacing="2">
      <textPath href="#topArcMaster" startOffset="50%" text-anchor="middle">SEVENTH SENSE</textPath>
    </text>
    <text fill="#ffffff" font-family="Arial, sans-serif" font-weight="900" font-size="11.5" letter-spacing="2">
      <textPath href="#bottomArcMaster" startOffset="50%" text-anchor="middle">★ WORLD RECORDS ★</textPath>
    </text>
    <!-- Molecule/Dot Network Emblem Center -->
    <g fill="#d4af37">
      <circle cx="-18" cy="-12" r="5"/><circle cx="0" cy="-18" r="5"/><circle cx="18" cy="-12" r="5"/>
      <circle cx="-26" cy="3" r="5"/><circle cx="-9" cy="0" r="5"/><circle cx="9" cy="0" r="5"/><circle cx="26" cy="3" r="5"/>
      <circle cx="-18" cy="15" r="5"/><circle cx="0" cy="21" r="5"/><circle cx="18" cy="15" r="5"/>
      <circle cx="0" cy="-3" r="5" fill="#ffffff"/>
    </g>
  </g>

  <!-- Boxed CERTIFICATE Header Title -->
  <g transform="translate(397, 345)">
    <rect x="-105" y="-18" width="210" height="36" fill="#ffffff" stroke="#0e1838" stroke-width="3"/>
    <text x="0" y="7" fill="#0e1838" font-family="Arial, sans-serif" font-weight="900" font-size="21" letter-spacing="3" text-anchor="middle">CERTIFICATE</text>
  </g>

  <!-- Bottom Official RECORD HOLDER Badge -->
  <g transform="translate(397, 950)">
    <rect x="-120" y="-18" width="240" height="36" fill="#0e1838" rx="4" stroke="#d4af37" stroke-width="2"/>
    <text x="-65" y="6" fill="#ffffff" font-family="Arial, sans-serif" font-weight="900" font-size="13" letter-spacing="2" text-anchor="middle">RECORD</text>
    <text x="65" y="6" fill="#ffffff" font-family="Arial, sans-serif" font-weight="900" font-size="13" letter-spacing="2" text-anchor="middle">HOLDER</text>
    <circle cx="0" cy="0" r="26" fill="#0e1838" stroke="#d4af37" stroke-width="2.5"/>
    <circle cx="0" cy="0" r="22" fill="#0e1838" stroke="#ffffff" stroke-width="1"/>
    <g fill="#d4af37">
      <circle cx="-6" cy="-4" r="2.5"/><circle cx="0" cy="-6" r="2.5"/><circle cx="6" cy="-4" r="2.5"/>
      <circle cx="-8" cy="1" r="2.5"/><circle cx="0" cy="0" r="2.5"/><circle cx="8" cy="1" r="2.5"/>
      <circle cx="-6" cy="6" r="2.5"/><circle cx="0" cy="8" r="2.5"/><circle cx="6" cy="6" r="2.5"/>
    </g>
  </g>

  <!-- Bottom Footer Website Line -->
  <text x="397" y="1015" fill="#0e1838" font-family="Arial, sans-serif" font-weight="900" font-size="12.5" letter-spacing="1.5" text-anchor="middle">www.seventhsenseworldrecords.com</text>
</svg>
`)}`;

export const MASTER_TEMPLATE_1014_BACKGROUND_SVG = SEVENTH_SENSE_MASTER_ORIGINAL_BACKGROUND_SVG;
export const MASTER_TEMPLATE_1013_BACKGROUND_SVG = SEVENTH_SENSE_MASTER_ORIGINAL_BACKGROUND_SVG;

export const DEFAULT_DYNAMIC_FIELDS: DynamicFieldDef[] = [
  { key: 'NAME', label: 'Recipient Name', defaultValue: 'Sathya Sai JS' },
  { key: 'EVENT_NAME', label: 'Event Title', defaultValue: 'VANDE BHARATAM 2026' },
  { key: 'RECORD_TITLE', label: 'Record Title', defaultValue: "WORLD'S LARGEST INDIAN NATIONAL FLAG FORMATION BY BHARATANATYAM PERFORMERS" },
  { key: 'RECORD_ID', label: 'Record ID / Certificate ID', defaultValue: 'SSWR/IND/2026/1014' },
];

export const DEFAULT_BRANDING: BrandingSettings = {
  bsrocksLogo: '',
  seventhSenseLogo: SEVENTH_SENSE_LOGO_SVG,
  organizationLogo: SEVENTH_SENSE_LOGO_SVG,
  eventLogo: '',
  signatureImage: SAKTHIBALA_SIGNATURE_SVG,
  signatureTitle: 'Founder and Chairman',
  signatureName: 'BALASUBRAMANI SAKTHIVEL',
  primaryColor: '#0e1838',
  accentColor: '#d4af37',
  idPrefix: 'SSWR/IND/2026/',
  idStartingNumber: 1014,
  idNumberLength: 4,
  qrVerificationEnabled: true,
  verificationBaseUrl: typeof window !== 'undefined' ? window.location.origin : 'https://seventhsenseworldrecords.com',
};

// Original Seventh Sense World Records Certificate Layout Generator
// Overlays only the dynamic recipient name on top of the original master image
export function createSeventhSenseOriginalElements(
  width: number,
  height: number,
  eventName: string = 'VANDE BHARATAM 2026',
  recordTitle: string = "WORLD'S LARGEST INDIAN NATIONAL FLAG FORMATION BY BHARATANATYAM PERFORMERS",
  recipientName: string = 'Sathya Sai JS',
  citationText: string = '',
  recordId: string = 'SSWR/IND/2026/1014'
): CanvasElement[] {
  return [
    // Dynamic Recipient Name Field positioned precisely over the recipient name area
    {
      id: 'recipient-name-field',
      type: 'dynamic_field',
      name: 'Recipient Name Field',
      dynamicFieldKey: 'NAME',
      x: width / 2 - 360,
      y: 330,
      width: 720,
      height: 55,
      rotation: 0,
      opacity: 1,
      zIndex: 15,
      text: recipientName,
      fontFamily: 'serif',
      fontSize: 38,
      fontWeight: '700',
      color: '#0e1838',
      align: 'center',
    },
  ];
}

// Returns pre-built starter elements for a new template canvas
export function createSampleCertificateElements(
  width: number,
  height: number,
  title: string = 'CERTIFICATE OF PARTICIPATION'
): CanvasElement[] {
  // If portrait, return Seventh Sense original template!
  if (height > width) {
    return createSeventhSenseOriginalElements(width, height);
  }

  return [
    // Outer Frame Border
    {
      id: 'bg-frame',
      type: 'shape',
      name: 'Outer Border Frame',
      x: 20,
      y: 20,
      width: width - 40,
      height: height - 40,
      rotation: 0,
      opacity: 1,
      zIndex: 1,
      locked: true,
      fillColor: '#ffffff',
      strokeColor: '#0e1838',
      strokeWidth: 6,
      borderRadius: 0,
    },
    // Inner Decorative Accent
    {
      id: 'bg-inner-frame',
      type: 'shape',
      name: 'Inner Decorative Accent',
      x: 30,
      y: 30,
      width: width - 60,
      height: height - 60,
      rotation: 0,
      opacity: 0.9,
      zIndex: 2,
      locked: true,
      fillColor: 'transparent',
      strokeColor: '#d4af37',
      strokeWidth: 2,
      borderRadius: 0,
    },
    // Header Organization Logo / Seal
    {
      id: 'header-seal',
      type: 'logo',
      name: 'Seventh Sense Seal Logo',
      x: width / 2 - 45,
      y: 45,
      width: 90,
      height: 90,
      rotation: 0,
      opacity: 1,
      zIndex: 10,
      src: SEVENTH_SENSE_LOGO_SVG,
    },
    // Certificate Title Banner
    {
      id: 'cert-title',
      type: 'text',
      name: 'Certificate Title',
      x: width / 2 - 350,
      y: 145,
      width: 700,
      height: 45,
      rotation: 0,
      opacity: 1,
      zIndex: 5,
      text: title,
      fontFamily: 'serif',
      fontSize: 28,
      fontWeight: 'bold',
      color: '#0e1838',
      align: 'center',
      letterSpacing: 3,
    },
    // Presentation Statement Text
    {
      id: 'presentation-label',
      type: 'text',
      name: 'Presentation Text',
      x: width / 2 - 250,
      y: 195,
      width: 500,
      height: 30,
      rotation: 0,
      opacity: 1,
      zIndex: 5,
      text: 'THIS IS PROUDLY PRESENTED TO',
      fontFamily: 'sans-serif',
      fontSize: 13,
      fontWeight: '700',
      color: '#64748b',
      align: 'center',
      letterSpacing: 2,
    },
    // Dynamic Recipient Name Variable Field
    {
      id: 'recipient-name-field',
      type: 'dynamic_field',
      name: 'Recipient Name Field',
      dynamicFieldKey: 'NAME',
      x: width / 2 - 350,
      y: 230,
      width: 700,
      height: 60,
      rotation: 0,
      opacity: 1,
      zIndex: 10,
      text: '{{NAME}}',
      fontFamily: 'serif',
      fontSize: 42,
      fontWeight: '900',
      color: '#0e1838',
      align: 'center',
      letterSpacing: 1,
    },
    // Dynamic Event Name Variable Field
    {
      id: 'event-name-field',
      type: 'dynamic_field',
      name: 'Event Name Field',
      dynamicFieldKey: 'EVENT_NAME',
      x: width / 2 - 320,
      y: 300,
      width: 640,
      height: 40,
      rotation: 0,
      opacity: 1,
      zIndex: 10,
      text: '{{EVENT_NAME}}',
      fontFamily: 'sans-serif',
      fontSize: 20,
      fontWeight: '700',
      color: '#0f172a',
      align: 'center',
    },
    // Citation Body Paragraph
    {
      id: 'citation-field',
      type: 'dynamic_field',
      name: 'Citation Field',
      dynamicFieldKey: 'CITATION',
      x: 80,
      y: 350,
      width: width - 160,
      height: 200,
      rotation: 0,
      opacity: 1,
      zIndex: 10,
      text: '{{CITATION}}',
      fontFamily: 'sans-serif',
      fontSize: 13,
      fontWeight: '500',
      color: '#334155',
      align: 'center',
    },
    // Footer Left: Record ID
    {
      id: 'id-field',
      type: 'dynamic_field',
      name: 'Certificate ID Field',
      dynamicFieldKey: 'CERTIFICATE_ID',
      x: 60,
      y: height - 100,
      width: 280,
      height: 25,
      rotation: 0,
      opacity: 1,
      zIndex: 10,
      text: 'Record ID: {{CERTIFICATE_ID}}',
      fontFamily: 'monospace',
      fontSize: 12,
      fontWeight: 'bold',
      color: '#b45309',
      align: 'left',
    },
    // Footer Center: Record Holder Badge
    {
      id: 'holder-badge',
      type: 'logo',
      name: 'Record Holder Badge',
      x: width / 2 - 60,
      y: height - 110,
      width: 120,
      height: 35,
      rotation: 0,
      opacity: 1,
      zIndex: 10,
      src: SEVENTH_SENSE_RECORD_HOLDER_SVG,
    },
    // Footer Right: Signature Line & Title
    {
      id: 'sig-image',
      type: 'signature',
      name: 'Sakthibala Signature',
      x: width - 260,
      y: height - 140,
      width: 180,
      height: 45,
      rotation: 0,
      opacity: 1,
      zIndex: 10,
      src: SAKTHIBALA_SIGNATURE_SVG,
    },
    {
      id: 'sig-title-text',
      type: 'text',
      name: 'Authorized Signatory Text',
      x: width - 270,
      y: height - 90,
      width: 200,
      height: 20,
      rotation: 0,
      opacity: 1,
      zIndex: 10,
      text: 'BALASUBRAMANI SAKTHIVEL',
      fontFamily: 'sans-serif',
      fontSize: 11,
      fontWeight: 'bold',
      color: '#0e1838',
      align: 'center',
    },
    {
      id: 'sig-org-text',
      type: 'text',
      name: 'Signatory Organization',
      x: width - 270,
      y: height - 72,
      width: 200,
      height: 20,
      rotation: 0,
      opacity: 0.8,
      zIndex: 10,
      text: 'Founder and Chairman',
      fontFamily: 'sans-serif',
      fontSize: 10,
      color: '#64748b',
      align: 'center',
    },
    // Footer URL
    {
      id: 'footer-url',
      type: 'text',
      name: 'Footer Website URL',
      x: width / 2 - 200,
      y: height - 35,
      width: 400,
      height: 20,
      rotation: 0,
      opacity: 1,
      zIndex: 10,
      text: 'www.seventhsenseworldrecords.com',
      fontFamily: 'sans-serif',
      fontSize: 11,
      fontWeight: 'bold',
      color: '#0e1838',
      align: 'center',
    },
  ];
}

