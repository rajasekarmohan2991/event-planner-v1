'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, FileText, Edit, Check, X, Loader2, Search } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface Template {
    id: string;
    templateType: string;
    documentName: string;
    documentType: string;
    version: number;
    isActive: boolean;
    createdAt: string;
}

export default function DocumentTemplatesPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');

    useEffect(() => {
        fetchTemplates();
    }, []);

    async function fetchTemplates() {
        try {
            const res = await fetch('/api/admin/document-templates');
            const data = await res.json();
            if (res.ok) {
                setTemplates(data.templates);
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to load templates',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }

    const filteredTemplates = templates.filter(t =>
        filter === 'ALL' ? true : t.templateType === filter
    );

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                        Document Templates
                    </h1>
                    <p className="text-gray-500 mt-2">Manage terms and contracts for Vendors, Sponsors, and Exhibitors</p>
                </div>
                <button
                    onClick={() => router.push('/super-admin/signatures/templates/new')}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md"
                >
                    <Plus className="w-4 h-4" />
                    Create Template
                </button>
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-6">
                {['ALL', 'VENDOR', 'SPONSOR', 'EXHIBITOR'].map((type) => (
                    <button
                        key={type}
                        onClick={() => setFilter(type)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${filter === type
                            ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-500 ring-offset-2'
                            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                            }`}
                    >
                        {type === 'ALL' ? 'All' : type.charAt(0) + type.slice(1).toLowerCase() + 's'}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredTemplates.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <h3 className="text-lg font-medium text-gray-900">No templates found</h3>
                            <p className="text-gray-500">Create a new template to get started</p>
                        </div>
                    ) : (
                        filteredTemplates.map((template) => (
                            <div
                                key={template.id}
                                className="group flex items-center justify-between p-5 bg-white rounded-xl border border-gray-200 hover:border-indigo-200 hover:shadow-md transition-all"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-lg ${template.templateType === 'VENDOR' ? 'bg-blue-50 text-blue-600' :
                                        template.templateType === 'SPONSOR' ? 'bg-purple-50 text-purple-600' :
                                            'bg-orange-50 text-orange-600'
                                        }`}>
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-900">{template.documentName}</h3>
                                        <div className="flex gap-3 text-sm text-gray-500 mt-1">
                                            <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-medium">
                                                {template.templateType}
                                            </span>
                                            <span>v{template.version}</span>
                                            <span>•</span>
                                            <span>{new Date(template.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${template.isActive
                                        ? 'bg-green-50 text-green-700'
                                        : 'bg-gray-100 text-gray-600'
                                        }`}>
                                        {template.isActive ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                                        {template.isActive ? 'Active' : 'Inactive'}
                                    </div>
                                    <button
                                        onClick={() => router.push(`/super-admin/signatures/templates/${template.id}`)}
                                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
