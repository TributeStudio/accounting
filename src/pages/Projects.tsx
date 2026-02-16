import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, UserSquare, User, Pencil, Trash, List, SquaresFour } from '@phosphor-icons/react';
import type { Project } from '../types';

const Projects: React.FC = () => {
    const { projects, clients, logs, addProject, updateProject, deleteProject } = useApp();
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        client: '',
        startDate: new Date().toISOString().split('T')[0],
        status: 'ACTIVE' as 'ACTIVE' | 'ARCHIVED' | 'COMPLETED'
    });
    const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');

    const [isSaving, setIsSaving] = useState(false);

    const handleEdit = (project: Project) => {
        setEditingProject(project);
        setFormData({
            name: project.name,
            client: project.client,
            startDate: project.startDate || new Date(project.createdAt).toISOString().split('T')[0],
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
        setFormData({ name: '', client: '', startDate: new Date().toISOString().split('T')[0], status: 'ACTIVE' });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Validate Inputs
        if (!formData.startDate) {
            alert("Please enter a valid start date.");
            return;
        }

        setIsSaving(true);

        // 2. Fire and forget (Optimistic Update)
        const commonData = {
            name: formData.name,
            client: formData.client,
            hourlyRate: 0, // Default to 0 as rate is now set in Tracker
            startDate: formData.startDate,
            status: formData.status
        };

        const savePromise = editingProject
            ? updateProject(editingProject.id, commonData)
            : addProject({ ...commonData }); // addProject expects hourlyRate

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

    // --- SORTING & FILTERING ---
    const [sortBy, setSortBy] = useState<'CLIENT' | 'ACTIVITY' | 'NAME' | 'START_DATE'>('CLIENT');
    const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
    const [selectedClient, setSelectedClient] = useState<string>('ALL');

    const projectMetrics = useMemo(() => {
        const metrics: Record<string, { lastActive: string, totalBilled: number, monthBilled: number }> = {};

        projects.forEach(p => {
            const projectLogs = logs.filter(l => l.projectId === p.id);
            if (projectLogs.length === 0) {
                metrics[p.id] = { lastActive: '0000-00-00', totalBilled: 0, monthBilled: 0 };
                return;
            }

            // Sort logs by date desc to find last active
            projectLogs.sort((a, b) => b.date.localeCompare(a.date));
            const lastActive = projectLogs[0].date;

            // Calculate totals
            let total = 0;
            let monthTotal = 0;

            projectLogs.forEach(l => {
                // Calculate amount for this log
                let amount = 0;
                if (l.type === 'TIME') {
                    amount = (l.hours || 0) * (l.rate || p.hourlyRate) * (l.rateMultiplier || 1);
                } else {
                    amount = l.billableAmount || 0;
                }

                total += amount;

                if (l.date.startsWith(selectedMonth)) {
                    monthTotal += amount;
                }
            });

            metrics[p.id] = { lastActive, totalBilled: total, monthBilled: monthTotal };
        });

        return metrics;
    }, [projects, logs, selectedMonth]);

    const availableClients = useMemo(() => {
        return Array.from(new Set(projects.map(p => p.client))).sort();
    }, [projects]);

    const sortedProjects = useMemo(() => {
        let sorted = [...projects];

        // 1. Filter by Client
        if (selectedClient !== 'ALL') {
            sorted = sorted.filter(p => p.client === selectedClient);
        }

        // 2. Filter by Month Activity (If month selected, hide 0 billed UNLESS started in that month)
        if (selectedMonth !== 'ALL') {
            sorted = sorted.filter(p => {
                const hasActivity = (projectMetrics[p.id]?.monthBilled || 0) > 0;
                // Check if project started in this month
                const startedInMonth = p.startDate && p.startDate.startsWith(selectedMonth);
                return hasActivity || startedInMonth;
            });
        }

        // 3. Sort
        if (sortBy === 'CLIENT') {
            sorted.sort((a, b) => a.client.localeCompare(b.client));
        } else if (sortBy === 'NAME') {
            sorted.sort((a, b) => a.name.localeCompare(b.name));
        } else if (sortBy === 'START_DATE') {
            sorted.sort((a, b) => (b.startDate || '').localeCompare(a.startDate || ''));
        } else if (sortBy === 'ACTIVITY') {
            sorted.sort((a, b) => {
                const ma = projectMetrics[a.id]?.lastActive || '0000-00-00';
                const mb = projectMetrics[b.id]?.lastActive || '0000-00-00';
                return mb.localeCompare(ma);
            });
        }

        return sorted;
    }, [projects, sortBy, projectMetrics, selectedClient, selectedMonth]);

    const availableMonths = useMemo(() => {
        const months = new Set<string>();

        // 1. Add months from logs
        logs.forEach(l => {
            if (l.date) months.add(l.date.substring(0, 7));
        });

        // 2. Add last 24 months to ensure "any" month is selectable
        const d = new Date();
        // Reset to first day to avoid edge cases when rolling back months (e.g. rolling back from 31st)
        d.setDate(1);
        for (let i = 0; i < 24; i++) {
            // Use local YYYY-MM construction
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            months.add(`${y}-${m}`);
            d.setMonth(d.getMonth() - 1);
        }

        return Array.from(months).sort().reverse();
    }, [logs]);

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold text-slate-900 mb-2">Projects</h1>
                    <p className="text-slate-500">Manage your clients and active engagements.</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex gap-2">
                        <select
                            className="bg-white border-none rounded-xl px-4 py-3 text-sm text-slate-900 shadow-sm focus:ring-2 focus:ring-slate-900"
                            value={selectedClient}
                            onChange={(e) => setSelectedClient(e.target.value)}
                        >
                            <option value="ALL">All Clients</option>
                            {availableClients.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>

                        <select
                            className="bg-white border-none rounded-xl px-4 py-3 text-sm text-slate-900 shadow-sm focus:ring-2 focus:ring-slate-900"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                        >
                            <option value="CLIENT">Sort by Client</option>
                            <option value="START_DATE">Sort by Date</option>
                            <option value="ACTIVITY">Sort by Recent</option>
                            <option value="NAME">Sort by Name</option>
                        </select>

                        <select
                            className="bg-white border-none rounded-xl px-4 py-3 text-sm text-slate-900 shadow-sm focus:ring-2 focus:ring-slate-900"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                        >
                            <option value="ALL">All Time</option>
                            {availableMonths.map(m => {
                                const [y, mo] = m.split('-');
                                const date = new Date(parseInt(y), parseInt(mo) - 1, 1);
                                return <option key={m} value={m}>{date.toLocaleDateString('default', { month: 'long', year: 'numeric' })}</option>
                            })}
                        </select>
                        <div className="flex bg-white rounded-xl p-1 shadow-sm border border-slate-100">
                            <button
                                onClick={() => setViewMode('GRID')}
                                className={`p-2 rounded-lg transition-colors ${viewMode === 'GRID' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <SquaresFour size={20} weight={viewMode === 'GRID' ? "fill" : "regular"} />
                            </button>
                            <button
                                onClick={() => setViewMode('LIST')}
                                className={`p-2 rounded-lg transition-colors ${viewMode === 'LIST' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <List size={20} weight={viewMode === 'LIST' ? "bold" : "regular"} />
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-slate-800 transition-colors shadow-lg"
                    >
                        <Plus size={18} weight="bold" /> Project
                    </button>
                </div>
            </div>

            {viewMode === 'GRID' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedProjects.map((project) => {
                        const billed = selectedMonth === 'ALL'
                            ? projectMetrics[project.id]?.totalBilled
                            : projectMetrics[project.id]?.monthBilled;

                        return (
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

                                <div className="pt-6 border-t border-slate-50">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                            {selectedMonth === 'ALL' ? 'Total Billed' : 'Billed (Mo)'}
                                        </p>
                                        <p className="text-lg font-bold text-slate-900 tabular-nums">
                                            ${(billed || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                                <th className="px-6 py-4">Project Name</th>
                                <th className="px-6 py-4">Client</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Billed {selectedMonth === 'ALL' ? '(Total)' : '(Mo)'}</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {sortedProjects.map((project) => {
                                const billed = selectedMonth === 'ALL'
                                    ? projectMetrics[project.id]?.totalBilled
                                    : projectMetrics[project.id]?.monthBilled;

                                return (
                                    <tr key={project.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-900">{project.name}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                                <User size={14} weight="duotone" className="opacity-50" />
                                                {project.client}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest ${project.status === 'ACTIVE'
                                                    ? 'bg-emerald-50 text-emerald-600'
                                                    : project.status === 'COMPLETED'
                                                        ? 'bg-blue-50 text-blue-600'
                                                        : 'bg-slate-100 text-slate-500'
                                                }`}>
                                                {project.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right tabular-nums font-bold text-slate-900">
                                            ${(billed || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

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
                                        onChange={(e) => setFormData({ ...formData, client: e.target.value })}
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
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Start Date</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-slate-900"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
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
