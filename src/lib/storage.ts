import {
  Project,
  CertificateTemplate,
  Dataset,
  GeneratedCertificate,
  BrandingSettings,
  UserProfile,
  CertificateSize,
} from '../types';
import {
  STANDARD_SIZES,
  DEFAULT_BRANDING,
  DEFAULT_DYNAMIC_FIELDS,
  createSeventhSenseOriginalElements,
  MASTER_TEMPLATE_1014_BACKGROUND_SVG,
  MASTER_TEMPLATE_1013_BACKGROUND_SVG,
} from '../constants/defaultTemplates';

const KEYS = {
  PROJECTS: 'bsr_ss_projects_v4',
  TEMPLATES: 'bsr_ss_templates_v4',
  DATASETS: 'bsr_ss_datasets_v4',
  CERTIFICATES: 'bsr_ss_certificates_v4',
  BRANDING: 'bsr_ss_branding_v4',
  USER: 'bsr_ss_user_v4',
};

// Seed initial default data if local storage is empty
export function initializeStorageIfNeeded(): void {
  try {
    const existingProjects = localStorage.getItem(KEYS.PROJECTS);
    if (!existingProjects) {
      seedDefaultData();
    }
  } catch (e) {
    console.error('Failed to initialize local storage:', e);
  }
}

