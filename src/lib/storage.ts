import {
  Project,
  CertificateTemplate,
  Dataset,
  GeneratedCertificate,
  BrandingSettings,
  UserProfile,
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

// ==========================================
// IN-MEMORY RUNTIME CACHE
// Ensures lightning-fast synchronous operations & protects against localStorage quota crashes
// ==========================================
let cachedProjects: Project[] | null = null;
let cachedTemplates: CertificateTemplate[] | null = null;
let cachedDatasets: Dataset[] | null = null;
let cachedCertificates: GeneratedCertificate[] | null = null;
let cachedBranding: BrandingSettings | null = null;
let cachedUser: UserProfile | null = null;
let isStorageInitialized = false;

// ==========================================
// INDEXEDDB DURABLE STORAGE LAYER
// Provides virtually unlimited offline storage for large templates, SVGs, and bulk certificates
// ==========================================
const IDB_NAME = 'bsr_certificate_db_v4';
const IDB_VERSION = 1;
const IDB_STORES = {
  PROJECTS: 'projects',
  TEMPLATES: 'templates',
  DATASETS: 'datasets',
  CERTIFICATES: 'certificates',
  META: 'meta',
};

let idbInstance: IDBDatabase | null = null;
let idbPromise: Promise<IDBDatabase | null> | null = null;

function getIDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null);
  }
  if (idbInstance) {
    return Promise.resolve(idbInstance);
  }
  if (idbPromise) {
    return idbPromise;
  }

  idbPromise = new Promise((resolve) => {
    try {
      const request = indexedDB.open(IDB_NAME, IDB_VERSION);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(IDB_STORES.PROJECTS)) {
          db.createObjectStore(IDB_STORES.PROJECTS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(IDB_STORES.TEMPLATES)) {
          db.createObjectStore(IDB_STORES.TEMPLATES, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(IDB_STORES.DATASETS)) {
          db.createObjectStore(IDB_STORES.DATASETS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(IDB_STORES.CERTIFICATES)) {
          db.createObjectStore(IDB_STORES.CERTIFICATES, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(IDB_STORES.META)) {
          db.createObjectStore(IDB_STORES.META);
        }
      };

      request.onsuccess = (event) => {
        idbInstance = (event.target as IDBOpenDBRequest).result;
        resolve(idbInstance);
      };

      request.onerror = () => {
        console.warn('[Storage] IndexedDB open failed, using safe memory + localStorage fallback.');
        resolve(null);
      };
    } catch (e) {
      console.warn('[Storage] IndexedDB initialization error:', e);
      resolve(null);
    }
  });

  return idbPromise;
}

// Background asynchronous synchronization to IndexedDB
async function persistItemToIDB(storeName: string, item: any): Promise<void> {
  try {
    const db = await getIDB();
    if (!db) return;
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    store.put(item);
  } catch (err) {
    // Non-blocking background sync
  }
}

async function persistBatchToIDB(storeName: string, items: any[]): Promise<void> {
  try {
    const db = await getIDB();
    if (!db) return;
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    for (const item of items) {
      store.put(item);
    }
  } catch (err) {
    // Non-blocking background sync
  }
}

async function deleteItemFromIDB(storeName: string, key: string): Promise<void> {
  try {
    const db = await getIDB();
    if (!db) return;
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    store.delete(key);
  } catch (err) {
    // Non-blocking
  }
}

// ==========================================
// SAFE LOCALSTORAGE WRAPPERS (QUOTA PROTECTION)
// ==========================================

function cleanupLegacyStorage(): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const legacyKeys = [
      'bsr_ss_projects_v1', 'bsr_ss_projects_v2', 'bsr_ss_projects_v3',
      'bsr_ss_templates_v1', 'bsr_ss_templates_v2', 'bsr_ss_templates_v3',
      'bsr_ss_datasets_v1', 'bsr_ss_datasets_v2', 'bsr_ss_datasets_v3',
      'bsr_ss_certificates_v1', 'bsr_ss_certificates_v2', 'bsr_ss_certificates_v3',
      'bsr_ss_branding_v1', 'bsr_ss_branding_v2', 'bsr_ss_branding_v3',
    ];

    for (const key of legacyKeys) {
      try {
        localStorage.removeItem(key);
      } catch (e) {}
    }

    // Clean any oversized temporary keys
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('temp_') || k.includes('cache_') || k.includes('preview_'))) {
        try {
          localStorage.removeItem(k);
        } catch (e) {}
      }
    }
  } catch (e) {
    // Ignore
  }
}

function safeLocalStorageGet<T>(key: string, fallback: T): T {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return fallback;
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}

