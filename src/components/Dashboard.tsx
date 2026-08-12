import React from 'react';
import {
  FolderKanban,
  FileCode2,
  Award,
  Printer,
  Plus,
  FileSpreadsheet,
  Edit3,
  QrCode,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Project, CertificateTemplate, GeneratedCertificate } from '../types';
import {
  MASTER_TEMPLATE_1014_BACKGROUND_SVG,
  MASTER_TEMPLATE_1013_BACKGROUND_SVG,
} from '../constants/defaultTemplates';

interface DashboardProps {
  projects: Project[];
  templates: CertificateTemplate[];
  certificates: GeneratedCertificate[];
  onSelectProject: (p: Project) => void;
  onNewProjectClick: () => void;
  onNavigateTab: (tab: any) => void;
  onUseTemplateClick?: (project: Project) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  projects,
  templates,
  certificates,
  onSelectProject,
  onNewProjectClick,
  onNavigateTab,
  onUseTemplateClick,
}) => {
  const totalProjects = projects.length;
  const totalTemplates = templates.length;
  const totalGenerated = certificates.length;
  const totalPrinted = certificates.filter((c) => c.status === 'printed' || c.printedAt).length;

  const vandeProject = projects.find((p) => p.id === 'proj_vande_bharatam_2026') || projects[0];
  const nailathonProject = projects.find((p) => p.id === 'proj_nailathon_2026') || projects[1];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center space-x-2 bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-xs font-semibold border border-blue-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>BSROCKS × SeventhSense Certificate Suite</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">
            BSROCKS × SeventhSense Certificate Generator
          </h1>
          <p className="text-sm text-slate-300">
            Select a master template, upload your Excel recipient name list, and generate print-ready A4 certificates automatically.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => onNavigateTab('upload_flow')}
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold px-4 py-2.5 rounded-xl shadow-lg transition-all text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Certificate Template</span>
          </button>
        </div>
      </div>

      {/* Official Master Certificate Templates Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Certificate Templates</h2>
            <p className="text-xs text-slate-500">
              Select an official master certificate template to start importing recipient lists
            </p>
          </div>
          <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold rounded-full">
            Official Master Templates
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Template 1014: VANDE BHARATAM 2026 */}
          <div className="border border-slate-200 hover:border-blue-500 rounded-xl p-5 bg-slate-50/50 hover:bg-blue-50/30 transition-all flex flex-col justify-between group shadow-xs">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-md border border-blue-200">
                  Template 1014
                </span>
                <span className="text-[11px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                  A4 Portrait
                </span>
              </div>

              {/* Master Certificate Image Preview Box */}
              <div className="relative bg-slate-100 border border-slate-300 rounded-lg h-56 flex items-center justify-center shadow-inner overflow-hidden group/img">
                <img
                  src={MASTER_TEMPLATE_1014_BACKGROUND_SVG}
                  alt="Certificate No. 1014 — VANDE BHARATAM 2026 Master Template"
                  className="max-h-full max-w-full object-contain drop-shadow-md transition-transform duration-300 group-hover/img:scale-105"
                />
                <div className="absolute top-2 right-2 bg-slate-900/80 text-amber-300 backdrop-blur-xs font-mono text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
                  Read-Only Master
                </div>
                <div className="absolute bottom-2 inset-x-2 bg-slate-900/80 text-white backdrop-blur-xs text-[10px] font-medium py-1 px-2 rounded text-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                  Original Master File • Recipient Name Slot Ready
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                  VANDE BHARATAM 2026
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  World's Largest Indian National Flag Formation by Bharatanatyam Performers. Record ID: SSWR/IND/2026/1014.
                </p>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-200/80">
              <button
                onClick={() => {
                  if (vandeProject) {
                    onSelectProject(vandeProject);
                    onNavigateTab('import');
                  }
                }}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Use Template 1014</span>
              </button>
            </div>
          </div>

          {/* Template 1013: NAILATHON INDIA 2026 */}
          <div className="border border-slate-200 hover:border-blue-500 rounded-xl p-5 bg-slate-50/50 hover:bg-blue-50/30 transition-all flex flex-col justify-between group shadow-xs">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-md border border-blue-200">
                  Template 1013
                </span>
                <span className="text-[11px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                  A4 Portrait
                </span>
              </div>

              {/* Master Certificate Image Preview Box */}
              <div className="relative bg-slate-100 border border-slate-300 rounded-lg h-56 flex items-center justify-center shadow-inner overflow-hidden group/img">
                <img
                  src={MASTER_TEMPLATE_1013_BACKGROUND_SVG}
                  alt="Certificate No. 1013 — NAILATHON INDIA 2026 Master Template"
                  className="max-h-full max-w-full object-contain drop-shadow-md transition-transform duration-300 group-hover/img:scale-105"
                />
                <div className="absolute top-2 right-2 bg-slate-900/80 text-amber-300 backdrop-blur-xs font-mono text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
                  Read-Only Master
                </div>
                <div className="absolute bottom-2 inset-x-2 bg-slate-900/80 text-white backdrop-blur-xs text-[10px] font-medium py-1 px-2 rounded text-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                  Original Master File • Recipient Name Slot Ready
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                  NAILATHON INDIA 2026
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  India Flag-Themed Nail Extension & Nail Art Event World Record Challenge. Record ID: SSWR/IND/2026/1013.
                </p>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-200/80">
              <button
                onClick={() => {
                  if (nailathonProject) {
                    onSelectProject(nailathonProject);
                    onNavigateTab('import');
                  }
                }}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Use Template 1013</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Total Projects</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalProjects}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Active event projects</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <FolderKanban className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Total Templates</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalTemplates}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">A4 & A5 custom sizes</p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <FileCode2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Certificates Generated</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalGenerated.toLocaleString()}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Auto-generated certificates</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Award className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Certificates Printed</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalPrinted.toLocaleString()}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Physical print copies</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Printer className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Quick Launch & Workflow Step Guide */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
          <span>Certificate Workflow Checklist</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <button
            onClick={onNewProjectClick}
            className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-left hover:border-blue-400 hover:bg-blue-50/50 transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                1
              </span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-0.5" />
            </div>
            <h4 className="text-xs font-bold text-slate-800">Create Project & Size</h4>
            <p className="text-[11px] text-slate-500 mt-1">
              Select A4 Landscape, A5, or custom dimensions.
            </p>
          </button>

          <button
            onClick={() => onNavigateTab('editor')}
            className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-left hover:border-blue-400 hover:bg-blue-50/50 transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                2
              </span>
              <Edit3 className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
            </div>
            <h4 className="text-xs font-bold text-slate-800">Design Template</h4>
            <p className="text-[11px] text-slate-500 mt-1">
              Place logos, signatures & dynamic fields <code className="text-blue-600">{'{{NAME}}'}</code>.
            </p>
          </button>

          <button
            onClick={() => onNavigateTab('import')}
            className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-left hover:border-blue-400 hover:bg-blue-50/50 transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                3
              </span>
              <FileSpreadsheet className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
            </div>
            <h4 className="text-xs font-bold text-slate-800">Import Excel Name List</h4>
            <p className="text-[11px] text-slate-500 mt-1">
              Auto-detect columns and map row data.
            </p>
          </button>

          <button
            onClick={() => onNavigateTab('certificates')}
            className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-left hover:border-blue-400 hover:bg-blue-50/50 transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                4
              </span>
              <Award className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
            </div>
            <h4 className="text-xs font-bold text-slate-800">Auto Generate & Print</h4>
            <p className="text-[11px] text-slate-500 mt-1">
              Bulk export PDFs, download ZIP, or send to printer.
            </p>
          </button>
        </div>
      </div>

      {/* Recent Projects Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Event Projects</h3>
            <p className="text-xs text-slate-500">Manage event certificate generation pipelines</p>
          </div>
          <button
            onClick={() => onNavigateTab('projects')}
            className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
          >
            View All Projects →
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {projects.map((proj) => {
            const projCerts = certificates.filter((c) => c.projectId === proj.id);
            const statusLabel = projCerts.length > 0 ? 'Completed' : 'Draft / Ready to Import';
            const isCompleted = projCerts.length > 0;

            return (
              <div
                key={proj.id}
                className="p-4 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-slate-800">{proj.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      {proj.certificateType}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {proj.organization} • Event: <span className="font-medium text-slate-700">{proj.eventName}</span>
                  </p>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-900">{projCerts.length} Certificates</p>
                    <div className="flex items-center space-x-1 justify-end text-[11px]">
                      {isCompleted ? (
                        <span className="text-emerald-600 font-medium flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Generated</span>
                        </span>
                      ) : (
                        <span className="text-amber-600 font-medium flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>Draft</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectProject(proj)}
                    className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-medium transition-colors"
                  >
                    Open Project
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
