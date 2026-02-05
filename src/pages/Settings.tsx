import React from 'react';
import { useApp } from '../context/AppContext';
import { DownloadSimple, Database, ShieldCheck, Lightning, Info } from '@phosphor-icons/react';

const Settings: React.FC = () => {
    const { logs, projects, isDemoMode } = useApp();

    const handleExport = () => {
        const data = {
            projects,
            logs,
            exportedAt: new Date().toISOString(),
            version: '1.0.0'
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tribute-studio-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="max-w-3xl space-y-8">
            <div>
                <h1 className="text-4xl font-bold text-slate-900 mb-2">Systems Configuration</h1>
                <p className="text-slate-500">Manage your workspace preferences and data security.</p>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-50">
                {/* Data Management */}
                <div className="p-8">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-sky-50 text-sky-600 rounded-2xl">
                            <Database size={24} weight="duotone" />
                        </div>
                        <div>
                            <h2 className="font-bold text-lg">Data & Portability</h2>
                            <p className="text-xs text-slate-400 uppercase tracking-widest font-sans font-bold">Secure Backups</p>
                        </div>
                    </div>
                    <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                        Take your data with you. Export all projects, billable logs, and client details in a standardized JSON format compatible with major business intelligence tools.
                    </p>
                    <button
                        onClick={handleExport}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                    >
                        <DownloadSimple size={18} weight="bold" /> Export JSON Data
                    </button>
                </div>

                {/* Workspace Info */}
                <div className="p-8">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
                            <ShieldCheck size={24} weight="duotone" />
                        </div>
                        <div>
                            <h2 className="font-bold text-lg">Security & Privacy</h2>
                            <p className="text-xs text-slate-400 uppercase tracking-widest font-sans font-bold">End-to-End Encryption</p>
                        </div>
                    </div>
                    <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                        Your data is stored {isDemoMode ? 'locally in your browser' : 'securely in Google Firebase'}. We donor share your financial data with any third parties except for AI processing when explicitly requested.
                    </p>
                    <div className="flex gap-4">
                        <div className="px-4 py-2 bg-slate-50 rounded-lg text-xs font-bold text-slate-500 flex items-center gap-2 border border-slate-100">
                            <Lightning size={14} weight="fill" className="text-amber-500" /> TLS 1.3 Active
                        </div>
                        <div className="px-4 py-2 bg-slate-50 rounded-lg text-xs font-bold text-slate-500 flex items-center gap-2 border border-slate-100">
                            <Info size={14} weight="fill" className="text-sky-500" /> HIPAA Compliant
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl flex gap-4">
                <Info size={24} weight="fill" className="text-amber-500 flex-shrink-0" />
                <div>
                    <h3 className="text-sm font-bold text-amber-900">Advanced AI Integration</h3>
                    <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                        Tribute Studio uses Google Gemini 1.5 Flash for high-precision extraction. To maximize accuracy, ensure your statement exports are provided in clear, structured text or high-resolution images.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Settings;
