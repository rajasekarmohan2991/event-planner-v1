'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Sparkles, Wand2, CheckCircle2, Upload, ImageIcon, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface AIFloorPlanGeneratorProps {
    eventId: string
    onFloorPlanGenerated: (floorPlan: any) => void
}

export default function AIFloorPlanGenerator({ eventId, onFloorPlanGenerated }: AIFloorPlanGeneratorProps) {
    const [prompt, setPrompt] = useState('')
    const [image, setImage] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [suggestions, setSuggestions] = useState<string[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)

    const examplePrompts = [
        "Create a wedding reception layout for 200 guests with 20 round tables of 10 seats each, a stage at the front, and a dance floor in the center",
        "Design a conference hall with 300 seats in theater style, a main stage, and VIP section with 50 premium seats in the front rows",
        "Set up a corporate event with 150 attendees, 15 round tables of 10 seats, a presentation area, and networking zones",
        "Create a gala dinner setup for 180 guests with 18 round tables, a head table for 12 VIPs, and a performance stage",
        "Design a classroom-style seating for 100 people with 10 rows of 10 seats each, facing a presentation screen"
    ]

    const handleGenerate = async () => {
        if (!prompt.trim() && !image) {
            setError('Please describe your requirements or upload an image')
            return
        }

        setLoading(true)
        setError(null)

        try {
            const response = await fetch(`/api/events/${eventId}/floor-plan/ai-generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, image })
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

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            // Check size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setError("Image size too large. Max 5MB.")
                return
            }

            const reader = new FileReader()
            reader.onloadend = () => {
                setImage(reader.result as string)
                setError(null)
            }
            reader.readAsDataURL(file)
        }
    }

    const clearImage = () => {
        setImage(null)
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
                                Describe your event layout or upload a venue photo, and AI will digitize it for you
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            <Tabs defaultValue="text" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="text">Text Description</TabsTrigger>
                    <TabsTrigger value="image">Upload Image (Beta)</TabsTrigger>
                </TabsList>

                {/* Text Generation Tab */}
                <TabsContent value="text">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Wand2 className="h-5 w-5 text-purple-600" />
                                Describe Your Floor Plan
                            </CardTitle>
                            <CardDescription>
                                Tell us about your event: number of guests, seating arrangement, special areas.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Example: Create a wedding layout for 200 guests with 20 round tables..."
                                className="min-h-[150px] text-base"
                                disabled={loading}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Image Upload Tab */}
                <TabsContent value="image">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <ImageIcon className="h-5 w-5 text-blue-600" />
                                Upload Venue Plan
                            </CardTitle>
                            <CardDescription>
                                Upload a photo or diagram of the venue. We'll identify zones and seats.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {!image ? (
                                <div
                                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 cursor-pointer transition-colors"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                                    <p className="text-sm font-medium text-gray-700">Click to upload or drag and drop</p>
                                    <p className="text-xs text-gray-500 mt-1">JPG, PNG up to 5MB</p>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                    />
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="relative rounded-lg overflow-hidden border border-gray-200 aspect-video bg-gray-100 flex items-center justify-center">
                                        <img src={image} alt="Preview" className="max-h-full object-contain" />
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            className="absolute top-2 right-2 h-8 w-8 p-0"
                                            onClick={clearImage}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground text-center">
                                        AI will analyze this image to recreate the layout.
                                    </p>
                                </div>
                            )}

                            <div className="space-y-2">
                                <p className="text-sm font-medium">Additional Instructions (Optional)</p>
                                <Textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="E.g., Make the center block VIP..."
                                    className="h-20"
                                    disabled={loading}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                </div>
            )}

            <Button
                onClick={handleGenerate}
                disabled={loading || (!prompt.trim() && !image)}
                size="lg"
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-md hover:shadow-lg transition-all"
            >
                {loading ? (
                    <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Generating Layout...
                    </>
                ) : (
                    <>
                        <Sparkles className="h-5 w-5 mr-2" />
                        {image ? "Analyze & Generate Layout" : "Generate Floor Plan"}
                    </>
                )}
            </Button>

            {/* Example Prompts (Hide if Image tab is active? Or keep for reference) */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Example Text Prompts</CardTitle>
                    <CardDescription>
                        Try these for text-based generation
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
        </div>
    )
}
