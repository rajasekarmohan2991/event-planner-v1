import { ComprehensiveSponsor, EventPresence } from '@/types/sponsor'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'

interface EventPresenceProps {
    data: Partial<ComprehensiveSponsor>
    updateData: (key: keyof ComprehensiveSponsor, value: any) => void
}

export default function EventPresenceSection({ data, updateData }: EventPresenceProps) {
    const presence = data.eventPresence || {} as EventPresence

    const updatePresence = (key: keyof EventPresence, value: any) => {
        updateData('eventPresence', { ...presence, [key]: value })
    }

    return (
        <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
                {/* Booth */}
                <div className="space-y-4 border p-4 rounded-md">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="boothRequired"
                            checked={presence.boothRequired || false}
                            onCheckedChange={(c) => updatePresence('boothRequired', c)}
                        />
                        <Label htmlFor="boothRequired" className="font-semibold">Booth / Stall Required</Label>
                    </div>
                    {presence.boothRequired && (
                        <div className="space-y-2">
                            <Label>Booth Size / Details</Label>
                            <Input
                                placeholder="e.g. 3x3m shell scheme"
                                value={presence.boothSize || ''}
                                onChange={(e) => updatePresence('boothSize', e.target.value)}
                            />
                        </div>
                    )}
                </div>

                {/* Staff */}
                <div className="space-y-4 border p-4 rounded-md">
                    <Label>Number of Staff Attending</Label>
                    <Input
                        type="number"
                        value={presence.staffCount || 0}
                        onChange={(e) => updatePresence('staffCount', parseInt(e.target.value))}
                    />
                    <p className="text-xs text-muted-foreground">For badges and catering</p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Speaking */}
                <div className="space-y-4">
                    <Label>Speaking Opportunity</Label>
                    <Select
                        value={presence.speakingSlot}
                        onValueChange={(v: any) => updatePresence('speakingSlot', v)}
                    >
                        <SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="NONE">None</SelectItem>
                            <SelectItem value="KEYNOTE">Keynote Speech</SelectItem>
                            <SelectItem value="PANEL">Panel Discussion</SelectItem>
                            <SelectItem value="WORKSHOP">Workshop</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Other Activities */}
                <div className="space-y-4 pt-6">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="productLaunch"
                            checked={presence.productLaunch || false}
                            onCheckedChange={(c) => updatePresence('productLaunch', c)}
                        />
                        <Label htmlFor="productLaunch">Product Launch</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="productDemo"
                            checked={presence.productDemo || false}
                            onCheckedChange={(c) => updatePresence('productDemo', c)}
                        />
                        <Label htmlFor="productDemo">Product Demo Zone</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="stageMentions"
                            checked={presence.stageMentions || false}
                            onCheckedChange={(c) => updatePresence('stageMentions', c)}
                        />
                        <Label htmlFor="stageMentions">Stage Mentions by Host</Label>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <Label>Special Setup Requirements</Label>
                <Textarea
                    rows={3}
                    placeholder="Power, internet, furniture needs..."
                    value={presence.setupRequirements || ''}
                    onChange={(e) => updatePresence('setupRequirements', e.target.value)}
                />
            </div>
        </div>
    )
}
