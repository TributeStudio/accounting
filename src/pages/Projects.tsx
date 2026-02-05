import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Briefcase, User } from '@phosphor-icons/react';

const Projects: React.FC = () => {
    const { projects, addProject } = useApp();
    const [showAddModal, setShowAddModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        client: '',
        hourlyRate: '150',
        status: 'ACTIVE' as const
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await addProject({
            name: formData.name,
            client: formData.client,
            hourlyRate: Number(formData.hourlyRate),
            status: formData.status
        });
        setFormData({ name: '', client: '', hourlyRate: '150', status: 'ACTIVE' });
        setShowAddModal(false);
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold text-slate-900 mb-2">Projects Portfolio</h1>
                    <p className="text-slate-500">Manage your clients and active engagements.</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-slate-800 transition-colors shadow-lg"
                >
                    <Plus size={18} weight="bold" /> New Project
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                    <div key={project.id} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 group hover:shadow-xl transition-all duration-300">
                        <div className="flex justify-between items-start mb-6">
                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                                <Briefcase size={24} weight="duotone" />
                            </div>
                            <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest ${project.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                                }`}>
                                {project.status}
                            </span>
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
                            <h2 className="font-bold text-2xl">New Project</h2>
                            <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
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
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Acme Corp"
                                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-slate-900"
                                    value={formData.client}
                                    onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                                />
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
                            <button
                                type="submit"
                                className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all"
                            >
                                Create Project
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Projects;