function safeLocalStorageSet(key: string, value: any): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  try {
    const jsonStr = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, jsonStr);
    return true;
  } catch (err: any) {
    // Quota exceeded recovery
    cleanupLegacyStorage();
    try {
      const jsonStr = typeof value === 'string' ? value : JSON.stringify(value);
      localStorage.setItem(key, jsonStr);
      return true;
    } catch (retryErr) {
      // If template array is large due to SVG/base64 data, store a lightweight version in localStorage
      // Complete full-fidelity objects are safely preserved in-memory and in IndexedDB
      if (key === KEYS.TEMPLATES && Array.isArray(value)) {
        try {
          const lightweight = value.map((t: CertificateTemplate) => {
            if (t.backgroundUrl && t.backgroundUrl.length > 5000) {
              return {
                ...t,
                backgroundUrl: t.backgroundUrl.startsWith('data:') ? undefined : t.backgroundUrl,
              };
            }
            return t;
          });
          localStorage.setItem(key, JSON.stringify(lightweight));
          return true;
        } catch (e3) {
          // If still exceeded, clear the key in localStorage; in-memory cache & IndexedDB maintain full data
          try {
            localStorage.removeItem(key);
          } catch (e4) {}
        }
      } else if (key === KEYS.CERTIFICATES && Array.isArray(value)) {
        try {
          // Keep only the most recent 15 certificates in localStorage
          const subset = value.slice(0, 15);
          localStorage.setItem(key, JSON.stringify(subset));
          return true;
        } catch (e5) {
          try {
            localStorage.removeItem(key);
          } catch (e6) {}
        }
      }
      return false;
    }
  }
}

