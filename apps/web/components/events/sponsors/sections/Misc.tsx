import { ComprehensiveSponsor, GiveawayData, LegalData, TimelineData, PostEventData } from '@/types/sponsor'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'

interface MiscProps {
    data: Partial<ComprehensiveSponsor>
    updateData: (key: keyof ComprehensiveSponsor, value: any) => void
}

export default function MiscSection({ data, updateData }: MiscProps) {
    const giveaways = data.giveawayData || {} as GiveawayData
    const legal = data.legalData || {} as LegalData
    const timeline = data.timelineData || {} as TimelineData
    const postEvent = data.postEventData || {} as PostEventData

    const updateGiveaways = (key: keyof GiveawayData, value: any) => updateData('giveawayData', { ...giveaways, [key]: value })
    const updateLegal = (key: keyof LegalData, value: any) => updateData('legalData', { ...legal, [key]: value })
    const updateTimeline = (key: keyof TimelineData, value: any) => updateData('timelineData', { ...timeline, [key]: value })
    const updatePostEvent = (key: keyof PostEventData, value: any) => updateData('postEventData', { ...postEvent, [key]: value })

    return (
        <div className="space-y-10">

            {/* Giveaways */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium border-b pb-2">Giveaways & Merchandise</h3>
                <div className="grid md:grid-cols-2 gap-4">
                    {/* Type */}
                    <div className="space-y-2">
                        <Label>Type</Label>
                        <Select value={giveaways.type} onValueChange={(v: any) => updateGiveaways('type', v)}>
                            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="NONE">None</SelectItem>
                                <SelectItem value="COUPONS">Coupons / Vouchers</SelectItem>
                                <SelectItem value="PRODUCTS">Samples / Products</SelectItem>
                                <SelectItem value="MERCHANDISE">Branded Merch</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {giveaways.type && giveaways.type !== 'NONE' && (
                        <>
                            <div className="space-y-2">
                                <Label>Quantity</Label>
                                <Input type="number" value={giveaways.quantity || 0} onChange={(e) => updateGiveaways('quantity', parseInt(e.target.value))} />
                            </div>
                            <div className="space-y-2">
                                <Label>Distribution Method</Label>
                                <Select value={giveaways.distributionMethod} onValueChange={(v: any) => updateGiveaways('distributionMethod', v)}>
                                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="WELCOME_KIT">Welcome Kit</SelectItem>
                                        <SelectItem value="LUCKY_DRAW">Lucky Draw</SelectItem>
                                        <SelectItem value="BOOTH">At Booth</SelectItem>
                                        <SelectItem value="OTHER">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Timeline */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium border-b pb-2">Key Deadlines</h3>
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Logo Submission Deadline</Label>
                        <Input type="date" value={timeline.logoSubmissionDeadline || ''} onChange={(e) => updateTimeline('logoSubmissionDeadline', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Payment Due Date</Label>
                        <Input type="date" value={timeline.paymentDueDate || ''} onChange={(e) => updateTimeline('paymentDueDate', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Setup Date</Label>
                        <Input type="date" value={timeline.setupDate || ''} onChange={(e) => updateTimeline('setupDate', e.target.value)} />
                    </div>
                </div>
            </div>

            {/* Legal */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium border-b pb-2">Legal & Compliance</h3>
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                        <Checkbox checked={legal.contractSigned || false} onCheckedChange={(c) => updateLegal('contractSigned', c)} />
                        <Label>Contract Signed</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox checked={legal.ndaRequired || false} onCheckedChange={(c) => updateLegal('ndaRequired', c)} />
                        <Label>NDA Required</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox checked={legal.logoUsageApproval || false} onCheckedChange={(c) => updateLegal('logoUsageApproval', c)} />
                        <Label>Logo Usage Approved</Label>
                    </div>
                    <div className="space-y-2 col-span-2">
                        <Label>Contract URL / Link</Label>
                        <Input value={legal.contractUrl || ''} onChange={(e) => updateLegal('contractUrl', e.target.value)} placeholder="https://drive..." />
                    </div>
                </div>
            </div>

            {/* Post Event */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium border-b pb-2">Post Event Commitments</h3>
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                        <Checkbox checked={postEvent.leadsReportRequired || false} onCheckedChange={(c) => updatePostEvent('leadsReportRequired', c)} />
                        <Label>Leads Report Required</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox checked={postEvent.photoVideoAccess || false} onCheckedChange={(c) => updatePostEvent('photoVideoAccess', c)} />
                        <Label>Photo/Video Access</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox checked={postEvent.performanceReportRequired || false} onCheckedChange={(c) => updatePostEvent('performanceReportRequired', c)} />
                        <Label>Performance Report</Label>
                    </div>
                </div>
            </div>

        </div>
    )
}