function seedDefaultData(): void {
  const now = new Date().toISOString();

  // Initial user profile
  const defaultUser: UserProfile = {
    id: 'usr_admin_01',
    email: 'admin@bsrocks.com',
    displayName: 'Sathya Sai (Admin)',
    role: 'admin',
    organization: 'BSROCKS × SeventhSense',
  };
  localStorage.setItem(KEYS.USER, JSON.stringify(defaultUser));

  // Initial branding
  localStorage.setItem(KEYS.BRANDING, JSON.stringify(DEFAULT_BRANDING));

  const sizePortraitA4 = STANDARD_SIZES.A4_PORTRAIT;
  const sizeLandscapeA4 = STANDARD_SIZES.A4_LANDSCAPE;

  // ==========================================
  // PROJECT 1: VANDE BHARATAM 2026 (Seventh Sense World Records)
  // ==========================================
  const proj1Id = 'proj_vande_bharatam_2026';
  const tpl1Id = 'tpl_vande_bharatam_a4_port';
  const dataset1Id = 'ds_vande_bharatam_performers';

  const templateVandeBharatam: CertificateTemplate = {
    id: tpl1Id,
    projectId: proj1Id,
    name: 'Certificate No. 1014 — VANDE BHARATAM 2026 (Original Master)',
    size: sizePortraitA4,
    backgroundColor: '#ffffff',
    backgroundUrl: MASTER_TEMPLATE_1014_BACKGROUND_SVG,
    elements: createSeventhSenseOriginalElements(
      sizePortraitA4.pxWidth,
      sizePortraitA4.pxHeight,
      'VANDE BHARATAM 2026',
      "WORLD'S LARGEST INDIAN NATIONAL FLAG FORMATION BY BHARATANATYAM PERFORMERS",
      'Sathya Sai JS',
      '',
      'SSWR/IND/2026/1014'
    ),
    dynamicFields: DEFAULT_DYNAMIC_FIELDS,
    createdAt: now,
    updatedAt: now,
  };

  const dataset1: Dataset = {
    id: dataset1Id,
    projectId: proj1Id,
    fileName: 'vande_bharatam_performers_list.xlsx',
    columns: ['Name', 'Event', 'Record_Title', 'Guidance', 'Record_ID'],
    rowCount: 4,
    rows: [
      {
        _rowId: 'row_vb_1',
        Name: 'K.YASHIKA',
        Event: 'VANDE BHARATAM 2026',
        Record_Title: "WORLD'S LARGEST INDIAN NATIONAL FLAG FORMATION BY BHARATANATYAM PERFORMERS",
        Guidance: 'GURU HARIPRIYA MOHANKUMAR, SRI VIRUDHAGIRISVARAR NATYAKSHETRA',
        Record_ID: 'SSWR/IND/2026/1014',
      },
      {
        _rowId: 'row_vb_2',
        Name: 'SATHYA SAI',
        Event: 'VANDE BHARATAM 2026',
        Record_Title: "WORLD'S LARGEST INDIAN NATIONAL FLAG FORMATION BY BHARATANATYAM PERFORMERS",
        Guidance: 'GURU HARIPRIYA MOHANKUMAR, SRI VIRUDHAGIRISVARAR NATYAKSHETRA',
        Record_ID: 'SSWR/IND/2026/1015',
      },
      {
        _rowId: 'row_vb_3',
        Name: 'PRIYA DHARSHINI',
        Event: 'VANDE BHARATAM 2026',
        Record_Title: "WORLD'S LARGEST INDIAN NATIONAL FLAG FORMATION BY BHARATANATYAM PERFORMERS",
        Guidance: 'GURU HARIPRIYA MOHANKUMAR, SRI VIRUDHAGIRISVARAR NATYAKSHETRA',
        Record_ID: 'SSWR/IND/2026/1016',
      },
      {
        _rowId: 'row_vb_4',
        Name: 'ANANYA RAMESH',
        Event: 'VANDE BHARATAM 2026',
        Record_Title: "WORLD'S LARGEST INDIAN NATIONAL FLAG FORMATION BY BHARATANATYAM PERFORMERS",
        Guidance: 'GURU HARIPRIYA MOHANKUMAR, SRI VIRUDHAGIRISVARAR NATYAKSHETRA',
        Record_ID: 'SSWR/IND/2026/1017',
      },
    ],
    createdAt: now,
  };

  const vandeBharatamCerts: GeneratedCertificate[] = [
    {
      id: 'cert_vb_001',
      projectId: proj1Id,
      templateId: tpl1Id,
      certificateNumber: 'SSWR/IND/2026/1014',
      recipientName: 'K.YASHIKA',
      data: {
        NAME: 'K.YASHIKA',
        EVENT_NAME: 'VANDE BHARATAM 2026',
        RECORD_TITLE: "WORLD'S LARGEST INDIAN NATIONAL FLAG FORMATION BY BHARATANATYAM PERFORMERS",
        RECORD_ID: 'SSWR/IND/2026/1014',
        CERTIFICATE_ID: 'SSWR/IND/2026/1014',
        CITATION: "For successfully participating in the World's Largest Indian National Flag Formation by Bharatanatyam Performers during VANDE BHARATAM 2026, under the esteemed guidance of GURU HARIPRIYA MOHANKUMAR, SRI VIRUDHAGIRISVARAR NATYAKSHETRA\n\nAs one of the 237 Bharatanatyam performers, you contributed to the first-ever Human Formation of the Indian National Flag, honouring the Nation while showcasing the values of Patriotism, Indian Classical Dance, Cultural Heritage, National Unity, and Artistic Excellence. This remarkable presentation has become an unforgettable milestone in the history of Bharatanatyam.\n\nThis historic World Record event was held on 08 August 2026 at St. Gabriel's Higher Secondary School, Broadway, George Town, Chennai – 600001.",
      },
      status: 'issued',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'cert_vb_002',
      projectId: proj1Id,
      templateId: tpl1Id,
      certificateNumber: 'SSWR/IND/2026/1015',
      recipientName: 'SATHYA SAI',
      data: {
        NAME: 'SATHYA SAI',
        EVENT_NAME: 'VANDE BHARATAM 2026',
        RECORD_TITLE: "WORLD'S LARGEST INDIAN NATIONAL FLAG FORMATION BY BHARATANATYAM PERFORMERS",
        RECORD_ID: 'SSWR/IND/2026/1015',
        CERTIFICATE_ID: 'SSWR/IND/2026/1015',
        CITATION: "For successfully participating in the World's Largest Indian National Flag Formation by Bharatanatyam Performers during VANDE BHARATAM 2026, under the esteemed guidance of GURU HARIPRIYA MOHANKUMAR, SRI VIRUDHAGIRISVARAR NATYAKSHETRA\n\nAs one of the 237 Bharatanatyam performers, you contributed to the first-ever Human Formation of the Indian National Flag, honouring the Nation while showcasing the values of Patriotism, Indian Classical Dance, Cultural Heritage, National Unity, and Artistic Excellence. This remarkable presentation has become an unforgettable milestone in the history of Bharatanatyam.\n\nThis historic World Record event was held on 08 August 2026 at St. Gabriel's Higher Secondary School, Broadway, George Town, Chennai – 600001.",
      },
      status: 'generated',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'cert_vb_003',
      projectId: proj1Id,
      templateId: tpl1Id,
      certificateNumber: 'SSWR/IND/2026/1016',
      recipientName: 'PRIYA DHARSHINI',
      data: {
        NAME: 'PRIYA DHARSHINI',
        EVENT_NAME: 'VANDE BHARATAM 2026',
        RECORD_TITLE: "WORLD'S LARGEST INDIAN NATIONAL FLAG FORMATION BY BHARATANATYAM PERFORMERS",
        RECORD_ID: 'SSWR/IND/2026/1016',
        CERTIFICATE_ID: 'SSWR/IND/2026/1016',
        CITATION: "For successfully participating in the World's Largest Indian National Flag Formation by Bharatanatyam Performers during VANDE BHARATAM 2026, under the esteemed guidance of GURU HARIPRIYA MOHANKUMAR, SRI VIRUDHAGIRISVARAR NATYAKSHETRA\n\nAs one of the 237 Bharatanatyam performers, you contributed to the first-ever Human Formation of the Indian National Flag, honouring the Nation while showcasing the values of Patriotism, Indian Classical Dance, Cultural Heritage, National Unity, and Artistic Excellence. This remarkable presentation has become an unforgettable milestone in the history of Bharatanatyam.\n\nThis historic World Record event was held on 08 August 2026 at St. Gabriel's Higher Secondary School, Broadway, George Town, Chennai – 600001.",
      },
      status: 'printed',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'cert_vb_004',
      projectId: proj1Id,
      templateId: tpl1Id,
      certificateNumber: 'SSWR/IND/2026/1017',
      recipientName: 'ANANYA RAMESH',
      data: {
        NAME: 'ANANYA RAMESH',
        EVENT_NAME: 'VANDE BHARATAM 2026',
        RECORD_TITLE: "WORLD'S LARGEST INDIAN NATIONAL FLAG FORMATION BY BHARATANATYAM PERFORMERS",
        RECORD_ID: 'SSWR/IND/2026/1017',
        CERTIFICATE_ID: 'SSWR/IND/2026/1017',
        CITATION: "For successfully participating in the World's Largest Indian National Flag Formation by Bharatanatyam Performers during VANDE BHARATAM 2026, under the esteemed guidance of GURU HARIPRIYA MOHANKUMAR, SRI VIRUDHAGIRISVARAR NATYAKSHETRA\n\nAs one of the 237 Bharatanatyam performers, you contributed to the first-ever Human Formation of the Indian National Flag, honouring the Nation while showcasing the values of Patriotism, Indian Classical Dance, Cultural Heritage, National Unity, and Artistic Excellence. This remarkable presentation has become an unforgettable milestone in the history of Bharatanatyam.\n\nThis historic World Record event was held on 08 August 2026 at St. Gabriel's Higher Secondary School, Broadway, George Town, Chennai – 600001.",
      },
      status: 'generated',
      createdAt: now,
      updatedAt: now,
    },
  ];

  const projectVandeBharatam: Project = {
    id: proj1Id,
    name: 'VANDE BHARATAM 2026 - World Record',
    eventName: 'VANDE BHARATAM 2026',
    organization: 'Seventh Sense World Records',
    certificateType: 'World Record Certificate',
    description: "World's Largest Indian National Flag Formation by Bharatanatyam Performers.",
    ownerId: defaultUser.id,
    templateIds: [tpl1Id],
    activeTemplateId: tpl1Id,
    datasetId: dataset1Id,
    createdAt: now,
    updatedAt: now,
  };

  // ==========================================
  // PROJECT 2: NAILATHON INDIA 2026 (Seventh Sense World Records)
  // ==========================================
  const proj2Id = 'proj_nailathon_2026';
  const tpl2Id = 'tpl_nailathon_a4_port';

  const templateNailathon: CertificateTemplate = {
    id: tpl2Id,
    projectId: proj2Id,
    name: 'Certificate No. 1013 — NAILATHON INDIA 2026 (Original Master)',
    size: sizePortraitA4,
    backgroundColor: '#ffffff',
    backgroundUrl: MASTER_TEMPLATE_1013_BACKGROUND_SVG,
    elements: createSeventhSenseOriginalElements(
      sizePortraitA4.pxWidth,
      sizePortraitA4.pxHeight,
      'NAILATHON INDIA 2026',
      'THE ULTIMATE WORLD RECORD CHALLENGE - INDIA FLAG-THEMED NAIL EXTENSION & NAIL ART',
      'Sathya Sai JS',
      '',
      'SSWR/IND/2026/1013'
    ),
    dynamicFields: DEFAULT_DYNAMIC_FIELDS,
    createdAt: now,
    updatedAt: now,
  };

  const nailathonCerts: GeneratedCertificate[] = [
    {
      id: 'cert_nl_001',
      projectId: proj2Id,
      templateId: tpl2Id,
      certificateNumber: 'SSWR/IND/2026/1013',
      recipientName: 'SOFIA. M',
      data: {
        NAME: 'SOFIA. M',
        EVENT_NAME: 'NAILATHON INDIA 2026',
        RECORD_TITLE: 'THE ULTIMATE WORLD RECORD CHALLENGE - INDIA FLAG-THEMED NAIL EXTENSION & NAIL ART',
        RECORD_ID: 'SSWR/IND/2026/1013',
        CERTIFICATE_ID: 'SSWR/IND/2026/1013',
      },
      status: 'issued',
      createdAt: now,
      updatedAt: now,
    },
  ];

  const projectNailathon: Project = {
    id: proj2Id,
    name: 'NAILATHON INDIA 2026 - World Record',
    eventName: 'NAILATHON INDIA 2026',
    organization: 'Seventh Sense World Records',
    certificateType: 'World Record Certificate',
    description: 'India Flag-Themed Nail Extension & Nail Art World Record Challenge.',
    ownerId: defaultUser.id,
    templateIds: [tpl2Id],
    activeTemplateId: tpl2Id,
    createdAt: now,
    updatedAt: now,
  };

  localStorage.setItem(KEYS.PROJECTS, JSON.stringify([projectVandeBharatam, projectNailathon]));
  localStorage.setItem(KEYS.TEMPLATES, JSON.stringify([templateVandeBharatam, templateNailathon]));
  localStorage.setItem(KEYS.DATASETS, JSON.stringify([dataset1]));
  localStorage.setItem(KEYS.CERTIFICATES, JSON.stringify([...vandeBharatamCerts, ...nailathonCerts]));
}

