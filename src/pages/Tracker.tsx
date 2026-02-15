import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Clock, Tag, Plus, Check, PencilSimple, Trash, X, FloppyDisk, Faders, Briefcase, CurrencyDollar } from '@phosphor-icons/react';
import type { LogItem, LogType } from '../types';

const Tracker: React.FC = () => {

    const LICENSE_FEES = [
        { label: 'STOCK LICENSE: Adobe Stock Video (HD)', cost: 30.00 },
        { label: 'STOCK LICENSE: Adobe Stock Image', cost: 10.00 },
        { label: 'STOCK LICENSE: Yellow Image Mockup', cost: 29.99 },
        { label: 'STOCK LICENSE: Envato Elements Mockup', cost: 14.99 },
        { label: 'STOCK LICENSE: Artgrid Music License', cost: 14.99 },
        { label: 'STOCK LICENSE: Premium Beats Music License', cost: 19.99 },
        { label: 'STOCK LICENSE: AI Image Generation', cost: 5.00 },
        { label: 'STOCK LICENSE: AI Video Generation', cost: 10.00 },
    ];
    const { projects, logs, addLog, updateLog, deleteLog } = useApp();
    const [activeTab, setActiveTab] = useState<LogType>('TIME');
    const [success, setSuccess] = useState(false);
    const [editingLogId, setEditingLogId] = useState<string | null>(null);

    const [selectedClient, setSelectedClient] = useState<string>('');
    const [logFilterClient, setLogFilterClient] = useState<string>('ALL');
    const [logFilterMonth, setLogFilterMonth] = useState<string>('ALL');
    const [formData, setFormData] = useState({
        projectId: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        hours: '',
        rateMultiplier: '1.0',
        rate: '',
        rateOption: '',
        cost: '',
        amount: '', // For Fixed Fee
        markupPercent: '20',
        expenseQty: '1',
        expensePreset: '',

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

    const RATE_CATEGORIES = [
        {
            name: "CREATIVE & STRATEGY SERVICES",
            rates: [
                { label: 'Creative Direction', rate: 300 },
                { label: 'Art Direction', rate: 225 },
                { label: 'Copywriting', rate: 200 },
                { label: 'Design', rate: 175 },
                { label: 'Code Writing / Development', rate: 225 },
            ]
        },
        {
            name: "ACCOUNT MANAGEMENT",
            rates: [
                { label: 'Account Director', rate: 225 },
                { label: 'Account Manager (Mid-Level)', rate: 165 },
                { label: 'Account Coordinator', rate: 115 },
            ]
        },
        {
            name: "EDITORIAL & POST-PRODUCTION",
            rates: [
                { label: 'Senior Editor', rate: 250 },
                { label: 'Motion Graphics Designer', rate: 225 },
            ]
        },
        {
            name: "EQUIPMENT & FACILITIES",
            rates: [
                { label: 'DaVinci Resolve Edit Bay', rate: 150 },
                { label: 'Color Grading Suite', rate: 175 },
                { label: 'Audio Mix / VO Booth', rate: 125 },
                { label: 'Production Equipment Kit', rate: 100 },
            ]
        }
    ];

    const STANDARD_RATES = RATE_CATEGORIES.flatMap(c => c.rates);

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
        setSelectedClient('');
        setFormData({
            projectId: '',
            date: new Date().toISOString().split('T')[0],
            description: '',
            hours: '',
            rateMultiplier: '1.0',
            rate: '',
            rateOption: '',
            cost: '',
            amount: '',
            markupPercent: '20',
            expenseQty: '1',
            expensePreset: '',
            googleSpend: '',
            metaSpend: '',
            billingMonth: new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
        });
    };

    const uniqueClients = React.useMemo(() => Array.from(new Set(projects.map(p => p.client))).sort(), [projects]);

    const availableLogMonths = React.useMemo(() => {
        const ms = new Set<string>();
        logs.forEach(l => ms.add(l.date.substring(0, 7)));

        const d = new Date();
        d.setDate(1);
        for (let i = 0; i < 24; i++) {
            const y = d.getFullYear();
            const mo = String(d.getMonth() + 1).padStart(2, '0');
            ms.add(`${y}-${mo}`);
            d.setMonth(d.getMonth() - 1);
        }

        return Array.from(ms).sort().reverse();
    }, [logs]);

    const filteredLogs = React.useMemo(() => {
        return logs.filter(l => {
            const proj = projects.find(p => p.id === l.projectId);
            const clientMatch = logFilterClient === 'ALL' || (proj && proj.client === logFilterClient);
            const monthMatch = logFilterMonth === 'ALL' || l.date.startsWith(logFilterMonth);
            return clientMatch && monthMatch;
        });
    }, [logs, projects, logFilterClient, logFilterMonth]);

    const { projectsByMonth, sortedMonthKeys } = React.useMemo(() => {
        const filtered = selectedClient ? projects.filter(p => p.client === selectedClient) : [];
        const grouped = filtered.reduce((acc, p) => {
            const d = p.startDate ? p.startDate.substring(0, 7) : 'Unknown Start Date';
            if (!acc[d]) acc[d] = [];
            acc[d].push(p);
            return acc;
        }, {} as Record<string, typeof projects>);

        const sortedKeys = Object.keys(grouped).sort().reverse();
        Object.values(grouped).forEach(list => list.sort((a, b) => (b.startDate || '').localeCompare(a.startDate || '')));

        return { projectsByMonth: grouped, sortedMonthKeys: sortedKeys };
    }, [projects, selectedClient]);

    const handleEdit = (log: LogItem) => {
        setEditingLogId(log.id);
        setActiveTab(log.type);

        const p = projects.find(proj => proj.id === log.projectId);
        if (p) setSelectedClient(p.client);

        setFormData({
            projectId: log.projectId,
            date: log.date,
            description: log.description,
            hours: log.hours?.toString() || '',
            rateMultiplier: log.rateMultiplier?.toString() || '1.0',
            rate: log.rate?.toString() || '',
            rateOption: log.rate ? (STANDARD_RATES.findIndex(r => r.rate === log.rate) !== -1 ? `std-${STANDARD_RATES.findIndex(r => r.rate === log.rate)}` : 'custom') : '',
            cost: log.cost?.toString() || '',
            amount: (log.type === 'FIXED_FEE' ? log.billableAmount : log.cost)?.toString() || '',
            markupPercent: log.markupPercent?.toString() || '20',
            expenseQty: '1',
            expensePreset: '',
            googleSpend: log.mediaDetails?.googleSpend?.toString() || '',
            metaSpend: log.mediaDetails?.metaSpend?.toString() || '',
            billingMonth: log.mediaDetails?.billingMonth || new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleTogglePaid = async (log: LogItem) => {
        const newStatus = log.status === 'PAID' ? 'PENDING' : 'PAID';
        await updateLog(log.id, { status: newStatus });
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this entry?')) {
            await deleteLog(id);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-12">
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
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Client</label>
                                <select
                                    required={!editingLogId}
                                    value={selectedClient}
                                    onChange={(e) => {
                                        setSelectedClient(e.target.value);
                                        setFormData(prev => ({ ...prev, projectId: '' }));
                                    }}
                                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-slate-900"
                                >
                                    <option value="">Select a Client...</option>
                                    {uniqueClients.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Project</label>
                                <select
                                    required
                                    value={formData.projectId}
                                    onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-slate-900"
                                    disabled={!selectedClient}
                                >
                                    <option value="">Select a project...</option>
                                    {sortedMonthKeys.map(key => {
                                        let label = key;
                                        if (key !== 'Unknown Start Date') {
                                            const [y, m] = key.split('-');
                                            label = new Date(Number(y), Number(m) - 1).toLocaleDateString('default', { month: 'long', year: 'numeric' });
                                        }
                                        return (
                                            <optgroup key={key} label={label}>
                                                {projectsByMonth[key].map(p => (
                                                    <option key={p.id} value={p.id}>{p.name}</option>
                                                ))}
                                            </optgroup>
                                        );
                                    })}
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

                        {activeTab === 'EXPENSE' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Expense Item</label>
                                    <select
                                        value={formData.expensePreset}
                                        onChange={(e) => {
                                            const preset = e.target.value;
                                            const qty = parseFloat(formData.expenseQty) || 1;
                                            const item = LICENSE_FEES.find(f => f.label === preset);

                                            if (item) {
                                                setFormData({
                                                    ...formData,
                                                    expensePreset: preset,
                                                    description: preset,
                                                    cost: (item.cost * qty).toFixed(2)
                                                });
                                            } else {
                                                setFormData({ ...formData, expensePreset: preset, description: preset === 'custom' ? '' : preset });
                                            }
                                        }}
                                        className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-slate-900"
                                    >
                                        <option value="">Select Expense Type...</option>
                                        {LICENSE_FEES.map(f => (
                                            <option key={f.label} value={f.label}>{f.label} (${f.cost})</option>
                                        ))}
                                        <option value="custom">Custom (Enter manually)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quantity</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.expenseQty}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            const qty = parseFloat(val) || 0;
                                            const item = LICENSE_FEES.find(f => f.label === formData.expensePreset);
                                            let newCost = formData.cost;
                                            if (item) {
                                                newCost = (item.cost * qty).toFixed(2);
                                            }
                                            setFormData({ ...formData, expenseQty: val, cost: newCost });
                                        }}
                                        className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-slate-900"
                                        disabled={!formData.expensePreset || formData.expensePreset === 'custom'}
                                    />
                                </div>
                            </div>
                        )}

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
                                                    setFormData({ ...formData, rate: '', rateOption: 'custom' });
                                                } else if (val.startsWith('std-')) {
                                                    const index = parseInt(val.split('-')[1]);
                                                    setFormData({ ...formData, rate: STANDARD_RATES[index].rate.toString(), rateOption: val });
                                                } else if (val.startsWith('saved-')) {
                                                    const index = parseInt(val.split('-')[1]);
                                                    setFormData({ ...formData, rate: savedRates[index].rate.toString(), rateOption: val });
                                                } else {
                                                    setFormData({ ...formData, rate: '', rateOption: '' });
                                                }
                                            }}
                                            value={formData.rateOption}
                                        >
                                            <option value="">Default Project Rate</option>
                                            {RATE_CATEGORIES.map((category) => (
                                                <optgroup key={category.name} label={category.name}>
                                                    {category.rates.map((r) => {
                                                        const i = STANDARD_RATES.indexOf(r);
                                                        return (
                                                            <option key={`std-${i}`} value={`std-${i}`}>{r.label} (${r.rate}/hr)</option>
                                                        );
                                                    })}
                                                </optgroup>
                                            ))}
                                            {savedRates.length > 0 && (
                                                <optgroup label="My Custom Rates">
                                                    {savedRates.map((r, i) => (
                                                        <option key={`saved-${i}`} value={`saved-${i}`}>{r.label} (${r.rate}/hr)</option>
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
                                            onChange={(e) => setFormData({ ...formData, rate: e.target.value, rateOption: 'custom' })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hours (0.25 increments)</label>
                                    <input
                                        type="number"
                                        step="0.25"
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
                                                // Round to nearest 0.25
                                                const rounded = Math.round(val * 4) / 4;
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
                    <div className="flex justify-between items-center px-2 mb-4">
                        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Recent Logs</h2>
                        <div className="flex gap-2">
                            <select
                                value={logFilterClient}
                                onChange={(e) => setLogFilterClient(e.target.value)}
                                className="bg-transparent text-xs font-bold text-slate-400 border border-slate-200 rounded-lg px-2 py-1 focus:ring-0 focus:border-slate-400 outline-none"
                            >
                                <option value="ALL">All Clients</option>
                                {uniqueClients.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <select
                                value={logFilterMonth}
                                onChange={(e) => setLogFilterMonth(e.target.value)}
                                className="bg-transparent text-xs font-bold text-slate-400 border border-slate-200 rounded-lg px-2 py-1 focus:ring-0 focus:border-slate-400 outline-none"
                            >
                                <option value="ALL">All Months</option>
                                {availableLogMonths.map(m => {
                                    const [y, mo] = m.split('-');
                                    const label = new Date(Number(y), Number(mo) - 1).toLocaleDateString('default', { month: 'short', year: 'numeric' });
                                    return <option key={m} value={m}>{label}</option>
                                })}
                            </select>
                        </div>
                    </div>
                    <div className="space-y-4">
                        {Object.entries(filteredLogs.slice(0, 50).reduce((groups, log) => {
                            const pid = log.projectId;
                            if (!groups[pid]) groups[pid] = [];
                            groups[pid].push(log);
                            return groups;
                        }, {} as Record<string, typeof logs>)).map(([projectId, projectLogs]) => {
                            const project = projects.find(p => p.id === projectId);
                            return (
                                <div key={projectId} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 overflow-hidden relative">
                                    <div className="flex items-center justify-between mb-6 border-b border-slate-50 pb-4">
                                        <div>
                                            <h3 className="font-bold text-slate-900 text-lg leading-tight">{project?.name || 'Unknown Project'}</h3>
                                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">{project?.client}</p>
                                        </div>
                                        <div className="bg-slate-50 p-2 rounded-xl text-slate-400">
                                            <Briefcase size={20} weight="duotone" />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {projectLogs.sort((a, b) => {
                                            const priorities: Record<string, number> = { 'TIME': 1, 'EXPENSE': 2, 'MEDIA_SPEND': 3, 'FIXED_FEE': 4 };
                                            const pa = priorities[a.type] || 99;
                                            const pb = priorities[b.type] || 99;
                                            if (pa !== pb) return pa - pb;
                                            return b.date.localeCompare(a.date);
                                        }).map(log => (
                                            <div key={log.id} className="group relative pl-4 border-l-2 border-slate-100 hover:border-slate-900 transition-colors py-1">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1 pr-4">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <div className={`p-1 rounded 
                                                                ${log.type === 'TIME' ? 'bg-sky-50 text-sky-600' :
                                                                    log.type === 'EXPENSE' ? 'bg-rose-50 text-rose-600' :
                                                                        log.type === 'FIXED_FEE' ? 'bg-emerald-50 text-emerald-600' :
                                                                            'bg-purple-50 text-purple-600'}`}>
                                                                {log.type === 'TIME' && <Clock size={12} weight="fill" />}
                                                                {log.type === 'EXPENSE' && <Tag size={12} weight="fill" />}
                                                                {log.type === 'FIXED_FEE' && <Check size={12} weight="fill" />}
                                                                {log.type === 'MEDIA_SPEND' && <Faders size={12} weight="fill" />}
                                                            </div>
                                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{log.date}</span>
                                                        </div>
                                                        <p className="text-sm font-bold text-slate-800 leading-snug">
                                                            {log.description}
                                                            {(() => {
                                                                const match = LICENSE_FEES.find(f => f.label === log.description);
                                                                if (match && log.cost && log.cost > match.cost + 0.01) {
                                                                    const qty = Math.round(log.cost / match.cost);
                                                                    if (qty > 1) return <span className="text-[10px] text-slate-400 font-bold ml-1 uppercase">(Qty: {qty})</span>;
                                                                }
                                                                return null;
                                                            })()}
                                                        </p>
                                                    </div>

                                                    <div className="text-right">
                                                        <div className={`text-sm font-bold tabular-nums ${log.status === 'PAID' ? 'text-emerald-500' : 'text-slate-900'}`}>
                                                            {log.type === 'TIME' ? (
                                                                <div className="flex flex-col items-end leading-none gap-1">
                                                                    <span className="flex items-center gap-1">
                                                                        ${((log.rate || 0) * (log.hours || 0) * (log.rateMultiplier || 1)).toFixed(2)}
                                                                        {log.status === 'PAID' && <span className="text-[10px] uppercase font-extrabold tracking-wider bg-emerald-100 text-emerald-700 px-1 rounded">PAID</span>}
                                                                    </span>
                                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{log.hours}h</span>
                                                                </div>
                                                            ) : (
                                                                <span>
                                                                    ${log.billableAmount?.toFixed(2)}
                                                                    {log.status === 'PAID' && <span className="ml-1 text-[10px] uppercase font-extrabold tracking-wider bg-emerald-100 text-emerald-700 px-1 rounded align-middle">PAID</span>}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="absolute right-0 top-0 -mt-2 opacity-0 group-hover:opacity-100 transition-opacity flex justify-end">
                                                    <div className="bg-white shadow-sm border border-slate-100 rounded-lg flex p-1 gap-1">
                                                        <button
                                                            onClick={() => handleTogglePaid(log)}
                                                            className={`p-1 rounded transition-colors ${log.status === 'PAID' ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'hover:bg-slate-50 text-slate-400 hover:text-emerald-500'}`}
                                                            title={log.status === 'PAID' ? "Mark as Unpaid" : "Mark as Paid"}
                                                        >
                                                            <CurrencyDollar size={14} weight={log.status === 'PAID' ? "fill" : "bold"} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleEdit(log)}
                                                            className="p-1 hover:bg-slate-50 text-slate-400 hover:text-slate-900 rounded transition-colors"
                                                            title="Edit"
                                                        >
                                                            <PencilSimple size={14} weight="bold" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(log.id)}
                                                            className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash size={14} weight="bold" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center bg-slate-50/50 -mx-6 -mb-6 px-6 py-4">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Project Total</span>
                                        <span className="text-lg font-bold text-slate-900 tabular-nums">
                                            ${projectLogs.reduce((acc, l) => {
                                                const amount = l.type === 'TIME'
                                                    ? (l.rate || 0) * (l.hours || 0) * (l.rateMultiplier || 1)
                                                    : (l.billableAmount || 0);
                                                return acc + amount;
                                            }, 0).toFixed(2)}
                                        </span>
                                    </div>
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
