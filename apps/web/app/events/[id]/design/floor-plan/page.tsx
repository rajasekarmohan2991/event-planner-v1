
"use client"

import { useState, useRef, useEffect } from 'react'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { Save, Plus, Grid, Circle, Square, Trash2, ZoomIn, ZoomOut, Move, DoorOpen } from 'lucide-react'
import { toast } from 'sonner' // Assuming sonner is installed, or fallback to alert

// Types
type SectionType = 'GRID' | 'TABLE' | 'GA' | 'STAGE' | 'EXIT' | 'ENTRY' | 'RESTROOM' | 'BAR'
type SeatTier = 'STANDARD' | 'VIP' | 'PREMIUM'

interface Section {
  id: string
  name: string
  type: SectionType
  x: number
  y: number
  width: number
  height: number
  price: number
  tier: SeatTier // new field
  // Grid specific
  rows?: number
  cols?: number
  // Table specific
  seatsPerTable?: number
  // GA specific
  capacity?: number
  color: string
}

const SECTION_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#10b981', // emerald
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#64748b', // slate (for facilities)
  '#0f172a', // dark (for stage)
]

const TIER_COLORS: Record<SeatTier, string> = {
  STANDARD: '#3b82f6',
  VIP: '#f59e0b',
  PREMIUM: '#8b5cf6'
}