// === STORAGE API METHODS ===

export function getCurrentUser(): UserProfile {
  initializeStorageIfNeeded();
  const raw = localStorage.getItem(KEYS.USER);
  if (!raw) {
    return {
      id: 'usr_default',
      email: 'staff@bsrocks.com',
      displayName: 'Staff Member',
      role: 'staff',
      organization: 'BSROCKS × SeventhSense',
    };
  }
  return JSON.parse(raw);
}

export function saveCurrentUser(user: UserProfile): void {
  localStorage.setItem(KEYS.USER, JSON.stringify(user));
}

export function getBrandingSettings(): BrandingSettings {
  initializeStorageIfNeeded();
  const raw = localStorage.getItem(KEYS.BRANDING);
  if (!raw) return DEFAULT_BRANDING;
  return { ...DEFAULT_BRANDING, ...JSON.parse(raw) };
}

export function saveBrandingSettings(settings: BrandingSettings): void {
  localStorage.setItem(KEYS.BRANDING, JSON.stringify(settings));
}

export function getProjects(): Project[] {
  initializeStorageIfNeeded();
  const raw = localStorage.getItem(KEYS.PROJECTS);
  return raw ? JSON.parse(raw) : [];
}

export function getProjectById(id: string): Project | undefined {
  return getProjects().find((p) => p.id === id);
}

