'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft, Save, Loader2, Info } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function EditTemplatePage() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        id: '',
        templateType: '',
        documentName: '',
        documentType: '',
        content: ''
    });

    useEffect(() => {
        fetchTemplate();
    }, []);

    async function fetchTemplate() {
        try {
            // Note: We're reusing the list API but filtering in memory for now purely for speed
            // In a real app we'd have a specific GET /api/admin/document-templates/[id]
            const res = await fetch('/api/admin/document-templates');
            const data = await res.json();

            const template = data.templates.find((t: any) => t.id === params.id);

            if (template) {
                setFormData({
                    id: template.id,
                    templateType: template.templateType,
                    documentName: template.documentName,
                    documentType: template.documentType,
                    content: template.content
                });
            } else {
                throw new Error('Template not found');
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to load template',
                variant: 'destructive',
            });
            router.push('/super-admin/signatures/templates');
        } finally {
            setLoading(false);
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            // Creating a new version instead of updating in place is best practice for legal docs
            // But for now we'll create a new one to keep history
            const res = await fetch('/api/admin/document-templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error('Failed to update template');

            toast({
                title: 'Success',
                description: 'New version created successfully',
            });
            router.push('/super-admin/signatures/templates');
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to save template',
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <button
                onClick={() => router.back()}
                className="flex items-center text-gray-500 hover:text-gray-900 mb-6 transition-colors"
            >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back to Templates
            </button>

            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                    <h1 className="text-2xl font-bold text-gray-900">Edit Template</h1>
                    <p className="text-gray-500 text-sm mt-1">Creating a new version of {formData.documentName}</p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-8">
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Template For
                                </label>
                                <select
                                    value={formData.templateType}
                                    onChange={(e) => setFormData({ ...formData, templateType: e.target.value })}
                                    className="w-full h-10 rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                                >
                                    <option value="VENDOR">Vendor</option>
                                    <option value="SPONSOR">Sponsor</option>
                                    <option value="EXHIBITOR">Exhibitor</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Document Type
                                </label>
                                <select
                                    value={formData.documentType}
                                    onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                                    className="w-full h-10 rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                                >
                                    <option value="TERMS">Terms & Conditions</option>
                                    <option value="DISCLAIMER">Liability Disclaimer</option>
                                    <option value="CONTRACT">Contract Agreement</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Document Name
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.documentName}
                                onChange={(e) => setFormData({ ...formData, documentName: e.target.value })}
                                className="w-full h-10 rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Document Content
                            </label>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                HTML Supported
                            </span>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4 flex gap-3 text-sm text-amber-800">
                            <Info className="w-5 h-5 flex-shrink-0" />
                            <div>
                                <p className="font-semibold mb-1">Available Variables:</p>
                                <ul className="list-disc pl-4 space-y-0.5 opacity-90">
                                    <li><code>{`{eventName}`}</code> - Name of the event</li>
                                    <li><code>{`{vendorName}`}</code> / <code>{`{sponsorName}`}</code> - Name of the signer</li>
                                    <li><code>{`{companyName}`}</code> - Your organization name</li>
                                    <li><code>{`{date}`}</code> - Current date</li>
                                </ul>
                            </div>
                        </div>

                        <textarea
                            required
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            rows={15}
                            className="w-full rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm shadow-sm p-4"
                        />
                    </div>

                    <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="px-6 py-2.5 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-2 px-8 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-100 transition-all disabled:opacity-70 shadow-lg shadow-indigo-200"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Save New Version
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