export default function FloorPlanDesignerPage({ params }: { params: { id: string } }) {
  const [sections, setSections] = useState<Section[]>([])
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)
  const [scale, setScale] = useState(1)
  const [isSaving, setIsSaving] = useState(false)
  const [savedPlans, setSavedPlans] = useState<any[]>([])
  const [activeTool, setActiveTool] = useState<'toolkit' | 'plans'>('toolkit')

  const loadSavedPlans = async () => {
    try {
      const res = await fetch(`/api/events/${params.id}/floor-plans`)
      if (res.ok) {
        const data = await res.json()
        setSavedPlans(data.floorPlans || [])
      }
    } catch { }
  }
  useEffect(() => { loadSavedPlans() }, [params.id])


  const canvasRef = useRef<HTMLDivElement>(null)

  // Load existing plan
  useEffect(() => {
    const loadPlan = async () => {
      try {
        const res = await fetch(`/api/events/${params.id}/seats/generate`)
        if (res.ok) {
          const data = await res.json()
          if (data.floorPlan && data.floorPlan.layoutData && data.floorPlan.layoutData.sections) {
            // Restore sections from visualData if available, or try to infer
            const loadedSections = data.floorPlan.layoutData.sections.map((s: any) => {
              if (s.visualData) {
                return {
                  ...s.visualData,
                  id: s.visualData.id || `section-${Math.random()}`,
                  name: s.name,
                  price: s.basePrice || 100,
                  tier: s.visualData.tier || 'STANDARD'
                }
              }
              // Fallback for inferred
              return {
                id: `section-${Math.random()}`,
                name: s.name,
                type: 'GRID',
                x: 100,
                y: 100,
                width: 200,
                height: 150,
                price: s.basePrice || 100,
                rows: s.rows?.length || 5,
                cols: s.rows?.[0]?.seats || 10,
                color: '#94a3b8',
                tier: 'STANDARD'
              }
            })
            setSections(loadedSections)
          }
        }
      } catch (e) {
        console.error('Failed to load existing plan', e)
        toast.error('Could not load existing floor plan')
      }
    }
    loadPlan()
  }, [params.id])

  const addSection = (type: SectionType) => {
    const isFacility = ['STAGE', 'EXIT', 'ENTRY', 'RESTROOM', 'BAR'].includes(type)
    const baseColor = isFacility ? (type === 'STAGE' ? '#0f172a' : '#64748b') : TIER_COLORS.STANDARD

    const newSection: Section = {
      id: `section-${Date.now()}`,
      name: `New ${type.charAt(0) + type.slice(1).toLowerCase()}`,
      type,
      x: 100,
      y: 100,
      width: type === 'TABLE' ? 120 : (type === 'STAGE' ? 400 : 200),
      height: type === 'TABLE' ? 120 : (type === 'STAGE' ? 150 : 150),
      price: isFacility ? 0 : 100,
      tier: 'STANDARD',
      rows: type === 'GRID' ? 5 : undefined,
      cols: type === 'GRID' ? 10 : undefined,
      seatsPerTable: type === 'TABLE' ? 8 : undefined,
      capacity: type === 'GA' ? 50 : undefined,
      color: baseColor
    }
    setSections([...sections, newSection])
    setSelectedSectionId(newSection.id)
  }

  const updateSection = (id: string, updates: Partial<Section>) => {
    setSections(prev => prev.map(s => {
      if (s.id !== id) return s
      const updated = { ...s, ...updates }

      // Auto-update color based on Tier if not manually overridden by a facility color
      if (updates.tier && !['STAGE', 'EXIT', 'ENTRY', 'RESTROOM', 'BAR'].includes(s.type)) {
        updated.color = TIER_COLORS[updates.tier as SeatTier]
        // Auto price adjustment
        if (updates.tier === 'VIP') updated.price = Math.max(s.price, 500)
        if (updates.tier === 'PREMIUM') updated.price = Math.max(s.price, 250)
      }
      return updated
    }))
  }

  const deleteSection = (id: string) => {
    if (confirm('Are you sure you want to delete this section?')) {
      setSections(prev => prev.filter(s => s.id !== id))
      setSelectedSectionId(null)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const floorPlan = {
        name: `Designed Plan ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
        totalSeats: sections.reduce((acc, s) => {
          if (['STAGE', 'EXIT', 'ENTRY', 'RESTROOM', 'BAR'].includes(s.type)) return acc
          if (s.type === 'GRID') return acc + ((s.rows || 0) * (s.cols || 0))
          if (s.type === 'TABLE') return acc + (s.seatsPerTable || 0)
          if (s.type === 'GA') return acc + (s.capacity || 0)
          return acc
        }, 0),
        sections: sections.map(s => {
          let generatedRows: any[] = []

          // Only generate seat rows for seating sections
          if (!['STAGE', 'EXIT', 'ENTRY', 'RESTROOM', 'BAR'].includes(s.type)) {
            if (s.type === 'GRID') {
              generatedRows = Array.from({ length: s.rows || 0 }).map((_, rIdx) => ({
                number: String.fromCharCode(65 + rIdx),
                seats: s.cols || 10,
                xOffset: s.x,
                yOffset: s.y + (rIdx * 30),
                rowSpacing: 30,
                tier: s.tier
              }))
            } else if (s.type === 'TABLE') {
              generatedRows = [{
                number: s.name,
                seats: s.seatsPerTable || 8,
                xOffset: s.x,
                yOffset: s.y,
                tier: s.tier
              }]
            } else if (s.type === 'GA') {
              generatedRows = [{
                number: 'GA',
                seats: s.capacity || 100,
                xOffset: s.x,
                yOffset: s.y,
                tier: s.tier
              }]
            }
          }

          return {
            name: s.name,
            type: s.type,
            tier: s.tier,
            basePrice: s.price,
            rows: generatedRows,
            visualData: { ...s }
          }
        })
      }

      const res = await fetch(`/api/events/${params.id}/seats/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ floorPlan })
      })

      if (!res.ok) throw new Error('Failed to generate seats')
      const data = await res.json()
      alert('Floor plan saved and seats generated successfully!')
      loadSavedPlans()
      setActiveTool('plans')
    } catch (e: any) {
      alert(`Error saving floor plan: ${e.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  const selectedSection = sections.find(s => s.id === selectedSectionId)

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-slate-50">
        {/* Toolbar */}
        <header className="bg-white border-b px-6 py-3 flex items-center justify-between shadow-sm z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              Venue Designer v2
            </h1>
            <div className="h-6 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-medium w-12 text-center">{Math.round(scale * 100)}%</span>
              <button onClick={() => setScale(s => Math.min(2, s + 0.1))} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={isSaving || sections.length === 0}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              Save Layout & Pricing
            </button>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Palette */}
          <aside className="w-64 bg-white border-r flex flex-col z-10 shadow-sm">
            <div className="flex border-b">
              <button onClick={() => setActiveTool('toolkit')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${activeTool === 'toolkit' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>Designer Tools</button>
              <button onClick={() => setActiveTool('plans')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${activeTool === 'plans' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>Saved Plans</button>
            </div>

            {activeTool === 'toolkit' ? (
              <div className="flex-1 overflow-y-auto p-4 space-y-6">

                <div>
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase mb-3">Seating</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <ToolButton icon={Grid} label="Grid / Rows" onClick={() => addSection('GRID')} />
                    <ToolButton icon={Circle} label="Round Table" onClick={() => addSection('TABLE')} />
                    <ToolButton icon={Square} label="Standing / GA" onClick={() => addSection('GA')} />
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase mb-3">Facilities</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <ToolButton icon={Move} label="Stage" onClick={() => addSection('STAGE')} description="Perfomance Area" />
                    <ToolButton icon={DoorOpen} label="Entry Point" onClick={() => addSection('ENTRY')} />
                    <ToolButton icon={DoorOpen} label="Exit Point" onClick={() => addSection('EXIT')} />
                    <ToolButton icon={Square} label="Restroom" onClick={() => addSection('RESTROOM')} />
                    <ToolButton icon={Square} label="Bar / Food" onClick={() => addSection('BAR')} />
                  </div>
                </div>

              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {savedPlans.length === 0 && <div className="text-center py-8 text-xs text-slate-400">No saved plans found.</div>}
                {savedPlans.map(plan => (
                  <div key={plan.id} className="p-3 border rounded-lg bg-white hover:border-indigo-300 transition-colors group cursor-pointer"
                    onClick={() => {
                      if (confirm('Load this plan? Current unsaved changes will be lost.')) {
                        if (plan.layoutData && plan.layoutData.sections) {
                          // Logic to restore (simplified)
                          setSections(plan.layoutData.sections.map((s: any) => ({ ...s.visualData, id: s.visualData?.id || Math.random().toString() })))
                        }
                      }
                    }}
                  >
                    <div className="font-medium text-sm truncate">{plan.planName}</div>
                    <div className="text-xs text-slate-500 mt-1">{plan.totalSeats || 0} Seats</div>
                  </div>
                ))}
              </div>
            )}

            {/* Section List */}
            <div className="flex-1 overflow-y-auto p-4 border-t bg-slate-50/50">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Layers ({sections.length})</h2>
              <div className="space-y-1">
                {sections.map(s => (
                  <div key={s.id} onClick={() => setSelectedSectionId(s.id)}
                    className={`flex items-center gap-2 p-2 rounded text-xs cursor-pointer ${selectedSectionId === s.id ? 'bg-indigo-100 text-indigo-700 font-medium' : 'hover:bg-slate-100'}`}
                  >
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="truncate flex-1">{s.name}</span>
                    <span className="text-[10px] text-slate-400">{s.tier}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Canvas */}
          <div className="flex-1 bg-slate-100 overflow-hidden relative">
            <div className="absolute inset-0 overflow-auto">
              <div
                ref={canvasRef}
                className="relative min-w-[2000px] min-h-[2000px] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px]"
                style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}
                onClick={() => setSelectedSectionId(null)}
              >
                {sections.map(section => (
                  <DraggableSection
                    key={section.id}
                    section={section}
                    isSelected={selectedSectionId === section.id}
                    onSelect={() => setSelectedSectionId(section.id)}
                    onMove={(x, y) => updateSection(section.id, { x, y })}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Properties Panel */}
          {selectedSection ? (
            <aside className="w-80 bg-white border-l p-4 overflow-y-auto animate-in slide-in-from-right duration-200 z-10 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-slate-900 border-b-2 border-indigo-500 pb-1">Edit {selectedSection.type}</h2>
                <button onClick={() => deleteSection(selectedSection.id)} className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Name/Label</label>
                  <input type="text" value={selectedSection.name} onChange={e => updateSection(selectedSection.id, { name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:border-indigo-500" />
                </div>

                {/* Pricing / Tiers for Seats */}
                {!['STAGE', 'EXIT', 'ENTRY', 'RESTROOM', 'BAR'].includes(selectedSection.type) && (
                  <div className="space-y-4 border-t pt-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500 uppercase">Pricing Tier</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['STANDARD', 'VIP', 'PREMIUM'] as SeatTier[]).map(t => (
                          <button
                            key={t}
                            onClick={() => updateSection(selectedSection.id, { tier: t })}
                            className={`px-2 py-2 text-xs font-bold rounded border ${selectedSection.tier === t ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500 uppercase">Price per Seat (₹)</label>
                      <input type="number" value={selectedSection.price} onChange={e => updateSection(selectedSection.id, { price: Number(e.target.value) })}
                        className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:border-indigo-500" />
                    </div>
                  </div>
                )}

                {/* Specific Props */}
                {selectedSection.type === 'GRID' && (
                  <div className="space-y-4 border-t pt-4">
                    <h4 className="text-xs font-bold text-slate-900">Grid Dimensions</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5"><label className="text-xs text-slate-500">Rows</label>
                        <input type="number" min="1" value={selectedSection.rows} onChange={e => updateSection(selectedSection.id, { rows: Number(e.target.value) })} className="w-full border p-1 rounded" />
                      </div>
                      <div className="space-y-1.5"><label className="text-xs text-slate-500">Cols</label>
                        <input type="number" min="1" value={selectedSection.cols} onChange={e => updateSection(selectedSection.id, { cols: Number(e.target.value) })} className="w-full border p-1 rounded" />
                      </div>
                    </div>
                    <div className="text-xs text-right text-slate-400">Total: {((selectedSection.rows || 1) * (selectedSection.cols || 1))} seats</div>
                  </div>
                )}

                {selectedSection.type === 'TABLE' && (
                  <div className="space-y-4 border-t pt-4">
                    <div className="space-y-1.5"><label className="text-xs text-slate-500">Seats per Table</label>
                      <input type="number" min="1" value={selectedSection.seatsPerTable} onChange={e => updateSection(selectedSection.id, { seatsPerTable: Number(e.target.value) })} className="w-full border p-1 rounded" />
                    </div>
                  </div>
                )}

                {selectedSection.type === 'GA' && (
                  <div className="space-y-4 border-t pt-4">
                    <div className="space-y-1.5"><label className="text-xs text-slate-500">Total Capacity</label>
                      <input type="number" min="1" value={selectedSection.capacity} onChange={e => updateSection(selectedSection.id, { capacity: Number(e.target.value) })} className="w-full border p-1 rounded" />
                    </div>
                  </div>
                )}

              </div>
            </aside>
          ) : (
            <aside className="w-80 bg-white border-l flex flex-col items-center justify-center text-center text-slate-400 p-8">
              <Move className="w-12 h-12 mb-4 opacity-20" />
              <p>Select an element to edit</p>
            </aside>
          )}
        </div>
      </div>
    </DndProvider>
  )
}