export function saveProject(project: Project): void {
  const projects = getProjects();
  const index = projects.findIndex((p) => p.id === project.id);
  if (index >= 0) {
    projects[index] = { ...project, updatedAt: new Date().toISOString() };
  } else {
    projects.unshift(project);
  }
  localStorage.setItem(KEYS.PROJECTS, JSON.stringify(projects));
}

export function deleteProject(id: string): void {
  const projects = getProjects().filter((p) => p.id !== id);
  localStorage.setItem(KEYS.PROJECTS, JSON.stringify(projects));

  // Clean up associated templates, datasets, certificates
  const templates = getTemplates().filter((t) => t.projectId !== id);
  localStorage.setItem(KEYS.TEMPLATES, JSON.stringify(templates));

  const datasets = getDatasets().filter((d) => d.projectId !== id);
  localStorage.setItem(KEYS.DATASETS, JSON.stringify(datasets));

  const certificates = getCertificates().filter((c) => c.projectId !== id);
  localStorage.setItem(KEYS.CERTIFICATES, JSON.stringify(certificates));
}

export function getTemplates(): CertificateTemplate[] {
  initializeStorageIfNeeded();
  const raw = localStorage.getItem(KEYS.TEMPLATES);
  return raw ? JSON.parse(raw) : [];
}

