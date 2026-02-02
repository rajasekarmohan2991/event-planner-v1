"use client";

import { useState, useEffect } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface CompanyLogoUploadProps {
    companyId: string;
}

export function CompanyLogoUpload({ companyId }: CompanyLogoUploadProps) {
    const { toast } = useToast();
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCurrentLogo();
    }, [companyId]);

    async function loadCurrentLogo() {
        try {
            const res = await fetch(`/api/super-admin/companies/${companyId}`);
            if (res.ok) {
                const data = await res.json();
                if (data.company?.logo) {
                    setLogoUrl(data.company.logo);
                }
            }
        } catch (error) {
            console.error("Failed to load logo:", error);
        } finally {
            setLoading(false);
        }
    }

    async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast({
                title: "Invalid File",
                description: "Please upload an image file",
                variant: "destructive"
            });
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast({
                title: "File Too Large",
                description: "Please upload an image smaller than 5MB",
                variant: "destructive"
            });
            return;
        }

        try {
            setUploading(true);

            // Upload to /api/uploads
            const formData = new FormData();
            formData.append('file', file);

            const uploadRes = await fetch('/api/uploads', {
                method: 'POST',
                body: formData
            });

            if (!uploadRes.ok) {
                throw new Error('Upload failed');
            }

            const uploadData = await uploadRes.json();
            const uploadedUrl = uploadData.url;

            // Update company logo
            const updateRes = await fetch(`/api/super-admin/companies/${companyId}/logo`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ logoUrl: uploadedUrl })
            });

            if (!updateRes.ok) {
                throw new Error('Failed to update company logo');
            }

            setLogoUrl(uploadedUrl);
            toast({
                title: "Logo Updated",
                description: "Company logo has been successfully updated"
            });
        } catch (error: any) {
            console.error("Upload error:", error);
            toast({
                title: "Upload Failed",
                description: error.message || "Failed to upload logo",
                variant: "destructive"
            });
        } finally {
            setUploading(false);
        }
    }

    async function handleRemoveLogo() {
        try {
            setUploading(true);

            const res = await fetch(`/api/super-admin/companies/${companyId}/logo`, {
                method: 'DELETE'
            });

            if (!res.ok) {
                throw new Error('Failed to remove logo');
            }

            setLogoUrl(null);
            toast({
                title: "Logo Removed",
                description: "Company logo has been removed"
            });
        } catch (error: any) {
            console.error("Remove error:", error);
            toast({
                title: "Failed to Remove",
                description: error.message || "Failed to remove logo",
                variant: "destructive"
            });
        } finally {
            setUploading(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-32">
                <div className="relative w-12 h-12">
                    <Image src="/loading-logo.png" alt="Loading" fill className="object-contain" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Logo Preview */}
            <div className="flex items-center gap-4">
                <div className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-800">
                    {logoUrl ? (
                        <img
                            src={logoUrl}
                            alt="Company Logo"
                            className="w-full h-full object-contain"
                        />
                    ) : (
                        <ImageIcon className="w-8 h-8 text-gray-400" />
                    )}
                </div>

                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {logoUrl ? "Current Logo" : "No Logo Uploaded"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Recommended: Square image, at least 200x200px
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Max size: 5MB (JPG, PNG, SVG)
                    </p>
                </div>
            </div>

            {/* Upload/Remove Buttons */}
            <div className="flex gap-2">
                <label className="flex-1">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        disabled={uploading}
                        className="hidden"
                    />
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        disabled={uploading}
                        onClick={(e) => {
                            e.preventDefault();
                            (e.currentTarget.previousElementSibling as HTMLInputElement)?.click();
                        }}
                    >
                        {uploading ? (
                            <>
                                <div className="relative w-4 h-4 mr-2">
                                    <Image src="/loading-logo.png" alt="Loading" fill className="object-contain" />
                                </div>
                                Uploading...
                            </>
                        ) : (
                            <>
                                <Upload className="w-4 h-4 mr-2" />
                                {logoUrl ? "Change Logo" : "Upload Logo"}
                            </>
                        )}
                    </Button>
                </label>

                {logoUrl && (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleRemoveLogo}
                        disabled={uploading}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                )}
            </div>
        </div>
    );
}