function ToolButton({ icon: Icon, label, onClick, description }: { icon: any, label: string, onClick: () => void, description?: string }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center justify-center p-3 border rounded-xl hover:bg-slate-50 hover:border-indigo-300 transition-all text-center h-20 group bg-white shadow-sm">
      <Icon className="w-5 h-5 mb-1 text-slate-600 group-hover:text-indigo-600" />
      <div className="text-[10px] font-bold text-slate-900">{label}</div>
    </button>
  )
}

function DraggableSection({ section, isSelected, onSelect, onMove }: { section: Section, isSelected: boolean, onSelect: () => void, onMove: (x: number, y: number) => void }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'section',
    item: { id: section.id, x: section.x, y: section.y },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
    end: (item, monitor) => {
      const delta = monitor.getDifferenceFromInitialOffset()
      if (delta && item) {
        onMove(Math.round(item.x + delta.x), Math.round(item.y + delta.y))
      }
    },
  }), [section.x, section.y])

  // Visuals
  const renderVisuals = () => {
    switch (section.type) {
      case 'GRID':
        return <div className="grid gap-[2px] w-full h-full p-2" style={{ gridTemplateColumns: `repeat(${section.cols || 5}, 1fr)` }}>
          {Array.from({ length: Math.min(100, (section.rows || 5) * (section.cols || 5)) }).map((_, i) => <div key={i} className="bg-current opacity-30 rounded-[1px]" />)}
        </div>
      case 'TABLE':
        return <div className="w-full h-full flex items-center justify-center relative"><div className="w-1/2 h-1/2 rounded-full border-2 border-current opacity-50" /></div>
      case 'GA':
        return <div className="w-full h-full flex items-center justify-center border-dashed border-2 border-current opacity-30 rounded"><span className="font-bold opacity-50">GA</span></div>
      case 'STAGE':
        return <div className="w-full h-full bg-slate-900 text-white flex items-center justify-center font-bold tracking-widest text-lg rounded-b-3xl shadow-xl">STAGE</div>
      case 'EXIT':
        return <div className="w-full height-full bg-red-100 border-2 border-red-500 text-red-700 flex items-center justify-center font-bold">EXIT</div>
      case 'ENTRY':
        return <div className="w-full height-full bg-green-100 border-2 border-green-500 text-green-700 flex items-center justify-center font-bold">ENTRY</div>
      case 'RESTROOM':
        return <div className="w-full height-full bg-blue-50 border-2 border-blue-400 text-blue-700 flex items-center justify-center text-xs font-bold">RESTROOM</div>
      case 'BAR':
        return <div className="w-full height-full bg-purple-50 border-2 border-purple-400 text-purple-700 flex items-center justify-center text-xs font-bold">BAR</div>
      default: return null
    }
  }

  return (
    <div
      ref={drag as any}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      className={`absolute rounded shadow-lg cursor-move transition-all overflow-hidden bg-white
                ${isSelected ? 'ring-2 ring-indigo-500 z-30 shadow-xl' : 'ring-1 ring-slate-200 z-10'}
                ${isDragging ? 'opacity-50' : 'opacity-100'}
            `}
      style={{
        left: section.x, top: section.y, width: section.width, height: section.height,
        color: section.color || '#333'
      }}
    >
      {/* Label */}
      {!['STAGE'].includes(section.type) && <div className="absolute top-0 left-0 right-0 bg-white/90 text-[9px] font-bold px-1 py-0.5 truncate border-b z-10">{section.name} {section.tier !== 'STANDARD' && <span className="text-indigo-600">({section.tier})</span>}</div>}
      <div className="w-full h-full pt-4">{renderVisuals()}</div>

      {isSelected && <div className="absolute bottom-0 right-0 w-3 h-3 bg-indigo-500 rounded-tl cursor-se-resize" />}
    </div>
  )
}