export function getTemplatesForProject(projectId: string): CertificateTemplate[] {
  return getTemplates().filter((t) => t.projectId === projectId);
}

export function getTemplateById(id: string): CertificateTemplate | undefined {
  return getTemplates().find((t) => t.id === id);
}

export function saveTemplate(template: CertificateTemplate): void {
  const templates = getTemplates();
  const index = templates.findIndex((t) => t.id === template.id);
  if (index >= 0) {
    templates[index] = { ...template, updatedAt: new Date().toISOString() };
  } else {
    templates.push(template);
  }
  localStorage.setItem(KEYS.TEMPLATES, JSON.stringify(templates));
}

export function deleteTemplate(id: string): void {
  const templates = getTemplates().filter((t) => t.id !== id);
  localStorage.setItem(KEYS.TEMPLATES, JSON.stringify(templates));
}

export function getDatasets(): Dataset[] {
  initializeStorageIfNeeded();
  const raw = localStorage.getItem(KEYS.DATASETS);
  return raw ? JSON.parse(raw) : [];
}

export function getDatasetById(id: string): Dataset | undefined {
  return getDatasets().find((d) => d.id === id);
}

export function getDatasetForProject(projectId: string): Dataset | undefined {
  return getDatasets().find((d) => d.projectId === projectId);
}

export function saveDataset(dataset: Dataset): void {
  const datasets = getDatasets();
  const index = datasets.findIndex((d) => d.id === dataset.id);
  if (index >= 0) {
    datasets[index] = dataset;
  } else {
    datasets.unshift(dataset);
  }
  localStorage.setItem(KEYS.DATASETS, JSON.stringify(datasets));
}

export function getCertificates(): GeneratedCertificate[] {
  initializeStorageIfNeeded();
  const raw = localStorage.getItem(KEYS.CERTIFICATES);
  return raw ? JSON.parse(raw) : [];
}

export function getCertificatesForProject(projectId: string): GeneratedCertificate[] {
  return getCertificates().filter((c) => c.projectId === projectId);
}

export function getCertificateById(id: string): GeneratedCertificate | undefined {
  return getCertificates().find((c) => c.id === id || c.certificateNumber === id);
}

export function saveCertificate(cert: GeneratedCertificate): void {
  const certs = getCertificates();
  const index = certs.findIndex((c) => c.id === cert.id);
  if (index >= 0) {
    certs[index] = { ...cert, updatedAt: new Date().toISOString() };
  } else {
    certs.unshift(cert);
  }
  localStorage.setItem(KEYS.CERTIFICATES, JSON.stringify(certs));
}

export function saveBulkCertificates(newCerts: GeneratedCertificate[]): void {
  const certs = getCertificates();
  const existingMap = new Map(certs.map((c) => [c.id, c]));

  for (const c of newCerts) {
    existingMap.set(c.id, c);
  }

  const updatedArray = Array.from(existingMap.values());
  localStorage.setItem(KEYS.CERTIFICATES, JSON.stringify(updatedArray));
}

export function updateCertificateStatus(certId: string, status: GeneratedCertificate['status']): void {
  const cert = getCertificateById(certId);
  if (cert) {
    cert.status = status;
    if (status === 'printed') {
      cert.printedAt = new Date().toISOString();
    }
    saveCertificate(cert);
  }
}

export function deleteCertificate(id: string): void {
  const certs = getCertificates().filter((c) => c.id !== id);
  localStorage.setItem(KEYS.CERTIFICATES, JSON.stringify(certs));
}
