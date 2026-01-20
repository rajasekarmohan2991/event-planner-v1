'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Save, Loader2, Info } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function NewTemplatePage() {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [templateForOptions, setTemplateForOptions] = useState<any[]>([]);
    const [documentTypeOptions, setDocumentTypeOptions] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        templateType: 'VENDOR',
        documentName: '',
        documentType: 'TERMS',
        content: ''
    });

    useEffect(() => {
        fetchLookupOptions();
    }, []);

    const fetchLookupOptions = async () => {
        try {
            const [templateForRes, documentTypeRes] = await Promise.all([
                fetch('/api/admin/lookups?category=template_for'),
                fetch('/api/admin/lookups?category=document_type')
            ]);

            if (templateForRes.ok) {
                const data = await templateForRes.json();
                setTemplateForOptions(data.values || []);
            }

            if (documentTypeRes.ok) {
                const data = await documentTypeRes.json();
                setDocumentTypeOptions(data.values || []);
            }
        } catch (error) {
            console.error('Error fetching lookup options:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/admin/document-templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error('Failed to create template');

            toast({
                title: 'Success',
                description: 'Document template created successfully',
            });
            router.push('/super-admin/signatures/templates');
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to save template',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

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
                    <h1 className="text-2xl font-bold text-gray-900">Create New Template</h1>
                    <p className="text-gray-500 text-sm mt-1">Define document terms for your event partners</p>
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
                                    {templateForOptions.length > 0 ? (
                                        templateForOptions.filter(opt => opt.is_active !== false).map(option => (
                                            <option key={option.id} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))
                                    ) : (
                                        <>
                                            <option value="VENDOR">Vendor</option>
                                            <option value="SPONSOR">Sponsor</option>
                                            <option value="EXHIBITOR">Exhibitor</option>
                                            <option value="SPEAKER">Speaker</option>
                                            <option value="ATTENDEE">Attendee</option>
                                            <option value="STAFF">Staff</option>
                                        </>
                                    )}
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
                                    {documentTypeOptions.length > 0 ? (
                                        documentTypeOptions.filter(opt => opt.is_active).map(option => (
                                            <option key={option.id} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))
                                    ) : (
                                        <>
                                            <option value="TERMS">Terms & Conditions</option>
                                            <option value="DISCLAIMER">Liability Disclaimer</option>
                                            <option value="CONTRACT">Contract Agreement</option>
                                        </>
                                    )}
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
                                placeholder="e.g. Standard Vendor Agreement 2026"
                                className="w-full h-10 rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                            />
                            <p className="text-xs text-gray-500 mt-1">Internal name for this template version</p>
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
                            placeholder="<h1>Terms & Conditions</h1><p>Enter your agreement text here...</p>"
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
                            disabled={loading}
                            className="flex items-center gap-2 px-8 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-100 transition-all disabled:opacity-70 shadow-lg shadow-indigo-200"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Create Template
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
