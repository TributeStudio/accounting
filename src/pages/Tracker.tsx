import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Clock, Tag, Plus, Check, PencilSimple, Trash, X, FloppyDisk, Faders } from '@phosphor-icons/react';
import type { LogItem, LogType } from '../types';

const Tracker: React.FC = () => {
    const { projects, logs, addLog, updateLog, deleteLog } = useApp();
    const [activeTab, setActiveTab] = useState<LogType>('TIME');
    const [success, setSuccess] = useState(false);
    const [editingLogId, setEditingLogId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        projectId: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        hours: '',
        rateMultiplier: '1.0',
        rate: '',
        cost: '',
        amount: '', // For Fixed Fee
        markupPercent: '20',

        // Media Specific
        googleSpend: '',
        metaSpend: '',
        billingMonth: new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
    });

    // Helper to get client settings for the selected project
    // const selectedProject = projects.find(p => p.id === formData.projectId);
    // const selectedClient = selectedProject ? clients.find(c => c.name === selectedProject.client) : null;

    // We need selectedProject still? No, actually we don't use it in this version either except for the logic I just commented out?
    // Wait, let's check. 
    // Ah, lines 402 use project name in the history display.
    // But inside the component body, 'selectedProject' variable defined on line 29 is only used for selectedClient.
    // 'projects' is used in the form select.
    // 'projects' is also used in history map.

    // So line 29 and 30 are unused.


    // Calculate Running Annual Spend
    const currentYear = new Date().getFullYear();
    const existingMediaLogs = logs.filter(l => {
        const isSameProject = l.projectId === formData.projectId;
        const isMedia = l.type === 'MEDIA_SPEND';
        const isSameYear = new Date(l.date).getFullYear() === currentYear;
        const isNotCurrentEditing = l.id !== editingLogId;
        return isSameProject && isMedia && isSameYear && isNotCurrentEditing;
    });

    const previousAnnualSpend = existingMediaLogs.reduce((sum, log) => {
        const google = log.mediaDetails?.googleSpend || 0;
        const meta = log.mediaDetails?.metaSpend || 0;
        const total = google + meta || log.cost || 0;
        return sum + total;
    }, 0);

    const currentGoogleSpend = Number(formData.googleSpend) || 0;
    const currentMetaSpend = Number(formData.metaSpend) || 0;
    const currentTotalSpend = currentGoogleSpend + currentMetaSpend;

    const runningAnnualTotal = previousAnnualSpend + currentTotalSpend;

    // Calculate Financials
    let billableAmount = 0;
    let profit = 0;
    let mediaFees = {
        mediaManagement: 0,
        creativeOps: 0,
        roiEngine: 0
    };

    if (activeTab === 'EXPENSE') {
        const cost = Number(formData.cost);
        const markup = Number(formData.markupPercent);
        billableAmount = cost * (1 + markup / 100);
        profit = billableAmount - cost;
    } else if (activeTab === 'FIXED_FEE') {
        billableAmount = Number(formData.amount);
        profit = billableAmount;
    } else if (activeTab === 'MEDIA_SPEND') {
        const mmRate = 0.125;
        const coRate = 0.040;
        const reRate = 0.030;

        mediaFees.mediaManagement = currentTotalSpend * mmRate;
        mediaFees.creativeOps = currentTotalSpend * coRate;
        mediaFees.roiEngine = currentTotalSpend * reRate;

        billableAmount = mediaFees.mediaManagement + mediaFees.creativeOps + mediaFees.roiEngine;
        profit = billableAmount;
    }

    const STANDARD_RATES = [
        { label: 'DaVinci Resolve Edit Bay', rate: 150 },
        { label: 'Color Grading Suite', rate: 175 },
        { label: 'Audio Mix / VO Booth', rate: 125 },
        { label: 'Senior Editor', rate: 250 },
        { label: 'Motion Graphics Designer', rate: 225 },
        { label: 'Creative Direction', rate: 300 },
        { label: 'Art Direction', rate: 225 },
        { label: 'Copywriting', rate: 200 },
        { label: 'Design', rate: 175 },
        { label: 'Code Writing / Development', rate: 225 },
    ];

    const [savedRates, setSavedRates] = useState<{ label: string, rate: number }[]>(() => {
        const saved = localStorage.getItem('custom_rates');
        return saved ? JSON.parse(saved) : [];
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.projectId || !formData.description) return;

        // Save custom rate if new
        if (activeTab === 'TIME' && formData.rate) {
            const currentRate = parseFloat(formData.rate);
            const isStandard = STANDARD_RATES.some(r => r.rate === currentRate);
            const isSaved = savedRates.some(r => r.rate === currentRate);

            if (!isStandard && !isSaved) {
                const newRate = { label: 'Custom Rate', rate: currentRate };
                const newSavedRates = [...savedRates, newRate];
                setSavedRates(newSavedRates);
                localStorage.setItem('custom_rates', JSON.stringify(newSavedRates));
            }
        }

        // Optimistic UI - Update immediately without waiting for server
        const logData: any = {
            projectId: formData.projectId,
            date: formData.date,
            description: formData.description,
            type: activeTab,
        };

        if (activeTab === 'TIME') {
            logData.hours = Number(formData.hours);
            logData.rateMultiplier = Number(formData.rateMultiplier || 1);
            if (formData.rate) logData.rate = Number(formData.rate);
        } else if (activeTab === 'EXPENSE') {
            logData.cost = Number(formData.cost);
            logData.markupPercent = Number(formData.markupPercent);
            logData.billableAmount = billableAmount;
            logData.profit = profit;
        } else if (activeTab === 'FIXED_FEE') {
            logData.amount = Number(formData.amount);
            logData.billableAmount = billableAmount;
            logData.profit = profit;
        } else if (activeTab === 'MEDIA_SPEND') {
            logData.cost = currentTotalSpend;
            logData.billableAmount = billableAmount;
            logData.profit = profit;
            logData.mediaDetails = {
                googleSpend: currentGoogleSpend,
                metaSpend: currentMetaSpend,
                billingMonth: formData.billingMonth,
                annualSpendRunningTotal: runningAnnualTotal,
                fees: mediaFees
            };
        }

        const savePromise = editingLogId
            ? updateLog(editingLogId, logData)
            : addLog(logData);

        // Handle background errors
        savePromise.catch((error) => {
            console.error("Failed to save log:", error);
            alert("Error saving log to cloud. Changes may not persist.");
        });

        // Update UI Immediately
        if (editingLogId) setEditingLogId(null);
        setSuccess(true);
        resetForm();
        setTimeout(() => setSuccess(false), 3000);
    };

    const resetForm = () => {
        setFormData({
            projectId: '',
            date: new Date().toISOString().split('T')[0],
            description: '',
            hours: '',
            rateMultiplier: '1.0',
            rate: '',
            cost: '',
            amount: '',
            markupPercent: '20',
            googleSpend: '',
            metaSpend: '',
            billingMonth: new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
        });
    };

    const handleEdit = (log: LogItem) => {
        setEditingLogId(log.id);
        setActiveTab(log.type);
        setFormData({
            projectId: log.projectId,
            date: log.date,
            description: log.description,
            hours: log.hours?.toString() || '',
            rateMultiplier: log.rateMultiplier?.toString() || '1.0',
            rate: log.rate?.toString() || '',
            cost: log.cost?.toString() || '',
            amount: (log.type === 'FIXED_FEE' ? log.billableAmount : log.cost)?.toString() || '',
            markupPercent: log.markupPercent?.toString() || '20',
            googleSpend: log.mediaDetails?.googleSpend?.toString() || '',
            metaSpend: log.mediaDetails?.metaSpend?.toString() || '',
            billingMonth: log.mediaDetails?.billingMonth || new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this entry?')) {
            await deleteLog(id);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-12">
            <div className="flex flex-col items-center">
                <h1 className="text-4xl font-bold text-slate-900 mb-2 text-center">Work Tracker</h1>
                <p className="text-slate-500 text-center">Capture every billable second and expense.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
                {/* Form Section */}
                <div className="lg:col-span-3 bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden sticky top-8">
                    {/* Tabs */}
                    {!editingLogId && (
                        <div className="flex flex-wrap border-b border-slate-100">
                            {(['TIME', 'EXPENSE', 'FIXED_FEE', 'MEDIA_SPEND'] as LogType[]).map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setActiveTab(type)}
                                    className={`flex-1 py-3 font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all min-w-[25%]
                                    ${activeTab === type ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'}`}
                                >
                                    {type === 'TIME' && <Clock size={16} weight="duotone" />}
                                    {type === 'EXPENSE' && <Tag size={16} weight="duotone" />}
                                    {type === 'FIXED_FEE' && <Check size={16} weight="duotone" />}
                                    {type === 'MEDIA_SPEND' && <Faders size={16} weight="duotone" />}
                                    {type.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                    )}

                    {editingLogId && (
                        <div className="bg-amber-50 border-b border-amber-100 p-4 transition-all flex items-center justify-between">
                            <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
                                <PencilSimple size={18} weight="bold" />
                                Editing {activeTab.replace('_', ' ')}
                            </div>
                            <button onClick={resetForm} className="text-amber-800 hover:bg-amber-100 p-1 rounded-full transition-colors">
                                <X size={20} weight="bold" />
                            </button>
                        </div>
                    )}

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
                                placeholder={activeTab === 'TIME' ? "What did you work on?" : "Description of item/fee"}
                                required
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-slate-900"
                            />
                        </div>

                        {activeTab === 'TIME' && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hourly Rate</label>
                                    <div className="flex gap-2">
                                        <select
                                            className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-slate-900"
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (val === 'custom') {
                                                    // Keep current rate or clear? Let's clear to allow typing
                                                    setFormData({ ...formData, rate: '' });
                                                } else {
                                                    setFormData({ ...formData, rate: val });
                                                }
                                            }}
                                            value={
                                                !formData.rate ? '' :
                                                    [...STANDARD_RATES, ...savedRates].some(r => r.rate.toString() === formData.rate)
                                                        ? formData.rate
                                                        : 'custom'
                                            }
                                        >
                                            <option value="">Default Project Rate</option>
                                            <optgroup label="Standard Rates">
                                                {STANDARD_RATES.map((r, i) => (
                                                    <option key={`std-${i}`} value={r.rate}>{r.label} (${r.rate}/hr)</option>
                                                ))}
                                            </optgroup>
                                            {savedRates.length > 0 && (
                                                <optgroup label="My Custom Rates">
                                                    {savedRates.map((r, i) => (
                                                        <option key={`saved-${i}`} value={r.rate}>{r.label} (${r.rate}/hr)</option>
                                                    ))}
                                                </optgroup>
                                            )}
                                            <option value="custom">Custom Rate...</option>
                                        </select>
                                        <input
                                            type="number"
                                            placeholder="Rate"
                                            className="w-24 bg-slate-50 border-none rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-slate-900"
                                            value={formData.rate}
                                            onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hours (0.5 increments)</label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        min="0"
                                        placeholder="0.00"
                                        required
                                        value={formData.hours}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            // Allow typing but validate on blur could be better, but native step handles basic validation
                                            setFormData({ ...formData, hours: val });
                                        }}
                                        onBlur={(e) => {
                                            const val = parseFloat(e.target.value);
                                            if (!isNaN(val)) {
                                                // Round to nearest 0.5
                                                const rounded = Math.round(val * 2) / 2;
                                                setFormData({ ...formData, hours: rounded.toString() });
                                            }
                                        }}
                                        className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-slate-900"
                                    />
                                </div>
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.rateMultiplier === '1.5'}
                                            onChange={(e) => setFormData({ ...formData, rateMultiplier: e.target.checked ? '1.5' : '1.0' })}
                                            className="w-5 h-5 text-slate-900 rounded focus:ring-slate-900 border-gray-300"
                                        />
                                        <div>
                                            <span className="block text-sm font-bold text-slate-900">Premium Rate (1.5x)</span>
                                            <span className="block text-xs text-slate-500">Apply for After-Hours, Weekend, or Rush requests.</span>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        )}

                        {activeTab === 'EXPENSE' && (
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

                        {(activeTab === 'FIXED_FEE' || activeTab === 'MEDIA_SPEND') && (
                            <div className="space-y-6">
                                {activeTab === 'MEDIA_SPEND' && (
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Billing Month</label>
                                        <select
                                            className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-slate-900"
                                            value={formData.billingMonth}
                                            onChange={(e) => setFormData({ ...formData, billingMonth: e.target.value })}
                                        >
                                            {Array.from({ length: 24 }).map((_, i) => {
                                                const d = new Date();
                                                d.setMonth(d.getMonth() - i);
                                                const monthStr = d.toLocaleString('default', { month: 'long', year: 'numeric' });
                                                return <option key={monthStr} value={monthStr}>{monthStr}</option>;
                                            })}
                                        </select>
                                    </div>
                                )}

                                {activeTab === 'FIXED_FEE' && (
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                            Fee Amount ($)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            required
                                            value={formData.amount}
                                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                            className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-slate-900"
                                        />
                                    </div>
                                )}

                                {activeTab === 'MEDIA_SPEND' && (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Google Spend ($)</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="0.00"
                                                    value={formData.googleSpend}
                                                    onChange={(e) => setFormData({ ...formData, googleSpend: e.target.value })}
                                                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-slate-900"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Meta Spend ($)</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="0.00"
                                                    value={formData.metaSpend}
                                                    onChange={(e) => setFormData({ ...formData, metaSpend: e.target.value })}
                                                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-slate-900"
                                                />
                                            </div>
                                        </div>

                                        <div className="p-4 bg-indigo-50/50 rounded-2xl space-y-3">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-indigo-900 font-medium">Annual Run Rate</span>
                                                <span className="font-bold text-indigo-900">${runningAnnualTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </div>
                                            <div className="h-px bg-indigo-100 w-full" />
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-xs text-slate-500">
                                                    <span>Media Mgmt (12.5%)</span>
                                                    <span>${mediaFees.mediaManagement.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between text-xs text-slate-500">
                                                    <span>Creative Ops (4.0%)</span>
                                                    <span>${mediaFees.creativeOps.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between text-xs text-slate-500">
                                                    <span>ROI Engine (3.0%)</span>
                                                    <span>${mediaFees.roiEngine.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between text-xs text-slate-900 font-bold pt-1 border-t border-slate-200 mt-1">
                                                    <span>Total Fees</span>
                                                    <span>${billableAmount.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {activeTab !== 'TIME' && (
                            <div className="bg-slate-900 p-6 rounded-2xl flex justify-between items-center text-white">
                                <div>
                                    <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Client Billable</p>
                                    <p className="text-3xl font-bold">${billableAmount.toFixed(2)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">
                                        {activeTab === 'MEDIA_SPEND' ? 'Total Fees' : 'Profit/Fee'}
                                    </p>
                                    <p className="text-xl font-bold text-emerald-400">+ ${profit.toFixed(2)}</p>
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all
                            ${success ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                        >
                            {success ? (
                                <><Check size={20} weight="bold" /> {editingLogId ? 'Update Saved' : 'Entry Saved'}</>
                            ) : (
                                <>{editingLogId ? <><FloppyDisk size={20} weight="bold" /> Update Entry</> : <><Plus size={20} weight="bold" /> Log Activity</>}</>
                            )}
                        </button>
                    </form>
                </div>

                {/* History Section */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-2">Recent Logs</h2>
                    <div className="space-y-4">
                        {Object.entries(logs.slice(0, 20).reduce((groups, log) => {
                            const pid = log.projectId;
                            if (!groups[pid]) groups[pid] = [];
                            groups[pid].push(log);
                            return groups;
                        }, {} as Record<string, typeof logs>)).map(([projectId, projectLogs]) => {
                            const project = projects.find(p => p.id === projectId);
                            return (
                                <div key={projectId} className="space-y-3">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-2 border-b border-slate-100 pb-2">
                                        {project?.name || 'Unknown Project'}
                                    </h3>
                                    {projectLogs.map(log => (
                                        <div key={log.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 group">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className={`p-2 rounded-lg 
                                                    ${log.type === 'TIME' ? 'bg-sky-50 text-sky-600' :
                                                        log.type === 'EXPENSE' ? 'bg-rose-50 text-rose-600' :
                                                            log.type === 'FIXED_FEE' ? 'bg-emerald-50 text-emerald-600' :
                                                                'bg-purple-50 text-purple-600'}`}>
                                                    {log.type === 'TIME' && <Clock size={16} weight="fill" />}
                                                    {log.type === 'EXPENSE' && <Tag size={16} weight="fill" />}
                                                    {log.type === 'FIXED_FEE' && <Check size={16} weight="fill" />}
                                                    {log.type === 'MEDIA_SPEND' && <Faders size={16} weight="fill" />}
                                                </div>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleEdit(log)}
                                                        className="p-2 hover:bg-slate-50 text-slate-400 hover:text-slate-900 rounded-lg transition-colors"
                                                    >
                                                        <PencilSimple size={16} weight="bold" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(log.id)}
                                                        className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                                                    >
                                                        <Trash size={16} weight="bold" />
                                                    </button>
                                                </div>
                                            </div>
                                            <h3 className="text-sm font-bold text-slate-900 mb-1 leading-tight">{log.description}</h3>
                                            <div className="flex justify-between items-center pt-3 border-t border-slate-50 mt-3">
                                                <span className="text-[10px] text-slate-400 font-medium">{log.date}</span>
                                                <span className="text-sm font-bold text-slate-900">
                                                    {log.type === 'TIME' ? `${log.hours}h` : `$${log.billableAmount?.toFixed(2)}`}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                        {logs.length === 0 && (
                            <div className="bg-slate-100/50 border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center">
                                <p className="text-slate-400 text-sm font-medium">No recent logs</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Tracker;
