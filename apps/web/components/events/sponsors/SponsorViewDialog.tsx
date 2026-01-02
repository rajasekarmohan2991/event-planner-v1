import { ComprehensiveSponsor } from '@/types/sponsor'
import { Button } from '@/components/ui/button'
import { Edit2, Trash2 } from 'lucide-react'

interface SponsorViewDialogProps {
    sponsor: ComprehensiveSponsor
    onEdit: () => void
    onDelete: () => void
    onClose: () => void
}

export default function SponsorViewDialog({ sponsor, onEdit, onDelete, onClose }: SponsorViewDialogProps) {
    return (
        <div className="rounded-md border bg-white p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">{sponsor.name}</h2>
                <Button variant="outline" onClick={onClose}>
                    Back to List
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">Basic Information</h3>
                    <div className="space-y-2">
                        <div>
                            <span className="text-sm text-slate-500">Tier:</span>
                            <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium 
                ${sponsor.tier === 'PLATINUM' ? 'bg-purple-100 text-purple-800' :
                                    sponsor.tier === 'GOLD' ? 'bg-amber-100 text-amber-800' :
                                        sponsor.tier === 'SILVER' ? 'bg-slate-100 text-slate-800' :
                                            'bg-orange-50 text-orange-800'}`}>
                                {sponsor.tier}
                            </span>
                        </div>
                        {sponsor.logoUrl && (
                            <div>
                                <span className="text-sm text-slate-500">Logo:</span>
                                <a href={sponsor.logoUrl} target="_blank" rel="noopener noreferrer" className="ml-2 text-indigo-600 hover:underline text-sm">View Logo</a>
                            </div>
                        )}
                        {sponsor.website && (
                            <div>
                                <span className="text-sm text-slate-500">Website:</span>
                                <a href={sponsor.website} target="_blank" rel="noopener noreferrer" className="ml-2 text-indigo-600 hover:underline text-sm">{sponsor.website}</a>
                            </div>
                        )}
                    </div>
                </div>

                {/* Contact Information */}
                {sponsor.contactData && Object.keys(sponsor.contactData).length > 0 && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold border-b pb-2">Contact Information</h3>
                        <div className="space-y-2 text-sm">
                            {(sponsor.contactData as any).contactName && (
                                <div><span className="text-slate-500">Name:</span> <span className="ml-2 font-medium">{(sponsor.contactData as any).contactName}</span></div>
                            )}
                            {(sponsor.contactData as any).email && (
                                <div><span className="text-slate-500">Email:</span> <a href={`mailto:${(sponsor.contactData as any).email}`} className="ml-2 text-indigo-600 hover:underline">{(sponsor.contactData as any).email}</a></div>
                            )}
                            {(sponsor.contactData as any).phone && (
                                <div><span className="text-slate-500">Phone:</span> <a href={`tel:${(sponsor.contactData as any).phone}`} className="ml-2 text-indigo-600 hover:underline">{(sponsor.contactData as any).phone}</a></div>
                            )}
                            {(sponsor.contactData as any).designation && (
                                <div><span className="text-slate-500">Designation:</span> <span className="ml-2">{(sponsor.contactData as any).designation}</span></div>
                            )}
                            {(sponsor.contactData as any).whatsapp && (
                                <div><span className="text-slate-500">WhatsApp:</span> <span className="ml-2">{(sponsor.contactData as any).whatsapp}</span></div>
                            )}
                        </div>
                    </div>
                )}

                {/* Payment Information */}
                {sponsor.paymentData && Object.keys(sponsor.paymentData).length > 0 && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold border-b pb-2">Payment Information</h3>
                        <div className="space-y-2 text-sm">
                            {(sponsor.paymentData as any).amount && (
                                <div><span className="text-slate-500">Sponsorship Amount:</span> <span className="ml-2 font-bold text-green-600">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number((sponsor.paymentData as any).amount))}</span></div>
                            )}
                            {(sponsor.paymentData as any).amountPaid && (
                                <div><span className="text-slate-500">Amount Paid:</span> <span className="ml-2 text-green-600">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number((sponsor.paymentData as any).amountPaid))}</span></div>
                            )}
                            {(sponsor.paymentData as any).balanceAmount && (
                                <div><span className="text-slate-500">Balance:</span> <span className="ml-2 text-orange-600">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number((sponsor.paymentData as any).balanceAmount))}</span></div>
                            )}
                            {(sponsor.paymentData as any).paymentMode && (
                                <div><span className="text-slate-500">Payment Mode:</span> <span className="ml-2">{(sponsor.paymentData as any).paymentMode}</span></div>
                            )}
                            {(sponsor.paymentData as any).paymentStatus && (
                                <div><span className="text-slate-500">Status:</span> <span className={`ml-2 font-medium ${(sponsor.paymentData as any).paymentStatus === 'PAID' ? 'text-green-600' : 'text-orange-600'}`}>{(sponsor.paymentData as any).paymentStatus}</span></div>
                            )}
                            {(sponsor.paymentData as any).paymentDueDate && (
                                <div><span className="text-slate-500">Due Date:</span> <span className="ml-2">{new Date((sponsor.paymentData as any).paymentDueDate).toLocaleDateString()}</span></div>
                            )}
                            {(sponsor.paymentData as any).transactionId && (
                                <div><span className="text-slate-500">Transaction ID:</span> <span className="ml-2 font-mono text-xs">{(sponsor.paymentData as any).transactionId}</span></div>
                            )}
                        </div>
                    </div>
                )}

                {/* Branding Online */}
                {sponsor.brandingOnline && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold border-b pb-2">Online Branding</h3>
                        <div className="space-y-2 text-sm">
                            {sponsor.brandingOnline.websiteLogo?.enabled && (
                                <div><span className="text-slate-500">Website Logo:</span> <span className="ml-2">{sponsor.brandingOnline.websiteLogo.placement || 'Enabled'}</span></div>
                            )}
                            {sponsor.brandingOnline.socialMedia?.enabled && (
                                <div><span className="text-slate-500">Social Media:</span> <span className="ml-2">{sponsor.brandingOnline.socialMedia.postCount || 0} posts</span></div>
                            )}
                            {sponsor.brandingOnline.emailCampaign?.enabled && (
                                <div><span className="text-slate-500">Email Campaign:</span> <span className="ml-2">Enabled</span></div>
                            )}
                        </div>
                    </div>
                )}

                {/* Branding Offline */}
                {sponsor.brandingOffline && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold border-b pb-2">Offline Branding</h3>
                        <div className="space-y-2 text-sm">
                            {sponsor.brandingOffline.stageBackdrop && (
                                <div><span className="text-slate-500">Stage Backdrop:</span> <span className="ml-2 text-green-600">✓ Yes</span></div>
                            )}
                            {sponsor.brandingOffline.standee?.enabled && (
                                <div><span className="text-slate-500">Standee:</span> <span className="ml-2">{sponsor.brandingOffline.standee.size || 'Yes'}</span></div>
                            )}
                            {sponsor.brandingOffline.booth?.required && (
                                <div><span className="text-slate-500">Booth:</span> <span className="ml-2">{sponsor.brandingOffline.booth.size || 'Required'}</span></div>
                            )}
                            {sponsor.brandingOffline.banners?.enabled && (
                                <div><span className="text-slate-500">Banners:</span> <span className="ml-2">{sponsor.brandingOffline.banners.count || 0} banners</span></div>
                            )}
                        </div>
                    </div>
                )}

                {/* Event Presence */}
                {sponsor.eventPresence && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold border-b pb-2">Event Presence</h3>
                        <div className="space-y-2 text-sm">
                            {sponsor.eventPresence.boothRequired && (
                                <div><span className="text-slate-500">Booth:</span> <span className="ml-2">{sponsor.eventPresence.boothSize || 'Required'}</span></div>
                            )}
                            {sponsor.eventPresence.staffCount > 0 && (
                                <div><span className="text-slate-500">Staff Count:</span> <span className="ml-2">{sponsor.eventPresence.staffCount}</span></div>
                            )}
                            {sponsor.eventPresence.speakingSlot && sponsor.eventPresence.speakingSlot !== 'NONE' && (
                                <div><span className="text-slate-500">Speaking Slot:</span> <span className="ml-2">{sponsor.eventPresence.speakingSlot}</span></div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-6 flex gap-3">
                <Button onClick={onEdit}>
                    <Edit2 className="w-4 h-4 mr-2" /> Edit Sponsor
                </Button>
                <Button variant="destructive" onClick={onDelete}>
                    <Trash2 className="w-4 h-4 mr-2" /> Delete Sponsor
                </Button>
            </div>
        </div>
    )
}
