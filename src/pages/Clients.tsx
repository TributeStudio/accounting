import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Pencil, User, Phone, EnvelopeSimple, Buildings, Trash } from '@phosphor-icons/react';
import type { Client } from '../types';

const Clients: React.FC = () => {
    const { clients, addClient, updateClient, deleteClient } = useApp();
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
        defaultRate: '150',
        status: 'ACTIVE' as 'ACTIVE' | 'ARCHIVED'
    });

    const [isSaving, setIsSaving] = useState(false);

    const handleEdit = (client: Client) => {
        setEditingClient(client);
        setFormData({
            name: client.name,
            contactPerson: client.contactPerson,
            email: client.email,
            phone: client.phone,
            address: client.address,
            defaultRate: client.defaultRate.toString(),
            status: client.status
        });
        setShowAddModal(true);
    };

    const handleDelete = async (id: string, name: string) => {
        if (confirm(`Are you sure you want to remove client "${name}"? This cannot be undone.`)) {
            await deleteClient(id);
        }
    };

    const handleCloseModal = () => {
        setShowAddModal(false);
        setEditingClient(null);
        setFormData({
            name: '',
            contactPerson: '',
            email: '',
            phone: '',
            address: '',
            defaultRate: '150',
            status: 'ACTIVE'
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (editingClient) {
                await updateClient(editingClient.id, {
                    name: formData.name,
                    contactPerson: formData.contactPerson,
                    email: formData.email,
                    phone: formData.phone,
                    address: formData.address,
                    defaultRate: Number(formData.defaultRate),
                    status: formData.status
                });
            } else {
                await addClient({
                    name: formData.name,
                    contactPerson: formData.contactPerson,
                    email: formData.email,
                    phone: formData.phone,
                    address: formData.address,
                    defaultRate: Number(formData.defaultRate),
                    status: formData.status
                });
            }
            handleCloseModal();
        } catch (error) {
            console.error('Submit handle error:', error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold text-slate-900 mb-2">Clients</h1>
                    <p className="text-slate-500">Manage your direct client relationships and billing details.</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-slate-800 transition-colors shadow-lg"
                >
                    <Plus size={18} weight="bold" /> New Client
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clients.map((client) => (
                    <div key={client.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 group hover:shadow-xl transition-all duration-300 relative group">
                        <div className="flex justify-between items-start mb-6">
                            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                <Buildings size={24} weight="duotone" />
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleEdit(client)}
                                    className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
                                    title="Edit Client"
                                >
                                    <Pencil size={18} weight="bold" />
                                </button>
                                <button
                                    onClick={() => handleDelete(client.id, client.name)}
                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                    title="Delete Client"
                                >
                                    <Trash size={18} weight="bold" />
                                </button>
                            </div>
                        </div>

                        <h3 className="text-xl font-bold text-slate-900 mb-1">{client.name}</h3>
                        <p className="text-sm text-slate-500 mb-6 flex items-center gap-1">
                            <User size={14} weight="duotone" className="opacity-50" /> {client.contactPerson || 'No contact person'}
                        </p>

                        <div className="space-y-3 pt-6 border-t border-slate-50">
                            {client.email && (
                                <div className="flex items-center gap-3 text-sm text-slate-600">
                                    <EnvelopeSimple size={16} weight="duotone" className="text-slate-400" />
                                    <a href={`mailto:${client.email}`} className="hover:text-indigo-600 transition-colors">{client.email}</a>
                                </div>
                            )}
                            {client.phone && (
                                <div className="flex items-center gap-3 text-sm text-slate-600">
                                    <Phone size={16} weight="duotone" className="text-slate-400" />
                                    {client.phone}
                                </div>
                            )}
                            <div className="flex items-center gap-3 text-sm text-slate-600">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest w-4">Rate</span>
                                <span className="font-bold">${client.defaultRate}/hr</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
                            <h2 className="font-bold text-2xl">{editingClient ? 'Edit Client' : 'New Client'}</h2>
                            <button onClick={handleCloseModal} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                <Plus size={24} weight="bold" className="rotate-45" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Client / Company Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Acme Corp"
                                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-slate-900"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contact Person</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. John Doe"
                                        className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-slate-900"
                                        value={formData.contactPerson}
                                        onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Default Hourly Rate</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-slate-900"
                                        value={formData.defaultRate}
                                        onChange={(e) => setFormData({ ...formData, defaultRate: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                                <input
                                    type="email"
                                    placeholder="billing@acme.com"
                                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-slate-900"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Phone Number</label>
                                <input
                                    type="tel"
                                    placeholder="(555) 123-4567"
                                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-slate-900"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Billing Address</label>
                                <textarea
                                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-slate-900 min-h-[80px]"
                                    placeholder="123 Business Rd, Suite 100..."
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status</label>
                                <select
                                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-slate-900"
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'ARCHIVED' })}
                                >
                                    <option value="ACTIVE">ACTIVE</option>
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
                                    editingClient ? 'Update Client' : 'Create Client'
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Clients;
