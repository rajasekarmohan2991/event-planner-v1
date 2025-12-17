
"use client"

import { useState, useRef, useEffect } from 'react'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { Save, Plus, Grid, Circle, Square, Trash2, ZoomIn, ZoomOut, Move } from 'lucide-react'
import { toast } from 'sonner' // Assuming sonner is installed, or fallback to alert

// Types
type SectionType = 'GRID' | 'TABLE' | 'GA'

interface Section {
  id: string
  name: string
  type: SectionType
  x: number
  y: number
  width: number
  height: number
  price: number
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
]

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
                  id: s.visualData.id || `section-${Math.random()}`, // Fallback ID
                  name: s.name,
                  type: s.visualData.type || s.type || 'GRID',
                  x: s.visualData.x || 100,
                  y: s.visualData.y || 100,
                  width: s.visualData.width || 200,
                  height: s.visualData.height || 150,
                  price: s.basePrice || 100,
                  color: s.visualData.color || '#6366f1',
                  // Restore properties
                  rows: s.type === 'GRID' ? (s.rows?.length || 5) : undefined,
                  cols: s.type === 'GRID' ? (s.rows?.[0]?.seats || 10) : undefined,
                  seatsPerTable: s.type === 'TABLE' ? (s.rows?.[0]?.seats || 8) : undefined,
                  capacity: s.type === 'GA' ? (s.rows?.[0]?.seats || 100) : undefined,
                }
              }
              // Fallback for plans created outside this designer (e.g. via API directly)
              return {
                id: `section-${Math.random()}`,
                name: s.name,
                type: 'GRID', // Default to grid
                x: 100,
                y: 100,
                width: 200,
                height: 150,
                price: s.basePrice || 100,
                rows: s.rows?.length || 5,
                cols: s.rows?.[0]?.seats || 10,
                color: '#94a3b8'
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
    const newSection: Section = {
      id: `section-${Date.now()}`,
      name: `New ${type === 'GRID' ? 'Seating' : type === 'TABLE' ? 'Table' : 'Area'}`,
      type,
      x: 100,
      y: 100,
      width: type === 'TABLE' ? 120 : 200,
      height: type === 'TABLE' ? 120 : 150,
      price: 100,
      rows: type === 'GRID' ? 5 : undefined,
      cols: type === 'GRID' ? 10 : undefined,
      seatsPerTable: type === 'TABLE' ? 8 : undefined,
      capacity: type === 'GA' ? 50 : undefined,
      color: SECTION_COLORS[Math.floor(Math.random() * SECTION_COLORS.length)]
    }
    setSections([...sections, newSection])
    setSelectedSectionId(newSection.id)
  }

  const updateSection = (id: string, updates: Partial<Section>) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s))
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
      // Transform our visual sections into the format expected by the generator API
      const floorPlan = {
        name: `Designed Plan ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
        totalSeats: sections.reduce((acc, s) => {
          if (s.type === 'GRID') return acc + ((s.rows || 0) * (s.cols || 0))
          if (s.type === 'TABLE') return acc + (s.seatsPerTable || 0)
          if (s.type === 'GA') return acc + (s.capacity || 0)
          return acc
        }, 0),
        sections: sections.map(s => {
          // Generalize structure for the API
          // We need to map our "Canvas visual properties" to "Seat Rows" for the generator

          let generatedRows: any[] = []

          if (s.type === 'GRID') {
            generatedRows = Array.from({ length: s.rows || 0 }).map((_, rIdx) => ({
              number: String.fromCharCode(65 + rIdx), // A, B, C...
              seats: s.cols || 10,
              xOffset: s.x,
              yOffset: s.y + (rIdx * 30), // Simple visual spacing
              rowSpacing: 30
            }))
          } else if (s.type === 'TABLE') {
            // For a single table section, we might want multiple tables or just one?
            // "Table" usually means a cluster of tables.
            // For simplicity in this v1, let's assume it represents ONE table group (e.g. Table 1)
            // But usually a "Section" contains multiple tables.
            // Let's treat "Grid" as standard rows.
            // Let's treat "Table" as just a single row with special numbering?
            // Actually, the generator API expects `rows`.

            // Allow "Table" sections to just be "1 Table" or "Cluster"?
            // Let's map it to a single row named "Table 1" with X seats.
            generatedRows = [{
              number: s.name,
              seats: s.seatsPerTable || 8,
              xOffset: s.x,
              yOffset: s.y
            }]
          } else if (s.type === 'GA') {
            // GA is just capacity. 
            // We can model this as 1 massive row, or multiple rows.
            // Let's model as 1 row for now.
            generatedRows = [{
              number: 'GA',
              seats: s.capacity || 100,
              xOffset: s.x,
              yOffset: s.y
            }]
          }

          return {
            name: s.name,
            type: s.type,
            basePrice: s.price,
            rows: generatedRows,
            visualData: { // Save visual state to restore later
              x: s.x,
              y: s.y,
              width: s.width,
              height: s.height,
              color: s.color,
              type: s.type
            }
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
      setActiveTool('plans') // Switch to plans view
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
              Venue Designer
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
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Configuration
            </button>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Palette */}
          <aside className="w-64 bg-white border-r flex flex-col z-10">
            <div className="flex border-b">
              <button
                onClick={() => setActiveTool('toolkit')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${activeTool === 'toolkit' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Toolkit
              </button>
              <button
                onClick={() => setActiveTool('plans')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${activeTool === 'plans' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Saved Plans
              </button>
            </div>

            {activeTool === 'toolkit' ? (
              <div className="p-4 border-b">
                <div className="grid grid-cols-2 gap-3">
                  <ToolButton
                    icon={Grid}
                    label="Seating Grid"
                    onClick={() => addSection('GRID')}
                    description="Theater/Stadium"
                  />
                  <ToolButton
                    icon={Circle}
                    label="Round Table"
                    onClick={() => addSection('TABLE')}
                    description="Banquet/Dinner"
                  />
                  <ToolButton
                    icon={Square}
                    label="Standing"
                    onClick={() => addSection('GA')}
                    description="General Admission"
                  />
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {savedPlans.length === 0 && (
                  <div className="text-center py-8 text-xs text-slate-400 border-2 border-dashed rounded-lg">
                    No saved plans found.
                  </div>
                )}
                {savedPlans.map(plan => (
                  <div key={plan.id} className="p-3 border rounded-lg bg-white hover:border-indigo-300 transition-colors group">
                    <div className="font-medium text-sm truncate" title={plan.planName}>{plan.planName}</div>
                    <div className="text-xs text-slate-500 mt-1 flex justify-between">
                      <span>{plan.totalSeats || 0} Seats</span>
                      <span>{new Date(plan.createdAt).toLocaleDateString()}</span>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm('Load this plan? Current unsaved changes will be lost.')) {
                          if (plan.layoutData && plan.layoutData.sections) {
                            const loadedSections = plan.layoutData.sections.map((s: any) => {
                              if (s.visualData) {
                                return {
                                  id: s.visualData.id || `section-${Math.random()}`,
                                  name: s.name,
                                  type: s.visualData.type || s.type || 'GRID',
                                  x: s.visualData.x || 100,
                                  y: s.visualData.y || 100,
                                  width: s.visualData.width || 200,
                                  height: s.visualData.height || 150,
                                  price: s.basePrice || 100,
                                  color: s.visualData.color || '#6366f1',
                                  rows: s.type === 'GRID' ? (s.rows?.length || 5) : undefined,
                                  cols: s.type === 'GRID' ? (s.rows?.[0]?.seats || 10) : undefined,
                                  seatsPerTable: s.type === 'TABLE' ? (s.rows?.[0]?.seats || 8) : undefined,
                                  capacity: s.type === 'GA' ? (s.rows?.[0]?.seats || 100) : undefined,
                                }
                              }
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
                                color: '#94a3b8'
                              }
                            })
                            setSections(loadedSections)
                            setSelectedSectionId(null)
                          }
                        }
                      }}
                      className="mt-2 w-full py-1.5 text-xs bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100 font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Load Plan
                    </button>
                  </div>
                ))}
              </div>
            )}


            {activeTool === 'toolkit' && (
              <div className="flex-1 overflow-y-auto p-4">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Sections ({sections.length})</h2>
                <div className="space-y-2">
                  {sections.map(s => (
                    <div
                      key={s.id}
                      onClick={() => setSelectedSectionId(s.id)}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer border transition-all ${selectedSectionId === s.id ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' : 'border-slate-200 hover:border-indigo-300 bg-white'}`}
                    >
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{s.name}</div>
                        <div className="text-xs text-slate-500">
                          {s.type === 'GRID' ? `${s.rows}x${s.cols} Seats` : s.type === 'TABLE' ? `${s.seatsPerTable} Seats` : `Capacity: ${s.capacity}`}
                        </div>
                      </div>
                    </div>
                  ))}
                  {sections.length === 0 && (
                    <div className="text-center py-8 text-xs text-slate-400 border-2 border-dashed rounded-lg">
                      No sections added.<br />Click a tool above to start.
                    </div>
                  )}
                </div>
              </div>
            )}
          </aside>

          {/* Canvas */}
          <div className="flex-1 bg-slate-100 overflow-hidden relative">
            <div className="absolute inset-0 overflow-auto">
              <div
                ref={canvasRef}
                className="relative min-w-[2000px] min-h-[2000px] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px]"
                style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}
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

                {/* Stage Marker (Visual Reference) */}
                <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-24 bg-slate-800 rounded-b-[100px] flex items-center justify-center text-white/20 font-bold text-4xl uppercase tracking-[1em] pointer-events-none select-none">
                  Stage
                </div>
              </div>
            </div>
          </div>

          {/* Properties Panel */}
          {selectedSection ? (
            <aside className="w-80 bg-white border-l p-4 overflow-y-auto animate-in slide-in-from-right duration-200 z-10 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-slate-900">Properties</h2>
                <button onClick={() => deleteSection(selectedSection.id)} className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Section Name</label>
                  <input
                    type="text"
                    value={selectedSection.name}
                    onChange={e => updateSection(selectedSection.id, { name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase">Price (₹)</label>
                    <input
                      type="number"
                      value={selectedSection.price}
                      onChange={e => updateSection(selectedSection.id, { price: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase">Color</label>
                    <div className="flex items-center gap-1">
                      {SECTION_COLORS.slice(0, 4).map(c => (
                        <button
                          key={c}
                          onClick={() => updateSection(selectedSection.id, { color: c })}
                          className={`w-6 h-6 rounded-full border-2 ${selectedSection.color === c ? 'border-slate-900' : 'border-transparent'}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="h-px bg-slate-100 my-2" />

                {/* Type Specific Controls */}
                {selectedSection.type === 'GRID' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 uppercase">Rows</label>
                        <input
                          type="number"
                          min="1" max="100"
                          value={selectedSection.rows}
                          onChange={e => updateSection(selectedSection.id, { rows: parseInt(e.target.value) || 1 })}
                          className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 uppercase">Columns</label>
                        <input
                          type="number"
                          min="1" max="100"
                          value={selectedSection.cols}
                          onChange={e => updateSection(selectedSection.id, { cols: parseInt(e.target.value) || 1 })}
                          className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded">
                      Total Seats: <span className="font-semibold text-slate-900">{(selectedSection.rows || 0) * (selectedSection.cols || 0)}</span>
                    </div>
                  </div>
                )}

                {selectedSection.type === 'TABLE' && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500 uppercase">Seats per Table</label>
                      <input
                        type="number"
                        min="1" max="20"
                        value={selectedSection.seatsPerTable}
                        onChange={e => updateSection(selectedSection.id, { seatsPerTable: parseInt(e.target.value) || 1 })}
                        className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                )}

                {selectedSection.type === 'GA' && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500 uppercase">Capacity</label>
                      <input
                        type="number"
                        min="1" max="100000"
                        value={selectedSection.capacity}
                        onChange={e => updateSection(selectedSection.id, { capacity: parseInt(e.target.value) || 1 })}
                        className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                )}

                <div className="pt-4 mt-auto">
                  <p className="text-xs text-slate-400">
                    Drag the section in the preview to position it.
                  </p>
                </div>
              </div>
            </aside>
          ) : (
            <aside className="w-80 bg-white border-l p-8 flex flex-col items-center justify-center text-center text-slate-400">
              <Move className="w-12 h-12 mb-4 opacity-20" />
              <p className="font-medium">No Section Selected</p>
              <p className="text-sm mt-1">Select a section to edit its properties or add a new one.</p>
            </aside>
          )}
        </div>
      </div>
    </DndProvider>
  )
}

function ToolButton({ icon: Icon, label, onClick, description }: { icon: any, label: string, onClick: () => void, description: string }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center justify-center p-3 border rounded-xl hover:bg-slate-50 hover:border-indigo-300 hover:shadow-sm transition-all text-center h-24 group bg-white">
      <Icon className="w-6 h-6 mb-2 text-slate-600 group-hover:text-indigo-600" />
      <div className="text-xs font-bold text-slate-900">{label}</div>
      <div className="text-[10px] text-slate-400 scale-90">{description}</div>
    </button>
  )
}

function DraggableSection({ section, isSelected, onSelect, onMove }: { section: Section, isSelected: boolean, onSelect: () => void, onMove: (x: number, y: number) => void }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'section',
    item: { id: section.id, x: section.x, y: section.y },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (item, monitor) => {
      const delta = monitor.getDifferenceFromInitialOffset()
      if (delta && item) {
        const newX = Math.round(item.x + delta.x)
        const newY = Math.round(item.y + delta.y)
        onMove(newX, newY)
      }
    },
  }), [section.x, section.y])

  // Visual Rendering logic based on type
  const renderVisuals = () => {
    if (section.type === 'GRID') {
      const rows = section.rows || 1
      const cols = section.cols || 1
      // Simple visual grid preview
      return (
        <div
          className="grid gap-[2px]"
          style={{
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            width: '100%',
            height: '100%',
            padding: '10px'
          }}
        >
          {Array.from({ length: rows * cols }).slice(0, 100).map((_, i) => ( // Cap prev at 100 for performance
            <div key={i} className="bg-current opacity-20 rounded-sm" />
          ))}
        </div>
      )
    }
    if (section.type === 'TABLE') {
      return (
        <div className="w-full h-full relative flex items-center justify-center">
          <div className="w-[60%] h-[60%] rounded-full border-4 border-current opacity-30"></div>
          {Array.from({ length: section.seatsPerTable || 4 }).map((_, i) => {
            const angle = (i / (section.seatsPerTable || 4)) * Math.PI * 2
            const radius = 40 // percentage
            const left = 50 + Math.cos(angle) * radius
            const top = 50 + Math.sin(angle) * radius
            return (
              <div
                key={i}
                className="absolute w-[15%] h-[15%] rounded-full bg-current opacity-40"
                style={{ left: `${left}%`, top: `${top}%`, transform: 'translate(-50%, -50%)' }}
              />
            )
          })}
        </div>
      )
    }
    if (section.type === 'GA') {
      return (
        <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-current opacity-30 rounded-lg">
          <span className="font-bold text-2xl opacity-50">GA</span>
        </div>
      )
    }
  }

  return (
    <div
      ref={drag as any}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      className={`absolute rounded-xl shadow-lg cursor-move transition-shadow group overflow-hidden bg-white
                ${isSelected ? 'ring-2 ring-indigo-500 shadow-xl z-20' : 'ring-1 ring-slate-200 hover:ring-indigo-300 z-10'}
                ${isDragging ? 'opacity-50' : 'opacity-100'}
            `}
      style={{
        left: section.x,
        top: section.y,
        width: section.width,
        height: section.height,
        color: section.color || '#6366f1'
      }}
    >
      {/* Header */}
      <div className="h-6 w-full absolute top-0 left-0 bg-current opacity-10 pointer-events-none" />
      <div className="absolute top-1 left-2 text-[10px] font-bold text-slate-900 pointer-events-none uppercase tracking-wide opacity-50 truncate max-w-[90%]">
        {section.name}
      </div>

      {/* Content */}
      <div className="w-full h-full pt-6">
        {renderVisuals()}
      </div>

      {/* Resize Handle (Visual only for now) */}
      {isSelected && (
        <div className="absolute bottom-0 right-0 w-4 h-4 bg-indigo-500 rounded-tl cursor-se-resize flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-white rounded-full opacity-50" />
        </div>
      )}
    </div>
  )
}
