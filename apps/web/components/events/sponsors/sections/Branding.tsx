import { ComprehensiveSponsor, BrandingOnline, BrandingOffline } from '@/types/sponsor'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

interface BrandingProps {
    data: Partial<ComprehensiveSponsor>
    updateData: (key: keyof ComprehensiveSponsor, value: any) => void
}

export default function Branding({ data, updateData }: BrandingProps) {
    const online = data.brandingOnline || { websiteLogo: {}, socialMedia: {}, emailCampaign: {} } as BrandingOnline
    const offline = data.brandingOffline || { standee: {}, booth: {}, banners: {} } as BrandingOffline

    const updateOnline = (key: keyof BrandingOnline, value: any) => {
        updateData('brandingOnline', { ...online, [key]: value })
    }

    const updateOffline = (key: keyof BrandingOffline, value: any) => {
        updateData('brandingOffline', { ...offline, [key]: value })
    }

    return (
        <div className="space-y-8">
            {/* Online Branding */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium border-b pb-2">Online Branding</h3>

                {/* Website Logo */}
                <div className="space-y-3 border p-4 rounded-md">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="websiteLogo"
                            checked={online.websiteLogo?.enabled || false}
                            onCheckedChange={(c) => updateOnline('websiteLogo', { ...online.websiteLogo, enabled: c })}
                        />
                        <Label htmlFor="websiteLogo" className="font-semibold">Website Logo Placement</Label>
                    </div>
                    {online.websiteLogo?.enabled && (
                        <div className="ml-6 grid md:grid-cols-2 gap-4">
                            <div>
                                <Label>Placement</Label>
                                <Select
                                    value={online.websiteLogo.placement}
                                    onValueChange={(v) => updateOnline('websiteLogo', { ...online.websiteLogo, placement: v })}
                                >
                                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="HEADER">Header</SelectItem>
                                        <SelectItem value="FOOTER">Footer</SelectItem>
                                        <SelectItem value="SPONSORS_PAGE">Sponsors Page Only</SelectItem>
                                        <SelectItem value="ALL">All Pages</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}
                </div>

                {/* Social Media */}
                <div className="space-y-3 border p-4 rounded-md">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="socialMedia"
                            checked={online.socialMedia?.enabled || false}
                            onCheckedChange={(c) => updateOnline('socialMedia', { ...online.socialMedia, enabled: c })}
                        />
                        <Label htmlFor="socialMedia" className="font-semibold">Social Media Promotion</Label>
                    </div>
                    {online.socialMedia?.enabled && (
                        <div className="ml-6 grid md:grid-cols-2 gap-4">
                            <div>
                                <Label>Post Count</Label>
                                <Input
                                    type="number"
                                    value={online.socialMedia.postCount || 0}
                                    onChange={(e) => updateOnline('socialMedia', { ...online.socialMedia, postCount: parseInt(e.target.value) })}
                                />
                            </div>
                            {/* Platforms could be a multi-select, kept simple for now */}
                        </div>
                    )}
                </div>

                {/* Email Campaign */}
                <div className="space-y-3 border p-4 rounded-md">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="emailCampaign"
                            checked={online.emailCampaign?.enabled || false}
                            onCheckedChange={(c) => updateOnline('emailCampaign', { ...online.emailCampaign, enabled: c })}
                        />
                        <Label htmlFor="emailCampaign" className="font-semibold">Email Campaign Mentions</Label>
                    </div>
                    {online.emailCampaign?.enabled && (
                        <div className="ml-6">
                            <Label>Mention Count</Label>
                            <Input
                                type="number"
                                value={online.emailCampaign.mentionCount || 0}
                                onChange={(e) => updateOnline('emailCampaign', { ...online.emailCampaign, mentionCount: parseInt(e.target.value) })}
                                className="w-full md:w-1/2"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Offline Branding */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium border-b pb-2">Offline Branding</h3>

                <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2 border p-3 rounded">
                        <Checkbox
                            id="stageBackdrop"
                            checked={offline.stageBackdrop || false}
                            onCheckedChange={(c) => updateOffline('stageBackdrop', c)}
                        />
                        <Label htmlFor="stageBackdrop">Stage Backdrop Logo</Label>
                    </div>

                    <div className="flex items-center space-x-2 border p-3 rounded">
                        <Checkbox
                            id="entryGate"
                            checked={offline.entryGateBranding || false}
                            onCheckedChange={(c) => updateOffline('entryGateBranding', c)}
                        />
                        <Label htmlFor="entryGate">Entry Gate Branding</Label>
                    </div>
                </div>

                <div className="space-y-3 border p-4 rounded-md">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="standee"
                            checked={offline.standee?.enabled || false}
                            onCheckedChange={(c) => updateOffline('standee', { ...offline.standee, enabled: c })}
                        />
                        <Label htmlFor="standee" className="font-semibold">Standee / Banner Space</Label>
                    </div>
                    {offline.standee?.enabled && (
                        <div className="ml-6">
                            <Label>Size Details</Label>
                            <Input
                                placeholder="e.g. 6x3 ft"
                                value={offline.standee.size || ''}
                                onChange={(e) => updateOffline('standee', { ...offline.standee, size: e.target.value })}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
