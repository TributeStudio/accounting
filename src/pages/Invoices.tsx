import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { draftInvoiceEmail } from '../services/gemini';
import {
    FileText,
    Printer,
    Mail,
    Loader2,
    X,
    Sparkles
} from 'lucide-react';

const Invoices: React.FC = () => {
    const { logs, projects } = useApp();
    const [selectedClientId, setSelectedClientId] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const [emailLoading, setEmailLoading] = useState(false);
    const [emailDraft, setEmailDraft] = useState<string | null>(null);

    const clients = useMemo(() => {
        const uniqueClients = Array.from(new Set(projects.map(p => p.client)));
        return uniqueClients;
    }, [projects]);

    const filteredLogs = useMemo(() => {
        if (!selectedClientId) return [];
        const clientProjects = projects.filter(p => p.client === selectedClientId).map(p => p.id);
        return logs.filter(l => clientProjects.includes(l.projectId));
    }, [selectedClientId, logs, projects]);

    const totals = useMemo(() => {
        let subtotal = 0;
        filteredLogs.forEach(l => {
            const project = projects.find(p => p.id === l.projectId);
            if (l.type === 'TIME' && l.hours && project) {
                subtotal += l.hours * project.hourlyRate;
            } else if (l.type === 'EXPENSE' && l.billableAmount) {
                subtotal += l.billableAmount;
            }
        });
        return { subtotal, tax: subtotal * 0, total: subtotal };
    }, [filteredLogs, projects]);

    const handleDraftEmail = async () => {
        if (!selectedClientId) return;
        setEmailLoading(true);
        try {
            const clientProjects = projects.filter(p => p.client === selectedClientId).map(p => p.name);
            const draft = await draftInvoiceEmail(selectedClientId, totals.total.toFixed(2), clientProjects);
            setEmailDraft(draft);
        } catch (error) {
            console.error(error);
        } finally {
            setEmailLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-serif font-bold text-slate-900 mb-2">Billing Center</h1>
                    <p className="text-slate-500">Generate professional invoices for your clients.</p>
                </div>
                <div className="flex gap-3">
                    <select
                        className="bg-white border-none rounded-xl px-4 py-3 shadow-sm text-sm font-medium focus:ring-2 focus:ring-slate-900"
                        value={selectedClientId}
                        onChange={(e) => setSelectedClientId(e.target.value)}
                    >
                        <option value="">Select a Client...</option>
                        {clients.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <button
                        disabled={!selectedClientId || filteredLogs.length === 0}
                        onClick={() => setShowPreview(true)}
                        className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-slate-800 transition-colors disabled:opacity-50"
                    >
                        <Printer size={18} /> Preview Invoice
                    </button>
                </div>
            </div>

            {!selectedClientId ? (
                <div className="bg-slate-100/50 border-2 border-dashed border-slate-200 rounded-3xl p-20 text-center">
                    <FileText size={48} className="mx-auto text-slate-300 mb-4" />
                    <h2 className="text-xl font-serif font-bold text-slate-400">No Client Selected</h2>
                    <p className="text-slate-400">Choose a client above to view billable items.</p>
                </div>
            ) : (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50">
                                <th className="px-8 py-6">Date</th>
                                <th className="px-8 py-6">Project / Description</th>
                                <th className="px-8 py-6">Type</th>
                                <th className="px-8 py-6 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredLogs.map((log) => {
                                const project = projects.find(p => p.id === log.projectId);
                                const amount = log.type === 'TIME'
                                    ? (log.hours! * project!.hourlyRate)
                                    : log.billableAmount!;

                                return (
                                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-8 py-6 text-sm text-slate-500 tabular-nums">{log.date}</td>
                                        <td className="px-8 py-6">
                                            <p className="text-sm font-bold text-slate-900 mb-0.5">{project?.name}</p>
                                            <p className="text-sm text-slate-500">{log.description}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider
                        ${log.type === 'TIME' ? 'bg-indigo-50 text-indigo-600' : 'bg-pink-50 text-pink-600'}`}>
                                                {log.type}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-sm font-bold text-slate-900 text-right tabular-nums">
                                            ${amount.toFixed(2)}
                                            {log.type === 'TIME' && <span className="block text-[10px] font-normal text-slate-400">{log.hours}h @ ${project?.hourlyRate}/h</span>}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot>
                            <tr className="bg-slate-50/50">
                                <td colSpan={3} className="px-8 py-8 text-right font-serif font-bold text-lg">Invoice Total</td>
                                <td className="px-8 py-8 text-right font-serif font-bold text-2xl text-slate-900">${totals.total.toFixed(2)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}

            {/* Invoice Modal Preview */}
            {showPreview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="font-serif font-bold text-xl">Invoice Preview</h2>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleDraftEmail}
                                    className="flex items-center gap-2 px-4 py-2 bg-sky-50 text-sky-600 rounded-lg text-sm font-bold hover:bg-sky-100 transition-colors"
                                >
                                    {emailLoading ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                                    Draft with AI
                                </button>
                                <button
                                    onClick={() => window.print()}
                                    className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors"
                                >
                                    Print PDF
                                </button>
                                <button onClick={() => setShowPreview(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-12 bg-white printable-area">
                            <div id="invoice-bill">
                                <div className="flex justify-between items-start mb-12">
                                    <div>
                                        <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center mb-4">
                                            <span className="text-white font-serif font-bold text-2xl">T</span>
                                        </div>
                                        <h1 className="text-2xl font-serif font-bold">Tribute Studio</h1>
                                        <p className="text-sm text-slate-500">123 Creative Avenue,<br />Design District, CA 90210</p>
                                    </div>
                                    <div className="text-right">
                                        <h2 className="text-4xl font-serif font-bold text-slate-900 mb-2 uppercase tracking-tighter">Invoice</h2>
                                        <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">#{Math.floor(Math.random() * 10000)}</p>
                                        <p className="text-sm text-slate-500 mt-4">Date: {new Date().toLocaleDateString()}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-12 mb-12 border-t border-b border-slate-100 py-8">
                                    <div>
                                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Bill To:</h3>
                                        <p className="text-lg font-bold text-slate-900 font-serif">{selectedClientId}</p>
                                        <p className="text-sm text-slate-500 mt-1">Authorized Representative</p>
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Payment Terms:</h3>
                                        <p className="text-sm text-slate-900 font-medium">Due Upon Receipt</p>
                                        <p className="text-sm text-slate-500 mt-1">Bank Transfer / Credit Card</p>
                                    </div>
                                </div>

                                <table className="w-full mb-12">
                                    <thead>
                                        <tr className="text-left text-[10px] font-bold text-slate-900 uppercase tracking-[0.2em] border-b-2 border-slate-900">
                                            <th className="py-4">Description</th>
                                            <th className="py-4 text-center">Qty/Hrs</th>
                                            <th className="py-4 text-right">Rate</th>
                                            <th className="py-4 text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredLogs.map((log) => {
                                            const project = projects.find(p => p.id === log.projectId);
                                            const amount = log.type === 'TIME' ? (log.hours! * project!.hourlyRate) : log.billableAmount!;
                                            return (
                                                <tr key={log.id}>
                                                    <td className="py-6">
                                                        <p className="font-bold text-slate-900">{project?.name}</p>
                                                        <p className="text-xs text-slate-500">{log.description}</p>
                                                    </td>
                                                    <td className="py-6 text-center text-sm font-medium">{log.type === 'TIME' ? log.hours : '1'}</td>
                                                    <td className="py-6 text-right text-sm font-medium">${log.type === 'TIME' ? project?.hourlyRate : log.cost}</td>
                                                    <td className="py-6 text-right text-sm font-bold">${amount.toFixed(2)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>

                                <div className="flex justify-end">
                                    <div className="w-64 space-y-4">
                                        <div className="flex justify-between text-slate-500 text-sm">
                                            <span>Subtotal</span>
                                            <span>${totals.total.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-slate-500 text-sm">
                                            <span>Tax (0%)</span>
                                            <span>$0.00</span>
                                        </div>
                                        <div className="border-t border-slate-900 pt-4 flex justify-between font-serif font-bold text-2xl text-slate-900">
                                            <span>Total Due</span>
                                            <span>${totals.total.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-20 pt-12 border-t border-slate-100 text-center">
                                    <p className="text-sm text-slate-400">Thank you for your business. We truly value our collaboration.</p>
                                    <p className="text-xs font-serif italic text-slate-300 mt-4">Elevating creative standards since 2024.</p>
                                </div>
                            </div>
                        </div>

                        {/* AI Email Draft Panel */}
                        {emailDraft && (
                            <div className="bg-slate-50 p-8 border-t border-slate-100 animate-in slide-in-from-bottom duration-500">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold flex items-center gap-2 text-slate-900">
                                        <Sparkles size={16} className="text-amber-500" />
                                        AI-Powered Email Draft
                                    </h3>
                                    <button onClick={() => setEmailDraft(null)} className="text-slate-400 hover:text-slate-600">
                                        <X size={16} />
                                    </button>
                                </div>
                                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                    <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700 leading-relaxed">
                                        {emailDraft}
                                    </pre>
                                </div>
                                <button className="mt-4 flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold mx-auto">
                                    Copy to Clipboard
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Invoices;
