import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, UserSquare, User, Pencil, Trash } from '@phosphor-icons/react';
import type { Project } from '../types';

const Projects: React.FC = () => {
    const { projects, clients, addProject, updateProject, deleteProject } = useApp();
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        client: '',
        hourlyRate: '150',
        status: 'ACTIVE' as 'ACTIVE' | 'ARCHIVED' | 'COMPLETED'
    });

    const [isSaving, setIsSaving] = useState(false);

    const handleEdit = (project: Project) => {
        setEditingProject(project);
        setFormData({
            name: project.name,
            client: project.client,
            hourlyRate: project.hourlyRate.toString(),
            status: project.status
        });
        setShowAddModal(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
            await deleteProject(id);
        }
    };

    const handleCloseModal = () => {
        setShowAddModal(false);
        setEditingProject(null);
        setFormData({ name: '', client: '', hourlyRate: '150', status: 'ACTIVE' });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Validate Inputs
        const rate = Number(formData.hourlyRate);
        if (isNaN(rate)) {
            alert("Please enter a valid hourly rate.");
            return;
        }

        setIsSaving(true);

        // 2. Fire and forget (Optimistic Update)
        // We do NOT await this. Firestore handles local updates immediately.
        const savePromise = editingProject
            ? updateProject(editingProject.id, {
                name: formData.name,
                client: formData.client,
                hourlyRate: rate,
                status: formData.status
            })
            : addProject({
                name: formData.name,
                client: formData.client,
                hourlyRate: rate,
                status: formData.status
            });

        // 3. Background Error Handling
        savePromise.catch((error) => {
            console.error('Background save error:', error);
            // Since the modal is likely closed, we alert the user
            alert(`Warning: The project could not be synced to the cloud: ${error.message}`);
        });

        // 4. Close immediately
        setIsSaving(false);
        handleCloseModal();
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold text-slate-900 mb-2">Projects</h1>
                    <p className="text-slate-500">Manage your clients and active engagements.</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-slate-800 transition-colors shadow-lg"
                >
                    <Plus size={18} weight="bold" /> Project
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                    <div key={project.id} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 group hover:shadow-xl transition-all duration-300 relative">
                        <div className="flex justify-between items-start mb-6">
                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                                <UserSquare size={24} weight="duotone" />
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleEdit(project)}
                                    className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
                                    title="Edit Project"
                                >
                                    <Pencil size={18} weight="bold" />
                                </button>
                                <button
                                    onClick={() => handleDelete(project.id)}
                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                    title="Delete Project"
                                >
                                    <Trash size={18} weight="bold" />
                                </button>
                                <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest ${project.status === 'ACTIVE'
                                    ? 'bg-emerald-50 text-emerald-600'
                                    : project.status === 'COMPLETED'
                                        ? 'bg-blue-50 text-blue-600'
                                        : 'bg-slate-100 text-slate-500'
                                    }`}>
                                    {project.status}
                                </span>
                            </div>
                        </div>

                        <h3 className="text-xl font-bold text-slate-900 mb-1">{project.name}</h3>
                        <p className="text-sm text-slate-500 mb-6 flex items-center gap-1">
                            <User size={14} weight="duotone" className="opacity-50" /> {project.client}
                        </p>

                        <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-50">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Rate</p>
                                <p className="text-lg font-bold text-slate-900 tabular-nums">${project.hourlyRate}<span className="text-sm font-normal text-slate-400">/hr</span></p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Created</p>
                                <p className="text-sm font-medium text-slate-600">{new Date(project.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="font-bold text-2xl">{editingProject ? 'Edit Project' : 'Project'}</h2>
                            <button onClick={handleCloseModal} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                <Plus size={24} weight="bold" className="rotate-45" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Project Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Brand Identity 2024"
                                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-slate-900"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Client Name</label>
                                <div className="relative">
                                    <select
                                        required
                                        className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-slate-900 appearance-none"
                                        value={formData.client}
                                        onChange={(e) => {
                                            const selectedClient = clients.find(c => c.name === e.target.value);
                                            setFormData({
                                                ...formData,
                                                client: e.target.value,
                                                hourlyRate: selectedClient ? selectedClient.defaultRate.toString() : formData.hourlyRate
                                            });
                                        }}
                                    >
                                        <option value="">Select a Client</option>
                                        {clients
                                            .filter(c => c.status === 'ACTIVE' || c.name === formData.client)
                                            .map(client => (
                                                <option key={client.id} value={client.name}>
                                                    {client.name}
                                                </option>
                                            ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                                        <User size={16} weight="bold" />
                                    </div>
                                </div>
                                {clients.length === 0 && (
                                    <p className="text-xs text-rose-500 mt-1">
                                        No active clients found. Please add a client in the <a href="/clients" className="underline font-bold">Clients</a> page first.
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hourly Rate ($)</label>
                                <input
                                    type="number"
                                    required
                                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-slate-900"
                                    value={formData.hourlyRate}
                                    onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status</label>
                                <select
                                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-slate-900"
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'ARCHIVED' | 'COMPLETED' })}
                                >
                                    <option value="ACTIVE">ACTIVE</option>
                                    <option value="COMPLETED">COMPLETED</option>
                                    <option value="ARCHIVED">ARCHIVED</option>
                                </select>
                            </div>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all disabled:opacity-50"
                            >
                                {isSaving ? (
                                    <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                ) : (
                                    editingProject ? 'Update Project' : 'Create Project'
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Projects;
