'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft, Send, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function NewSignatureRequestPage() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [templates, setTemplates] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        entityType: 'VENDOR',
        entityId: `${Date.now()}`, // Mock ID for now, normally would select from existing vendors
        signerName: '',
        signerEmail: '',
        documentType: 'TERMS'
    });

    // Mock checking for available templates
    // In a real app, you might want to fetch this to only show available options
    useEffect(() => {
        // This is just to ensure the selected type actually has a template
        // We'll rely on server-side validation mostly
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch(`/api/events/${params.id}/signatures`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to create request');
            }

            toast({
                title: 'Success',
                description: 'Signature request created successfully',
            });

            // If we had email integration, we'd say "Email sent"
            // Since it's mock/manual for now, we redirect
            router.push(`/events/${params.id}/signatures`);
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-3xl mx-auto">
            <button
                onClick={() => router.back()}
                className="flex items-center text-gray-500 hover:text-gray-900 mb-6 transition-colors"
            >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back to Signatures
            </button>

            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                    <h1 className="text-2xl font-bold text-gray-900">Request Signature</h1>
                    <p className="text-gray-500 text-sm mt-1">Send a document to a vendor, sponsor, or exhibitor</p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Recipient Type
                            </label>
                            <select
                                value={formData.entityType}
                                onChange={(e) => setFormData({ ...formData, entityType: e.target.value })}
                                className="w-full h-10 rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                            >
                                <option value="VENDOR">Vendor</option>
                                <option value="SPONSOR">Sponsor</option>
                                <option value="EXHIBITOR">Exhibitor</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Document to Sign
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

                        <div className="md:col-span-2 bg-blue-50 p-3 rounded-lg flex gap-2 text-sm text-blue-700">
                            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <p>
                                Ensure an active template exists for the selected <strong>{formData.entityType}</strong> and <strong>{formData.documentType}</strong> type in Admin settings.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Signer Name
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.signerName}
                                onChange={(e) => setFormData({ ...formData, signerName: e.target.value })}
                                placeholder="John Doe"
                                className="w-full h-10 rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Signer Email
                            </label>
                            <input
                                type="email"
                                required
                                value={formData.signerEmail}
                                onChange={(e) => setFormData({ ...formData, signerEmail: e.target.value })}
                                placeholder="john@example.com"
                                className="w-full h-10 rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                            />
                            <p className="text-xs text-gray-500 mt-1">They must use this email to sign</p>
                        </div>
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
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            Create & Send Request
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