// ==========================================
// SEED INITIAL DEFAULT DATA
// ==========================================
function seedDefaultData(): void {
  const now = new Date().toISOString();

  // Initial user profile
  const defaultUser: UserProfile = {
    id: 'usr_admin_01',
    email: 'admin@bsrocks.com',
    displayName: 'Administrator',
    role: 'admin',
    organization: 'BSROCKS × SeventhSense',
  };
  cachedUser = defaultUser;
  safeLocalStorageSet(KEYS.USER, defaultUser);

  // Initial branding
  cachedBranding = DEFAULT_BRANDING;
  safeLocalStorageSet(KEYS.BRANDING, DEFAULT_BRANDING);

  const sizePortraitA4 = STANDARD_SIZES.A4_PORTRAIT;

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
      'NAME',
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
        Name: 'S. MEENAKSHI',
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
      recipientName: 'S. MEENAKSHI',
      data: {
        NAME: 'S. MEENAKSHI',
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
      'NAME',
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

  const allProjects = [projectVandeBharatam, projectNailathon];
  const allTemplates = [templateVandeBharatam, templateNailathon];
  const allDatasets = [dataset1];
  const allCertificates = [...vandeBharatamCerts, ...nailathonCerts];

  cachedProjects = allProjects;
  cachedTemplates = allTemplates;
  cachedDatasets = allDatasets;
  cachedCertificates = allCertificates;

  safeLocalStorageSet(KEYS.PROJECTS, allProjects);
  safeLocalStorageSet(KEYS.TEMPLATES, allTemplates);
  safeLocalStorageSet(KEYS.DATASETS, allDatasets);
  safeLocalStorageSet(KEYS.CERTIFICATES, allCertificates);

  // Background IndexedDB sync
  persistBatchToIDB(IDB_STORES.PROJECTS, allProjects);
  persistBatchToIDB(IDB_STORES.TEMPLATES, allTemplates);
  persistBatchToIDB(IDB_STORES.DATASETS, allDatasets);
  persistBatchToIDB(IDB_STORES.CERTIFICATES, allCertificates);
}

// Seed initial default data if local storage / memory is empty
export function initializeStorageIfNeeded(): void {
  if (isStorageInitialized && cachedProjects !== null) {
    return;
  }

  try {
    cleanupLegacyStorage();

    const existingProjects = safeLocalStorageGet<Project[] | null>(KEYS.PROJECTS, null);
    if (!existingProjects || existingProjects.length === 0) {
      seedDefaultData();
    } else {
      cachedProjects = existingProjects;
      cachedTemplates = safeLocalStorageGet<CertificateTemplate[]>(KEYS.TEMPLATES, []);
      cachedDatasets = safeLocalStorageGet<Dataset[]>(KEYS.DATASETS, []);
      cachedCertificates = safeLocalStorageGet<GeneratedCertificate[]>(KEYS.CERTIFICATES, []);
      cachedBranding = safeLocalStorageGet<BrandingSettings>(KEYS.BRANDING, DEFAULT_BRANDING);
      cachedUser = safeLocalStorageGet<UserProfile>(KEYS.USER, {
        id: 'usr_admin_01',
        email: 'admin@bsrocks.com',
        displayName: 'Administrator',
        role: 'admin',
        organization: 'BSROCKS × SeventhSense',
      });
    }

    isStorageInitialized = true;

    // Asynchronously load full-fidelity objects from IndexedDB if available
    getIDB().then(async (db) => {
      if (!db) return;
      try {
        const tx = db.transaction(
          [IDB_STORES.PROJECTS, IDB_STORES.TEMPLATES, IDB_STORES.DATASETS, IDB_STORES.CERTIFICATES],
          'readonly'
        );

        const idbTemplatesReq = tx.objectStore(IDB_STORES.TEMPLATES).getAll();
        idbTemplatesReq.onsuccess = () => {
          if (idbTemplatesReq.result && idbTemplatesReq.result.length > 0) {
            // Merge with in-memory templates to restore full backgroundUrls
            const idbMap = new Map(idbTemplatesReq.result.map((t: CertificateTemplate) => [t.id, t]));
            if (cachedTemplates) {
              cachedTemplates = cachedTemplates.map((t) => idbMap.get(t.id) || t);
              // Also add any templates present in IDB but not in cache
              for (const [id, tpl] of idbMap.entries()) {
                if (!cachedTemplates.some((t) => t.id === id)) {
                  cachedTemplates.push(tpl);
                }
              }
            } else {
              cachedTemplates = idbTemplatesReq.result;
            }
          }
        };
      } catch (err) {
        // Safe fallback
      }
    });
  } catch (e) {
    console.warn('[Storage] Safe init triggered fallback:', e);
    if (!cachedProjects) {
      seedDefaultData();
    }
  }
}

// === STORAGE API METHODS ===

export function getCurrentUser(): UserProfile {
  initializeStorageIfNeeded();
  if (cachedUser) return cachedUser;
  const user = safeLocalStorageGet<UserProfile>(KEYS.USER, {
    id: 'usr_default',
    email: 'staff@bsrocks.com',
    displayName: 'Staff Member',
    role: 'staff',
    organization: 'BSROCKS × SeventhSense',
  });
  cachedUser = user;
  return user;
}

export function saveCurrentUser(user: UserProfile): void {
  cachedUser = user;
  safeLocalStorageSet(KEYS.USER, user);
}

export function getBrandingSettings(): BrandingSettings {
  initializeStorageIfNeeded();
  if (cachedBranding) return cachedBranding;
  const raw = safeLocalStorageGet<BrandingSettings>(KEYS.BRANDING, DEFAULT_BRANDING);
  cachedBranding = { ...DEFAULT_BRANDING, ...raw };
  return cachedBranding;
}

export function saveBrandingSettings(settings: BrandingSettings): void {
  cachedBranding = settings;
  safeLocalStorageSet(KEYS.BRANDING, settings);
}

export function getProjects(): Project[] {
  initializeStorageIfNeeded();
  if (cachedProjects) return cachedProjects;
  const projects = safeLocalStorageGet<Project[]>(KEYS.PROJECTS, []);
  cachedProjects = projects;
  return projects;
}

export function getProjectById(id: string): Project | undefined {
  return getProjects().find((p) => p.id === id);
}

export function saveProject(project: Project): void {
  initializeStorageIfNeeded();
  const projects = [...getProjects()];
  const index = projects.findIndex((p) => p.id === project.id);
  const updatedProject = { ...project, updatedAt: new Date().toISOString() };

  if (index >= 0) {
    projects[index] = updatedProject;
  } else {
    projects.unshift(updatedProject);
  }

  cachedProjects = projects;
  safeLocalStorageSet(KEYS.PROJECTS, projects);
  persistItemToIDB(IDB_STORES.PROJECTS, updatedProject);
}

export function deleteProject(id: string): void {
  initializeStorageIfNeeded();
  const projects = getProjects().filter((p) => p.id !== id);
  cachedProjects = projects;
  safeLocalStorageSet(KEYS.PROJECTS, projects);
  deleteItemFromIDB(IDB_STORES.PROJECTS, id);

  // Clean up associated templates, datasets, certificates
  const templates = getTemplates().filter((t) => t.projectId !== id);
  cachedTemplates = templates;
  safeLocalStorageSet(KEYS.TEMPLATES, templates);

  const datasets = getDatasets().filter((d) => d.projectId !== id);
  cachedDatasets = datasets;
  safeLocalStorageSet(KEYS.DATASETS, datasets);

  const certificates = getCertificates().filter((c) => c.projectId !== id);
  cachedCertificates = certificates;
  safeLocalStorageSet(KEYS.CERTIFICATES, certificates);
}

export function getTemplates(): CertificateTemplate[] {
  initializeStorageIfNeeded();
  if (cachedTemplates) return cachedTemplates;
  const templates = safeLocalStorageGet<CertificateTemplate[]>(KEYS.TEMPLATES, []);
  cachedTemplates = templates;
  return templates;
}

export function getTemplatesForProject(projectId: string): CertificateTemplate[] {
  return getTemplates().filter((t) => t.projectId === projectId);
}

export function getTemplateById(id: string): CertificateTemplate | undefined {
  return getTemplates().find((t) => t.id === id);
}

export function saveTemplate(template: CertificateTemplate): void {
  initializeStorageIfNeeded();
  const templates = [...getTemplates()];
  const index = templates.findIndex((t) => t.id === template.id);
  const updatedTemplate = { ...template, updatedAt: new Date().toISOString() };

  if (index >= 0) {
    templates[index] = updatedTemplate;
  } else {
    templates.push(updatedTemplate);
  }

  cachedTemplates = templates;
  safeLocalStorageSet(KEYS.TEMPLATES, templates);
  persistItemToIDB(IDB_STORES.TEMPLATES, updatedTemplate);
}

export function deleteTemplate(id: string): void {
  initializeStorageIfNeeded();
  const templates = getTemplates().filter((t) => t.id !== id);
  cachedTemplates = templates;
  safeLocalStorageSet(KEYS.TEMPLATES, templates);
  deleteItemFromIDB(IDB_STORES.TEMPLATES, id);
}

export function getDatasets(): Dataset[] {
  initializeStorageIfNeeded();
  if (cachedDatasets) return cachedDatasets;
  const datasets = safeLocalStorageGet<Dataset[]>(KEYS.DATASETS, []);
  cachedDatasets = datasets;
  return datasets;
}

export function getDatasetById(id: string): Dataset | undefined {
  return getDatasets().find((d) => d.id === id);
}

export function getDatasetForProject(projectId: string): Dataset | undefined {
  return getDatasets().find((d) => d.projectId === projectId);
}

export function saveDataset(dataset: Dataset): void {
  initializeStorageIfNeeded();
  const datasets = [...getDatasets()];
  const index = datasets.findIndex((d) => d.id === dataset.id);

  if (index >= 0) {
    datasets[index] = dataset;
  } else {
    datasets.unshift(dataset);
  }

  cachedDatasets = datasets;
  safeLocalStorageSet(KEYS.DATASETS, datasets);
  persistItemToIDB(IDB_STORES.DATASETS, dataset);
}

export function getCertificates(): GeneratedCertificate[] {
  initializeStorageIfNeeded();
  if (cachedCertificates) return cachedCertificates;
  const certs = safeLocalStorageGet<GeneratedCertificate[]>(KEYS.CERTIFICATES, []);
  cachedCertificates = certs;
  return certs;
}

export function getCertificatesForProject(projectId: string): GeneratedCertificate[] {
  return getCertificates().filter((c) => c.projectId === projectId);
}

export function getCertificateById(id: string): GeneratedCertificate | undefined {
  return getCertificates().find((c) => c.id === id || c.certificateNumber === id);
}

export function saveCertificate(cert: GeneratedCertificate): void {
  initializeStorageIfNeeded();
  const certs = [...getCertificates()];
  const index = certs.findIndex((c) => c.id === cert.id);
  const updatedCert = { ...cert, updatedAt: new Date().toISOString() };

  if (index >= 0) {
    certs[index] = updatedCert;
  } else {
    certs.unshift(updatedCert);
  }

  cachedCertificates = certs;
  safeLocalStorageSet(KEYS.CERTIFICATES, certs);
  persistItemToIDB(IDB_STORES.CERTIFICATES, updatedCert);
}

export function saveBulkCertificates(newCerts: GeneratedCertificate[]): void {
  initializeStorageIfNeeded();
  const certs = getCertificates();
  const existingMap = new Map(certs.map((c) => [c.id, c]));

  for (const c of newCerts) {
    existingMap.set(c.id, c);
  }

  const updatedArray = Array.from(existingMap.values());
  cachedCertificates = updatedArray;
  safeLocalStorageSet(KEYS.CERTIFICATES, updatedArray);
  persistBatchToIDB(IDB_STORES.CERTIFICATES, newCerts);
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
  initializeStorageIfNeeded();
  const certs = getCertificates().filter((c) => c.id !== id);
  cachedCertificates = certs;
  safeLocalStorageSet(KEYS.CERTIFICATES, certs);
  deleteItemFromIDB(IDB_STORES.CERTIFICATES, id);
}
