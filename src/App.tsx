import React, { useState, useEffect } from 'react';
import {
  Project,
  CertificateTemplate,
  Dataset,
  GeneratedCertificate,
  BrandingSettings,
  UserProfile,
  CertificateSize,
} from './types';
import {
  initializeStorageIfNeeded,
  getProjects,
  getProjectById,
  saveProject,
  deleteProject,
  getTemplates,
  getTemplatesForProject,
  getTemplateById,
  saveTemplate,
  deleteTemplate,
  getDatasets,
  getDatasetForProject,
  saveDataset,
  getCertificates,
  getCertificatesForProject,
  saveCertificate,
  saveBulkCertificates,
  updateCertificateStatus,
  deleteCertificate,
  getBrandingSettings,
  saveBrandingSettings,
  getCurrentUser,
  saveCurrentUser,
} from './lib/storage';
import { STANDARD_SIZES, createSampleCertificateElements, DEFAULT_DYNAMIC_FIELDS } from './constants/defaultTemplates';

import { Header } from './components/Header';
import { Sidebar, NavTab } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { ProjectList } from './components/ProjectList';
import { SizeSelector } from './components/SizeSelector';
import { CertificateEditor } from './components/TemplateEditor/CertificateEditor';
import { ImportDataModal } from './components/ImportDataModal';
import { BulkGeneratorModal } from './components/BulkGeneratorModal';
import { CertificateList } from './components/CertificateList';
import { IndividualCertificateEditorModal } from './components/IndividualCertificateEditorModal';
import { CertificatePreviewModal } from './components/CertificatePreviewModal';
import { VerificationPage } from './components/VerificationPage';
import { SettingsPage } from './components/SettingsPage';
import { LoginModal } from './components/LoginModal';
import { TemplateUploadWorkflow } from './components/TemplateUploadWorkflow';

