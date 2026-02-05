import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Clock, Tag, Plus, Check } from 'lucide-react';

const Tracker: React.FC = () => {
    const { projects, addLog } = useApp();
    const [activeTab, setActiveTab] = useState<'TIME' | 'EXPENSE'>('TIME');
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        projectId: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        hours: '',
        cost: '',
        markupPercent: '20',
    });

    const billableAmount = activeTab === 'EXPENSE'
        ? (Number(formData.cost) * (1 + Number(formData.markupPercent) / 100))
        : 0;

    const profit = activeTab === 'EXPENSE'
        ? (billableAmount - Number(formData.cost))
        : 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.projectId || !formData.description) return;

        setIsLoading(true);
        try {
            const logData: any = {
                projectId: formData.projectId,
                date: formData.date,
                description: formData.description,
                type: activeTab,
            };

            if (activeTab === 'TIME') {
                logData.hours = Number(formData.hours);
            } else {
                logData.cost = Number(formData.cost);
                logData.markupPercent = Number(formData.markupPercent);
                logData.billableAmount = billableAmount;
                logData.profit = profit;
            }

            await addLog(logData);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
            setFormData({
                ...formData,
                description: '',
                hours: '',
                cost: '',
            });
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div className="flex flex-col items-center">
                <h1 className="text-4xl font-serif font-bold text-slate-900 mb-2 text-center">Work Tracker</h1>
                <p className="text-slate-500 text-center">Capture every billable second and expense.</p>
            </div>

            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                {/* Tabs */}
                <div className="flex border-b border-slate-100">
                    <button
                        onClick={() => setActiveTab('TIME')}
                        className={`flex-1 py-4 font-medium text-sm flex items-center justify-center gap-2 transition-all
              ${activeTab === 'TIME' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        <Clock size={16} /> Billable Hours
                    </button>
                    <button
                        onClick={() => setActiveTab('EXPENSE')}
                        className={`flex-1 py-4 font-medium text-sm flex items-center justify-center gap-2 transition-all
              ${activeTab === 'EXPENSE' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        <Tag size={16} /> Project Expense
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Project</label>
                            <select
                                required
                                value={formData.projectId}
                                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-slate-900"
                            >
                                <option value="">Select a project...</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Date</label>
                            <input
                                type="date"
                                required
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-slate-900"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Description</label>
                        <input
                            type="text"
                            placeholder="What did you work on?"
                            required
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-slate-900"
                        />
                    </div>

                    {activeTab === 'TIME' ? (
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hours</label>
                            <input
                                type="number"
                                step="0.25"
                                placeholder="0.00"
                                required
                                value={formData.hours}
                                onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-slate-900"
                            />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cost ($)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    required
                                    value={formData.cost}
                                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-slate-900"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Markup (%)</label>
                                <input
                                    type="number"
                                    placeholder="20"
                                    required
                                    value={formData.markupPercent}
                                    onChange={(e) => setFormData({ ...formData, markupPercent: e.target.value })}
                                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-slate-900"
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'EXPENSE' && Number(formData.cost) > 0 && (
                        <div className="bg-slate-900 p-6 rounded-2xl flex justify-between items-center text-white">
                            <div>
                                <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Client Billable</p>
                                <p className="text-3xl font-serif font-bold">${billableAmount.toFixed(2)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Profit Margin</p>
                                <p className="text-xl font-bold text-emerald-400">+ ${profit.toFixed(2)}</p>
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all
              ${success ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : success ? (
                            <><Check size={20} /> Entry Saved</>
                        ) : (
                            <><Plus size={20} /> Log Activity</>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Tracker;
