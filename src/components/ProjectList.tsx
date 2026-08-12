import React, { useState } from 'react';
import {
  FolderKanban,
  Plus,
  Search,
  MoreVertical,
  Edit3,
  Copy,
  Trash2,
  Award,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { Project, CertificateTemplate } from '../types';

interface ProjectListProps {
  projects: Project[];
  templates: CertificateTemplate[];
  onSelectProject: (p: Project) => void;
  onCreateProject: (p: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'templateIds'>) => void;
  onDuplicateProject: (p: Project) => void;
  onDeleteProject: (id: string) => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  templates,
  onSelectProject,
  onCreateProject,
  onDuplicateProject,
  onDeleteProject,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Modal form state
  const [name, setName] = useState('');
  const [eventName, setEventName] = useState('');
  const [organization, setOrganization] = useState('BSROCKS × SeventhSense');
  const [certificateType, setCertificateType] = useState('Participation Certificate');
  const [description, setDescription] = useState('');

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !eventName.trim()) return;

    onCreateProject({
      name: name.trim(),
      eventName: eventName.trim(),
      organization: organization.trim() || 'BSROCKS × SeventhSense',
      certificateType,
      description: description.trim(),
      ownerId: 'usr_admin',
    });

    setName('');
    setEventName('');
    setDescription('');
    setShowCreateModal(false);
  };

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.certificateType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <FolderKanban className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">Certificate Event Projects</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Organize certificate templates, datasets, and generated certificates by event.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center space-x-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Certificate Project</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
        <input
          type="text"
          placeholder="Search projects..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Grid of Projects */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProjects.map((proj) => {
          const projTemplates = templates.filter((t) => t.projectId === proj.id);

          return (
            <div
              key={proj.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-blue-300 transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200">
                    {proj.certificateType}
                  </span>

                  <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100">
                    <button
                      onClick={() => onDuplicateProject(proj)}
                      className="p-1 text-slate-400 hover:text-blue-600 rounded"
                      title="Duplicate Project"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onDeleteProject(proj.id)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded"
                      title="Delete Project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-base">{proj.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Event: <span className="font-medium text-slate-700">{proj.eventName}</span>
                  </p>
                </div>

                {proj.description && (
                  <p className="text-xs text-slate-500 line-clamp-2">{proj.description}</p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-medium">
                  {projTemplates.length} Template Variants
                </span>

                <button
                  onClick={() => onSelectProject(proj)}
                  className="px-3.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors"
                >
                  Open Project
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE PROJECT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateSubmit}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4"
          >
            <h3 className="text-base font-bold text-slate-900">Create New Certificate Project</h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Project Name</label>
              <input
                type="text"
                placeholder="e.g. BSROCKS Tech Fest 2026"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Event Name</label>
              <input
                type="text"
                placeholder="e.g. Tech Fest 2026"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Organization</label>
              <input
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Certificate Type
              </label>
              <select
                value={certificateType}
                onChange={(e) => setCertificateType(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="Participation Certificate">Participation Certificate</option>
                <option value="Winner Certificate">Winner Certificate</option>
                <option value="Achievement Certificate">Achievement Certificate</option>
                <option value="Workshop Certificate">Workshop Certificate</option>
                <option value="Training Certificate">Training Certificate</option>
                <option value="Appreciation Certificate">Appreciation Certificate</option>
                <option value="Volunteer Certificate">Volunteer Certificate</option>
                <option value="Internship Certificate">Internship Certificate</option>
                <option value="Custom Certificate">Custom Certificate</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
              <textarea
                rows={2}
                placeholder="Brief notes about the event..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md"
              >
                Create Project
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
