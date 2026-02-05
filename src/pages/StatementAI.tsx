import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { processStatement } from '../services/gemini';
import { Sparkle, CircleNotch, FloppyDisk, Trash } from '@phosphor-icons/react';

const StatementAI: React.FC = () => {
    const { projects, addLog } = useApp();
    const [inputText, setInputText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [extractedItems, setExtractedItems] = useState<any[]>([]);
    const [selectedProject, setSelectedProject] = useState('');
    const [markupPercent, setMarkupPercent] = useState('20');
    const [status, setStatus] = useState<string | null>(null);

    const handleProcess = async () => {
        if (!inputText.trim()) return;
        setIsProcessing(true);
        setStatus('Analyzing statement...');
        try {
            const results = await processStatement(inputText);
            setExtractedItems(results.map((item: any, idx: number) => ({ ...item, id: idx, selected: true })));
            setStatus(null);
        } catch (error: any) {
            console.error(error);
            setStatus(`Error: ${error.message || 'Failed to process'}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSaveAll = async () => {
        if (!selectedProject) {
            alert('Please select a project first');
            return;
        }
        const ToSave = extractedItems.filter(i => i.selected);
        setIsProcessing(true);
        setStatus(`Saving ${ToSave.length} items...`);
        try {
            for (const item of ToSave) {
                const cost = Number(item.amount);
                const billable = cost * (1 + Number(markupPercent) / 100);
                await addLog({
                    projectId: selectedProject,
                    date: item.date || new Date().toISOString().split('T')[0],
                    description: item.description,
                    type: 'EXPENSE',
                    cost,
                    markupPercent: Number(markupPercent),
                    billableAmount: billable,
                    profit: billable - cost
                });
            }
            setExtractedItems([]);
            setInputText('');
            setStatus('Successfully saved to project!');
            setTimeout(() => setStatus(null), 3000);
        } catch (error) {
            console.error(error);
            setStatus('Error saving items');
        } finally {
            setIsProcessing(false);
        }
    };

    const toggleItem = (id: number) => {
        setExtractedItems(prev => prev.map(item =>
            item.id === id ? { ...item, selected: !item.selected } : item
        ));
    };

    const removeItem = (id: number) => {
        setExtractedItems(prev => prev.filter(item => item.id !== id));
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col">
                <h1 className="text-4xl font-bold text-slate-900 mb-2">Statement AI</h1>
                <p className="text-slate-500">Extract expenses from bank statements or invoices using Gemini AI.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Input Area */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col h-[500px]">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Paste Statement Content</h2>
                    <textarea
                        className="flex-1 bg-slate-50 border-none rounded-2xl p-6 text-slate-700 font-mono text-sm resize-none focus:ring-2 focus:ring-slate-900 mb-6"
                        placeholder="Paste text from your bank statement, receipt, or email here..."
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                    />
                    <button
                        onClick={handleProcess}
                        disabled={isProcessing || !inputText.trim()}
                        className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-transform active:scale-95 disabled:opacity-50"
                    >
                        {isProcessing ? <CircleNotch size={20} className="animate-spin" /> : <Sparkle size={20} weight="fill" className="text-amber-400" />}
                        Analyze with Gemini
                    </button>
                </div>

                {/* Results Area */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[500px]">
                    <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                        <h2 className="font-bold text-lg">Extracted Items</h2>
                        <span className="bg-sky-50 text-sky-600 px-3 py-1 rounded-full text-xs font-bold">
                            {extractedItems.length} Items Found
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                        {extractedItems.length > 0 ? (
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50">
                                        <th className="pb-4 w-10"></th>
                                        <th className="pb-4">Date</th>
                                        <th className="pb-4">Description</th>
                                        <th className="pb-4 text-right">Amount</th>
                                        <th className="pb-4 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {extractedItems.map((item) => (
                                        <tr key={item.id} className={`group hover:bg-slate-50 transition-colors ${!item.selected ? 'opacity-50' : ''}`}>
                                            <td className="py-4">
                                                <input
                                                    type="checkbox"
                                                    checked={item.selected}
                                                    onChange={() => toggleItem(item.id)}
                                                    className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                                                />
                                            </td>
                                            <td className="py-4 text-sm text-slate-600 tabular-nums">{item.date}</td>
                                            <td className="py-4 text-sm font-medium text-slate-900">{item.description}</td>
                                            <td className="py-4 text-sm font-bold text-slate-900 text-right tabular-nums">${item.amount}</td>
                                            <td className="py-4 text-right">
                                                <button onClick={() => removeItem(item.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                                                    <Trash size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                                {isProcessing ? (
                                    <CircleNotch size={40} className="animate-spin mb-4" />
                                ) : (
                                    <Sparkle size={40} className="mb-4" />
                                )}
                                <p>{status || 'Results will appear here.'}</p>
                            </div>
                        )}
                    </div>

                    {extractedItems.length > 0 && (
                        <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-4">
                            <div className="flex-1 space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assign to Project</label>
                                <select
                                    className="w-full bg-white border-none rounded-lg text-sm px-3 py-2 shadow-sm"
                                    value={selectedProject}
                                    onChange={(e) => setSelectedProject(e.target.value)}
                                >
                                    <option value="">Select Project...</option>
                                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div className="w-24 space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Markup</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        className="w-full bg-white border-none rounded-lg text-sm px-3 py-2 shadow-sm pr-6"
                                        value={markupPercent}
                                        onChange={(e) => setMarkupPercent(e.target.value)}
                                    />
                                    <span className="absolute right-2 top-2 text-[10px] text-slate-400 font-bold">%</span>
                                </div>
                            </div>
                            <div className="flex items-end">
                                <button
                                    onClick={handleSaveAll}
                                    disabled={!selectedProject || isProcessing}
                                    className="bg-slate-900 text-white px-6 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-slate-800 disabled:opacity-50"
                                >
                                    <FloppyDisk size={16} weight="duotone" /> Save
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StatementAI;
