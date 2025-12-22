'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Sparkles, Wand2, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface AIFloorPlanGeneratorProps {
    eventId: string
    onFloorPlanGenerated: (floorPlan: any) => void
}

export default function AIFloorPlanGenerator({ eventId, onFloorPlanGenerated }: AIFloorPlanGeneratorProps) {
    const [prompt, setPrompt] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [suggestions, setSuggestions] = useState<string[]>([])

    const examplePrompts = [
        "Create a wedding reception layout for 200 guests with 20 round tables of 10 seats each, a stage at the front, and a dance floor in the center",
        "Design a conference hall with 300 seats in theater style, a main stage, and VIP section with 50 premium seats in the front rows",
        "Set up a corporate event with 150 attendees, 15 round tables of 10 seats, a presentation area, and networking zones",
        "Create a gala dinner setup for 180 guests with 18 round tables, a head table for 12 VIPs, and a performance stage",
        "Design a classroom-style seating for 100 people with 10 rows of 10 seats each, facing a presentation screen"
    ]

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('Please describe your floor plan requirements')
            return
        }

        setLoading(true)
        setError(null)

        try {
            const response = await fetch(`/api/events/${eventId}/floor-plan/ai-generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to generate floor plan')
            }

            const data = await response.json()

            // Show suggestions for improvements
            if (data.suggestions) {
                setSuggestions(data.suggestions)
            }

            // Notify parent component
            onFloorPlanGenerated(data.floorPlan)

        } catch (err: any) {
            console.error('AI generation error:', err)
            setError(err.message || 'Failed to generate floor plan')
        } finally {
            setLoading(false)
        }
    }

    const useExamplePrompt = (example: string) => {
        setPrompt(example)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-600 rounded-lg">
                            <Sparkles className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl">AI Floor Plan Generator</CardTitle>
                            <CardDescription className="text-base">
                                Describe your event layout in natural language, and AI will create it for you
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Main Input */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Wand2 className="h-5 w-5 text-purple-600" />
                        Describe Your Floor Plan
                    </CardTitle>
                    <CardDescription>
                        Tell us about your event: number of guests, seating arrangement, special areas, etc.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Example: Create a wedding layout for 200 guests with 20 round tables of 10 seats each, a stage at the front, and a dance floor in the center..."
                        className="min-h-[150px] text-base"
                        disabled={loading}
                    />

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <Button
                        onClick={handleGenerate}
                        disabled={loading || !prompt.trim()}
                        size="lg"
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                Generating Floor Plan...
                            </>
                        ) : (
                            <>
                                <Sparkles className="h-5 w-5 mr-2" />
                                Generate Floor Plan with AI
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* Example Prompts */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Example Prompts</CardTitle>
                    <CardDescription>
                        Click any example to use it as a starting point
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {examplePrompts.map((example, index) => (
                        <button
                            key={index}
                            onClick={() => useExamplePrompt(example)}
                            className="w-full text-left p-4 border rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors"
                            disabled={loading}
                        >
                            <div className="flex items-start gap-3">
                                <Badge variant="outline" className="mt-1">
                                    Example {index + 1}
                                </Badge>
                                <p className="text-sm text-gray-700">{example}</p>
                            </div>
                        </button>
                    ))}
                </CardContent>
            </Card>

            {/* Suggestions */}
            {suggestions.length > 0 && (
                <Card className="border-green-200 bg-green-50">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2 text-green-800">
                            <CheckCircle2 className="h-5 w-5" />
                            AI Suggestions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            {suggestions.map((suggestion, index) => (
                                <li key={index} className="flex items-start gap-2 text-sm text-green-700">
                                    <span className="text-green-600 mt-0.5">•</span>
                                    <span>{suggestion}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}

            {/* Tips */}
            <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                    <CardTitle className="text-lg text-blue-800">💡 Tips for Best Results</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-2 text-sm text-blue-700">
                        <li className="flex items-start gap-2">
                            <span className="text-blue-600 mt-0.5">•</span>
                            <span><strong>Be specific:</strong> Mention exact numbers (e.g., "200 guests", "20 tables")</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-blue-600 mt-0.5">•</span>
                            <span><strong>Include layout type:</strong> Round tables, theater style, classroom, etc.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-blue-600 mt-0.5">•</span>
                            <span><strong>Mention special areas:</strong> Stage, dance floor, VIP section, buffet area</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-blue-600 mt-0.5">•</span>
                            <span><strong>Specify tiers:</strong> VIP, Premium, General seating if applicable</span>
                        </li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    )
}
