export type UserRole = 'admin' | 'staff';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  organization?: string;
}

export type CertificateOrientation = 'landscape' | 'portrait';
export type DimensionUnit = 'mm' | 'inch' | 'px';

export interface CertificateSize {
  name: string; // e.g. 'A4 Landscape', 'A5 Landscape', 'Custom'
  width: number;
  height: number;
  unit: DimensionUnit;
  orientation: CertificateOrientation;
  pxWidth: number; // Normalized pixels at 300 DPI for rendering
  pxHeight: number;
}

export type ElementType = 'text' | 'dynamic_field' | 'image' | 'logo' | 'signature' | 'qr_code' | 'shape' | 'line';

export interface CanvasElement {
  id: string;
  type: ElementType;
  name: string; // e.g., "Recipient Name", "BSROCKS Logo"
  x: number; // position in px or relative percentage
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  zIndex: number;
  locked?: boolean;
  
  // Text & Dynamic Field properties
  text?: string; // For text element or dynamic expression like {{NAME}}
  dynamicFieldKey?: string; // e.g. 'NAME', 'EVENT_NAME', 'DATE', 'CERTIFICATE_ID'
  fontFamily?: string;
  fontSize?: number;
  minFontSize?: number; // Minimum font size in px when auto-reducing long recipient names (defaults to 12)
  autoFit?: boolean; // Dynamic text-resizing flag to fit within plain space width
  fontWeight?: 'normal' | 'bold' | '500' | '600' | '700' | '800' | '900';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline';
  color?: string;
  align?: 'left' | 'center' | 'right' | 'justify';
  letterSpacing?: number;
  lineHeight?: number;
  
  // Image / Logo / Signature / QR properties
  src?: string; // Data URL or Image URL
  qrTargetUrl?: string; // URL template e.g. "https://app.com/verify/{{CERTIFICATE_ID}}"
  
  // Shape properties
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  borderRadius?: number;
}

export interface DynamicFieldDef {
  key: string; // e.g., 'NAME', 'TEAM_NAME'
  label: string; // e.g., 'Recipient Name', 'Team Name'
  isCustom?: boolean;
  defaultValue?: string;
}

export interface CertificateTemplate {
  id: string;
  projectId: string;
  name: string;
  size: CertificateSize;
  backgroundUrl?: string; // Custom background image or color
  backgroundColor?: string;
  elements: CanvasElement[];
  dynamicFields: DynamicFieldDef[];
  createdAt: string;
  updatedAt: string;
}

export interface DataRow {
  _rowId: string;
  [key: string]: string; // Column header -> Cell value e.g., Name: 'John Doe', Event: 'Tech Fest'
}

export interface Dataset {
  id: string;
  projectId: string;
  fileName: string;
  columns: string[];
  rowCount: number;
  rows: DataRow[];
  createdAt: string;
}

export type CertificateStatus = 'draft' | 'generated' | 'printed' | 'issued' | 'revoked';

export interface GeneratedCertificate {
  id: string; // Database ID
  projectId: string;
  templateId: string;
  certificateNumber: string; // e.g. BSR-2026-0001
  recipientName: string;
  data: Record<string, string>; // Complete field mapping values for this row
  customElementsOverridden?: CanvasElement[]; // If individual edit occurred
  status: CertificateStatus;
  createdAt: string;
  updatedAt: string;
  printedAt?: string;
}

export interface Project {
  id: string;
  name: string;
  eventName: string;
  organization: string;
  certificateType: string; // e.g. 'Participation', 'Winner', 'Achievement', 'Workshop', 'Custom'
  description?: string;
  ownerId: string;
  templateIds: string[]; // Supports multiple templates (e.g., A4 & A5)
  activeTemplateId?: string;
  datasetId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BrandingSettings {
  bsrocksLogo?: string;
  seventhSenseLogo?: string;
  organizationLogo?: string;
  eventLogo?: string;
  signatureImage?: string;
  signatureTitle?: string; // e.g. "Authorized Signatory"
  signatureName?: string; // e.g. "Dr. Alex Vance"
  primaryColor: string; // e.g. "#1e293b"
  accentColor: string; // e.g. "#0284c7"
  
  // Certificate ID config
  idPrefix: string; // e.g. "BSR-2026-"
  idStartingNumber: number; // e.g. 1
  idNumberLength: number; // e.g. 4 -> "0001"
  
  // QR verification config
  qrVerificationEnabled: boolean;
  verificationBaseUrl: string; // Defaults to window.location.origin
}

export interface GenerationJobProgress {
  total: number;
  current: number;
  successful: number;
  failed: number;
  isGenerating: boolean;
  errors: { row: number; name?: string; message: string }[];
}