// Initialize storage synchronously before state setup
initializeStorageIfNeeded();

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile>(getCurrentUser());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<NavTab>('upload_flow');

  // Check URL path or hash for public verification route (e.g., /verify/BSR-2026-0001)
  const [publicVerifyId, setPublicVerifyId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path.includes('/verify/')) {
        const parts = path.split('/verify/');
        return parts[1] || '';
      }
      const hash = window.location.hash;
      if (hash.includes('verify=')) {
        return hash.split('verify=')[1] || '';
      }
    }
    return null;
  });

  // State collections
  const [projects, setProjects] = useState<Project[]>(() => getProjects());
  const [currentProject, setCurrentProject] = useState<Project | null>(() => {
    const list = getProjects();
    return list[0] || null;
  });

  // Ensure projects and currentProject are synchronized on mount
  useEffect(() => {
    initializeStorageIfNeeded();
    const allProj = getProjects();
    setProjects(allProj);
    if (allProj.length > 0 && !currentProject) {
      setCurrentProject(allProj[0]);
    }
  }, []);

  const [templates, setTemplates] = useState<CertificateTemplate[]>(getTemplates());
  const [branding, setBranding] = useState<BrandingSettings>(getBrandingSettings());

  const [dataset, setDataset] = useState<Dataset | undefined>(() =>
    currentProject ? getDatasetForProject(currentProject.id) : undefined
  );

  const [certificates, setCertificates] = useState<GeneratedCertificate[]>(() =>
    currentProject ? getCertificatesForProject(currentProject.id) : []
  );

  // Active Template state (supporting two template sizes per project)
  const [activeTemplate, setActiveTemplate] = useState<CertificateTemplate | null>(() => {
    if (!currentProject) return null;
    const projTemplates = getTemplatesForProject(currentProject.id);
    return projTemplates[0] || null;
  });

  // Modals state
  const [showImportModal, setShowImportModal] = useState(false);
  const [showBulkGeneratorModal, setShowBulkGeneratorModal] = useState(false);
  const [activeMapping, setActiveMapping] = useState<Record<string, string>>({});

  const [editingCert, setEditingCert] = useState<GeneratedCertificate | null>(null);
  const [previewCert, setPreviewCert] = useState<GeneratedCertificate | null>(null);

  // Refresh project state when currentProject changes
  useEffect(() => {
    if (currentProject) {
      const projTemplates = getTemplatesForProject(currentProject.id);
      setTemplates(getTemplates());
      setActiveTemplate(projTemplates[0] || null);

      const ds = getDatasetForProject(currentProject.id);
      setDataset(ds);

      const certs = getCertificatesForProject(currentProject.id);
      setCertificates(certs);
    }
  }, [currentProject?.id]);

  const refreshAllState = () => {
    const allProj = getProjects();
    setProjects(allProj);
    setTemplates(getTemplates());
    setBranding(getBrandingSettings());

    if (currentProject) {
      setDataset(getDatasetForProject(currentProject.id));
      setCertificates(getCertificatesForProject(currentProject.id));
      const projTemplates = getTemplatesForProject(currentProject.id);
      if (!activeTemplate && projTemplates[0]) {
        setActiveTemplate(projTemplates[0]);
      }
    }
  };

  // Switch project handler
  const handleSelectProject = (proj: Project) => {
    setCurrentProject(proj);
    setActiveTab('editor');
  };

  // Create Project
  const handleCreateProject = (
    projData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'templateIds'>
  ) => {
    const now = new Date().toISOString();
    const projId = `proj_${Date.now()}`;
    const tplA4Id = `tpl_${Date.now()}_a4`;
    const tplA5Id = `tpl_${Date.now()}_a5`;

    const sizeA4 = STANDARD_SIZES.A4_LANDSCAPE;
    const sizeA5 = STANDARD_SIZES.A5_LANDSCAPE;

    // Create standard A4 and A5 templates for this project
    const templateA4: CertificateTemplate = {
      id: tplA4Id,
      projectId: projId,
      name: `${projData.name} - A4 Landscape`,
      size: sizeA4,
      backgroundColor: '#ffffff',
      elements: createSampleCertificateElements(sizeA4.pxWidth, sizeA4.pxHeight, projData.certificateType.toUpperCase()),
      dynamicFields: DEFAULT_DYNAMIC_FIELDS,
      createdAt: now,
      updatedAt: now,
    };

    const templateA5: CertificateTemplate = {
      id: tplA5Id,
      projectId: projId,
      name: `${projData.name} - A5 Landscape`,
      size: sizeA5,
      backgroundColor: '#ffffff',
      elements: createSampleCertificateElements(sizeA5.pxWidth, sizeA5.pxHeight, projData.certificateType.toUpperCase()),
      dynamicFields: DEFAULT_DYNAMIC_FIELDS,
      createdAt: now,
      updatedAt: now,
    };

    const newProject: Project = {
      ...projData,
      id: projId,
      templateIds: [tplA4Id, tplA5Id],
      activeTemplateId: tplA4Id,
      createdAt: now,
      updatedAt: now,
    };

    saveTemplate(templateA4);
    saveTemplate(templateA5);
    saveProject(newProject);

    refreshAllState();
    setCurrentProject(newProject);
    setActiveTemplate(templateA4);
    setActiveTab('editor');
  };

  // Save updated template
  const handleSaveTemplate = (updatedTemplate: CertificateTemplate) => {
    saveTemplate(updatedTemplate);
    setActiveTemplate(updatedTemplate);
    refreshAllState();
  };

  // Change active template paper size or create new size variant
  const handleSelectSizeForTemplate = (newSize: CertificateSize) => {
    if (!activeTemplate || !currentProject) return;

    const updatedTemplate: CertificateTemplate = {
      ...activeTemplate,
      size: newSize,
      name: `${currentProject.name} - ${newSize.name}`,
      elements: createSampleCertificateElements(newSize.pxWidth, newSize.pxHeight, currentProject.certificateType.toUpperCase()),
      updatedAt: new Date().toISOString(),
    };

    saveTemplate(updatedTemplate);
    setActiveTemplate(updatedTemplate);
    refreshAllState();
  };

  // Save imported Excel dataset & mapping
  const handleSaveDataset = (newDataset: Dataset, mapping: Record<string, string>) => {
    saveDataset(newDataset);
    setDataset(newDataset);
    setActiveMapping(mapping);
    setShowImportModal(false);

    if (currentProject) {
      currentProject.datasetId = newDataset.id;
      saveProject(currentProject);
    }

    refreshAllState();
    // Open bulk generator modal immediately
    setShowBulkGeneratorModal(true);
  };

  // Complete bulk generation job
  const handleCompleteBulkGeneration = (generatedList: GeneratedCertificate[]) => {
    saveBulkCertificates(generatedList);
    setShowBulkGeneratorModal(false);
    refreshAllState();
    setActiveTab('certificates');
  };

  // Render Public Verification Page directly if URL is /verify/
  if (publicVerifyId !== null) {
    return (
      <VerificationPage
        initialCertId={publicVerifyId}
        branding={branding}
      />
    );
  }

  // Login Modal if unauthenticated
  if (!isAuthenticated) {
    return (
      <LoginModal
        onLoginSuccess={(usr) => {
          setCurrentUser(usr);
          saveCurrentUser(usr);
          setIsAuthenticated(true);
        }}
      />
    );
  }

  const projTemplates = currentProject ? getTemplatesForProject(currentProject.id) : [];

  const effectiveProject: Project = currentProject || projects[0] || {
    id: 'proj_default_master',
    name: 'Vande Bharatam 2026',
    eventName: 'Seventh Sense World Records 2026',
    organization: 'BSROCKS × SeventhSense',
    certificateType: 'achievement',
    description: 'Default Seventh Sense Master Project',
    ownerId: currentUser?.id || 'usr_admin_01',
    templateIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased">
      {/* Top Header */}
      <Header
        currentProject={currentProject || effectiveProject}
        projects={projects.length > 0 ? projects : [effectiveProject]}
        user={currentUser}
        branding={branding}
        onSelectProject={handleSelectProject}
        onNewProjectClick={() => setActiveTab('projects')}
        onOpenSettings={() => setActiveTab('settings')}
        onLogout={() => setIsAuthenticated(false)}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          certificatesCount={certificates.length}
        />

        {/* Main Content Area */}
        <main className="flex-1 bg-slate-100 text-slate-900 overflow-y-auto">
          {/* 0. PRIMARY TEMPLATE UPLOAD & ORDERED BULK GENERATOR WORKFLOW */}
          {activeTab === 'upload_flow' && (
            <TemplateUploadWorkflow
              currentProject={effectiveProject}
              branding={branding}
              onSaveTemplate={handleSaveTemplate}
              onSaveDataset={(ds) => {
                saveDataset(ds);
                setDataset(ds);
              }}
              onSaveCertificates={(certs) => {
                saveBulkCertificates(certs);
                setCertificates(certs);
              }}
              onNavigateTab={setActiveTab}
            />
          )}

          {/* 1. DASHBOARD */}
          {activeTab === 'dashboard' && (
            <Dashboard
              projects={projects}
              templates={templates}
              certificates={getCertificates()}
              onSelectProject={handleSelectProject}
              onNewProjectClick={() => setActiveTab('projects')}
              onNavigateTab={setActiveTab}
            />
          )}

          {/* 2. PROJECTS LIST */}
          {activeTab === 'projects' && (
            <ProjectList
              projects={projects}
              templates={templates}
              onSelectProject={handleSelectProject}
              onCreateProject={handleCreateProject}
              onDuplicateProject={(p) => {
                handleCreateProject({
                  name: `${p.name} (Copy)`,
                  eventName: p.eventName,
                  organization: p.organization,
                  certificateType: p.certificateType,
                  description: p.description,
                  ownerId: currentUser.id,
                });
              }}
              onDeleteProject={(id) => {
                deleteProject(id);
                refreshAllState();
              }}
            />
          )}

          {/* 3. TEMPLATE EDITOR & SIZE SELECTOR */}
          {activeTab === 'editor' && (
            <div className="flex flex-col h-full">
              {/* Paper Size selector bar */}
              {activeTemplate && (
                <div className="p-4 bg-white border-b border-slate-200">
                  <SizeSelector
                    currentSize={activeTemplate.size}
                    onSizeSelect={handleSelectSizeForTemplate}
                  />
                </div>
              )}

              {activeTemplate ? (
                <CertificateEditor
                  template={activeTemplate}
                  templatesForProject={projTemplates}
                  branding={branding}
                  onSaveTemplate={handleSaveTemplate}
                  onSwitchTemplate={(tplId) => {
                    const found = getTemplateById(tplId);
                    if (found) setActiveTemplate(found);
                  }}
                  onGenerateClick={() => {
                    if (!dataset) {
                      setShowImportModal(true);
                    } else {
                      setShowBulkGeneratorModal(true);
                    }
                  }}
                />
              ) : (
                <div className="p-12 text-center text-slate-500">
                  Please select or create a project first.
                </div>
              )}
            </div>
          )}

          {/* 4. IMPORT DATA & DATASET PREVIEW */}
          {activeTab === 'import' && (
            <div className="p-6 max-w-5xl mx-auto space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Participant Spreadsheet Data</h2>
                  <p className="text-xs text-slate-500">
                    Import .xlsx or .csv files to feed dynamic fields during certificate generation.
                  </p>
                </div>

                <button
                  onClick={() => setShowImportModal(true)}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  Upload New Spreadsheet
                </button>
              </div>

              {dataset && (
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Current Dataset: {dataset.fileName}</h3>
                      <p className="text-xs text-slate-500">{dataset.rowCount} Rows Imported</p>
                    </div>

                    <button
                      onClick={() => setShowBulkGeneratorModal(true)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm"
                    >
                      Generate Certificates Now
                    </button>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-96">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 font-bold border-b border-slate-200">
                        <tr>
                          {dataset.columns.map((col) => (
                            <th key={col} className="p-2.5 border-r border-slate-200">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {dataset.rows.map((row) => (
                          <tr key={row._rowId} className="hover:bg-slate-50">
                            {dataset.columns.map((col) => (
                              <td key={col} className="p-2 border-r border-slate-200 font-medium">
                                {row[col]}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 5. GENERATED CERTIFICATES */}
          {activeTab === 'certificates' && activeTemplate && (
            <CertificateList
              certificates={certificates}
              template={activeTemplate}
              branding={branding}
              onEditCertificate={(c) => setEditingCert(c)}
              onPreviewCertificate={(c) => setPreviewCert(c)}
              onDeleteCertificate={(id) => {
                deleteCertificate(id);
                refreshAllState();
              }}
              onStatusChange={(id, status) => {
                updateCertificateStatus(id, status);
                refreshAllState();
              }}
              onOpenBulkImport={() => setShowImportModal(true)}
            />
          )}

          {/* 6. PUBLIC VERIFICATION PORTAL */}
          {activeTab === 'verification' && (
            <VerificationPage
              branding={branding}
            />
          )}

          {/* 7. SETTINGS & BRANDING */}
          {activeTab === 'settings' && (
            <SettingsPage
              branding={branding}
              user={currentUser}
              onSaveBranding={(b) => {
                saveBrandingSettings(b);
                setBranding(b);
              }}
              onSaveUser={(u) => {
                saveCurrentUser(u);
                setCurrentUser(u);
              }}
            />
          )}
        </main>
      </div>

      {/* MODAL DIALOGS */}

      {/* 1. Import Data Modal */}
      {showImportModal && currentProject && activeTemplate && (
        <ImportDataModal
          projectId={currentProject.id}
          dynamicFields={activeTemplate.dynamicFields}
          existingDataset={dataset}
          onSaveDataset={handleSaveDataset}
          onClose={() => setShowImportModal(false)}
        />
      )}

      {/* 2. Bulk Generator Modal */}
      {showBulkGeneratorModal && activeTemplate && dataset && (
        <BulkGeneratorModal
          template={activeTemplate}
          dataset={dataset}
          mapping={activeMapping}
          branding={branding}
          existingCertificates={certificates}
          onComplete={handleCompleteBulkGeneration}
          onClose={() => setShowBulkGeneratorModal(false)}
        />
      )}

      {/* 3. Individual Certificate Editor Modal */}
      {editingCert && activeTemplate && (
        <IndividualCertificateEditorModal
          cert={editingCert}
          template={activeTemplate}
          branding={branding}
          onSaveCertificate={(updatedCert) => {
            saveCertificate(updatedCert);
            setEditingCert(null);
            refreshAllState();
          }}
          onClose={() => setEditingCert(null)}
        />
      )}

      {/* 4. High-Res Certificate Print Preview Modal */}
      {previewCert && activeTemplate && (
        <CertificatePreviewModal
          initialCert={previewCert}
          certificates={certificates}
          template={activeTemplate}
          branding={branding}
          onClose={() => setPreviewCert(null)}
          onPrintClick={(certToPrint) => {
            window.print();
          }}
        />
      )}
    </div>
  );
}
