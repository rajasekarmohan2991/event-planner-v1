import { ComprehensiveSponsor } from '@/types/sponsor'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface BasicInfoProps {
    data: Partial<ComprehensiveSponsor>
    updateData: (key: keyof ComprehensiveSponsor, value: any) => void
}

export default function BasicInfo({ data, updateData }: BasicInfoProps) {
    return (
        <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Company Name *</Label>
                    <Input
                        id="name"
                        value={data.name || ''}
                        onChange={(e) => updateData('name', e.target.value)}
                        placeholder="e.g., Tech Solutions Inc."
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="amount">Contribution Amount (₹) *</Label>
                    <Input
                        id="amount"
                        type="number"
                        value={data.amount || ''}
                        onChange={(e) => updateData('amount', Number(e.target.value))}
                        placeholder="e.g., 500000"
                    />
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="tier">Sponsor Tier *</Label>
                    <Select
                        value={data.tier}
                        onValueChange={(value) => updateData('tier', value)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select Tier" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="PLATINUM">Platinum</SelectItem>
                            <SelectItem value="GOLD">Gold</SelectItem>
                            <SelectItem value="SILVER">Silver</SelectItem>
                            <SelectItem value="BRONZE">Bronze</SelectItem>
                            <SelectItem value="PARTNER">Partner</SelectItem>
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">This is usually auto-calculated based on amount, but can be overridden.</p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                        id="website"
                        value={data.website || ''}
                        onChange={(e) => updateData('website', e.target.value)}
                        placeholder="https://example.com"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="logoUrl">Logo URL</Label>
                <div className="flex gap-2">
                    <Input
                        id="logoUrl"
                        value={data.logoUrl || ''}
                        onChange={(e) => updateData('logoUrl', e.target.value)}
                        placeholder="https://..."
                        className="flex-1"
                    />
                    {/* File upload would replace this in a real scenario, handled by parent or separate component */}
                </div>
                {data.logoUrl && (
                    <div className="mt-2 border rounded p-2 w-fit">
                        <img src={data.logoUrl} alt="Logo Preview" className="h-12 object-contain" />
                    </div>
                )}
            </div>
        </div>
    )
}
