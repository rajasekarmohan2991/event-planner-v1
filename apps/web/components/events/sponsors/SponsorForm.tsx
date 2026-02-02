'use client'

import { useState } from 'react'
import { ComprehensiveSponsor } from '@/types/sponsor'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Check, ChevronRight } from 'lucide-react'

// Sections
import BasicInfo from './sections/BasicInfo'
import ContactPayment from './sections/ContactPayment'
import Branding from './sections/Branding'
import EventPresenceSection from './sections/EventPresence'
import MiscSection from './sections/Misc'

interface SponsorFormProps {
    initialData?: Partial<ComprehensiveSponsor>
    onSubmit: (data: Partial<ComprehensiveSponsor>) => Promise<void>
    onCancel: () => void
    loading?: boolean
}

const STEPS = [
    { id: 1, title: 'Basic Info', component: BasicInfo },
    { id: 2, title: 'Contact & Payment', component: ContactPayment },
    { id: 3, title: 'Branding', component: Branding },
    { id: 4, title: 'Event Presence', component: EventPresenceSection },
    { id: 5, title: 'More Details', component: MiscSection },
]

export default function SponsorForm({ initialData = {}, onSubmit, onCancel, loading }: SponsorFormProps) {
    const [currentStep, setCurrentStep] = useState(1)
    const [formData, setFormData] = useState<Partial<ComprehensiveSponsor>>(initialData)

    const updateData = (key: keyof ComprehensiveSponsor, value: any) => {
        setFormData(prev => ({ ...prev, [key]: value }))
    }

    const handleNext = () => {
        if (currentStep < STEPS.length) {
            setCurrentStep(prev => prev + 1)
        }
    }

    const handlePrev = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1)
        }
    }

    const handleSave = async () => {
        await onSubmit(formData)
    }

    const CurrentComponent = STEPS[currentStep - 1].component

    return (
        <div className="space-y-6">
            {/* Stepper */}
            <div className="flex items-center justify-between px-2">
                {STEPS.map((step, index) => {
                    const isActive = step.id === currentStep
                    const isCompleted = step.id < currentStep
                    return (
                        <div key={step.id} className="flex items-center">
                            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${isActive ? 'border-indigo-600 bg-indigo-600 text-white' :
                                    isCompleted ? 'border-emerald-500 bg-emerald-500 text-white' :
                                        'border-slate-300 text-slate-500'
                                }`}>
                                {isCompleted ? <Check className="w-4 h-4" /> : step.id}
                            </div>
                            <span className={`ml-2 text-sm hidden md:block ${isActive ? 'font-semibold text-indigo-600' : 'text-slate-500'}`}>
                                {step.title}
                            </span>
                            {index < STEPS.length - 1 && (
                                <div className="w-8 h-[2px] mx-2 bg-slate-200 hidden md:block" />
                            )}
                        </div>
                    )
                })}
            </div>

            <Card>
                <CardContent className="pt-6">
                    <CurrentComponent data={formData} updateData={updateData} />
                </CardContent>
            </Card>

            <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={currentStep === 1 ? onCancel : handlePrev}>
                    {currentStep === 1 ? 'Cancel' : 'Previous'}
                </Button>

                <div className="space-x-2">
                    {currentStep < STEPS.length ? (
                        <Button onClick={handleNext}>
                            Next <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                    ) : (
                        <Button onClick={handleSave} disabled={loading}>
                            {loading ? 'Saving...' : 'Complete & Save'}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
