"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useParams } from "next/navigation"
import { Stage, Layer, Rect, Circle, Text, Group, Line, Transformer } from "react-konva"
import { Button } from "@/components/ui/button"

type PlanType = "THEATER_V3" | "STADIUM_V3" | "BANQUET_V3"

export default function FloorPlannerV3() {
  const params = useParams<{ id: string }>()
  const eventId = String(params?.id || "")

  const [planType, setPlanType] = useState<PlanType>("THEATER_V3")
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string>("")

  const [theaterRows, setTheaterRows] = useState<number>(12)
  const [theaterCols, setTheaterCols] = useState<number>(20)
  const [theaterAisleEvery, setTheaterAisleEvery] = useState<number>(0)
  const [theaterPrice, setTheaterPrice] = useState<number>(200)
  const [theaterSection, setTheaterSection] = useState<string>("Theater")

  const [rings, setRings] = useState<Array<{ radius: number; sectors: number; seatsPerSector: number; basePrice: number; name: string; seatType?: string }>>([
    { radius: 120, sectors: 6, seatsPerSector: 30, basePrice: 400, name: "Ring 1", seatType: "STANDARD" },
    { radius: 180, sectors: 8, seatsPerSector: 40, basePrice: 300, name: "Ring 2", seatType: "STANDARD" },
    { radius: 240, sectors: 10, seatsPerSector: 50, basePrice: 200, name: "Ring 3", seatType: "STANDARD" },
  ])
  const [stadiumCenter, setStadiumCenter] = useState<{ x: number; y: number }>({ x: 500, y: 320 })

  const [tables, setTables] = useState<Array<{ id: string; x: number; y: number; radius: number; seats: number; basePrice: number; section: string; seatType?: string }>>([
    { id: "t1", x: 200, y: 200, radius: 32, seats: 6, basePrice: 150, section: "Banquet", seatType: "STANDARD" },
  ])
  const [banquetDefaultSeats, setBanquetDefaultSeats] = useState<number>(6)
  const [banquetDefaultPrice, setBanquetDefaultPrice] = useState<number>(150)
  const [banquetSection, setBanquetSection] = useState<string>("Banquet")
  const [rowBands, setRowBands] = useState<Array<{ startRowIndex: number; endRowIndex: number | null; basePrice: number; seatType?: string }>>([])

  const [dragId, setDragId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const transformerRef = useRef<any>(null)
  const shapeRefs = useRef<Record<string, any>>({})

  const [showGrid, setShowGrid] = useState<boolean>(true)
  const [gridSize, setGridSize] = useState<number>(20)
  const [presetKey, setPresetKey] = useState<string>("")

  const width = 1000
  const height = 640

  const theaterSeatPositions = useMemo(() => {
    const out: Array<{ x: number; y: number }> = []
    const spacing = 24
    for (let r = 0; r < theaterRows; r++) {
      for (let c = 1; c <= theaterCols; c++) {
        if (theaterAisleEvery > 0 && c % theaterAisleEvery === 0) continue
        const x = 80 + c * spacing
        const y = 80 + r * spacing
        out.push({ x, y })
      }
    }
    return out
  }, [theaterRows, theaterCols, theaterAisleEvery])

  const snap = (value: number, size: number) => Math.round(value / size) * size

  const onStageMouseDown = (e: any) => {
    // deselect when clicked on empty area
    const clickedOnEmpty = e.target === e.target.getStage()
    if (clickedOnEmpty) {
      setSelectedId(null)
    }
  }

  const applyPreset = (key: string) => {
    if (planType === 'THEATER_V3') {
      if (key === 'theater-small') {
        setTheaterRows(10); setTheaterCols(16); setTheaterAisleEvery(4); setTheaterPrice(200); setRowBands([])
      } else if (key === 'theater-medium') {
        setTheaterRows(18); setTheaterCols(24); setTheaterAisleEvery(6); setTheaterPrice(300);
        setRowBands([{ startRowIndex: 0, endRowIndex: 4, basePrice: 500, seatType: 'VIP' }])
      } else if (key === 'theater-large') {
        setTheaterRows(26); setTheaterCols(30); setTheaterAisleEvery(6); setTheaterPrice(350);
        setRowBands([
          { startRowIndex: 0, endRowIndex: 5, basePrice: 600, seatType: 'VIP' },
          { startRowIndex: 6, endRowIndex: 12, basePrice: 450, seatType: 'PREMIUM' },
        ])
      }
    } else if (planType === 'STADIUM_V3') {
      if (key === 'stadium-cricket') {
        setStadiumCenter({ x: 500, y: 320 })
        setRings([
          { radius: 120, sectors: 6, seatsPerSector: 40, basePrice: 800, name: 'Inner VIP', seatType: 'VIP' },
          { radius: 180, sectors: 8, seatsPerSector: 50, basePrice: 500, name: 'Premium', seatType: 'PREMIUM' },
          { radius: 240, sectors: 10, seatsPerSector: 60, basePrice: 250, name: 'Standard', seatType: 'STANDARD' },
        ])
      }
    } else if (planType === 'BANQUET_V3') {
      if (key === 'banquet-20x10') {
        const rows = 4, cols = 5
        const gapX = 160, gapY = 120
        const startX = 160, startY = 140
        const newTables: typeof tables = []
        let count = 0
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            count++
            newTables.push({
              id: `t${Date.now()}_${r}_${c}`,
              x: startX + c * gapX,
              y: startY + r * gapY,
              radius: 36,
              seats: 10,
              basePrice: 200,
              section: banquetSection,
              seatType: 'STANDARD',
            })
          }
        }
        setTables(newTables)
      }
    }
  }

  useEffect(() => {
    if (selectedId && transformerRef.current && shapeRefs.current[selectedId]) {
      transformerRef.current.nodes([shapeRefs.current[selectedId]])
      transformerRef.current.getLayer()?.batchDraw()
    }
  }, [selectedId, tables])

  const stadiumSeatPositions = useMemo(() => {
    const out: Array<{ x: number; y: number; ringIndex: number }> = []
    for (let ri = 0; ri < rings.length; ri++) {
      const ring = rings[ri]
      const total = Math.max(1, ring.sectors * ring.seatsPerSector)
      for (let i = 0; i < total; i++) {
        const angle = (2 * Math.PI * i) / total
        const x = stadiumCenter.x + ring.radius * Math.cos(angle)
        const y = stadiumCenter.y + ring.radius * Math.sin(angle)
        out.push({ x, y, ringIndex: ri })
      }
    }
    return out
  }, [rings, stadiumCenter])

  const onTableDragMove = (id: string, x: number, y: number) => {
    setTables(ts => ts.map(t => (t.id === id ? { ...t, x, y } : t)))
  }

  const addRing = () => {
    setRings(rs => [...rs, { radius: (rs[rs.length - 1]?.radius || 240) + 60, sectors: 8, seatsPerSector: 40, basePrice: 200, name: `Ring ${rs.length + 1}`, seatType: "STANDARD" }])
  }

  const addTable = () => {
    const id = `t${Date.now()}`
    setTables(ts => [...ts, { id, x: width / 2, y: height / 2, radius: 32, seats: banquetDefaultSeats, basePrice: banquetDefaultPrice, section: banquetSection, seatType: "STANDARD" }])
  }

  const removeTable = (id: string) => {
    setTables(ts => ts.filter(t => t.id !== id))
  }

  const buildPlanPayload = () => {
    if (planType === "THEATER_V3") {
      return {
        type: "THEATER_V3",
        rows: theaterRows,
        cols: theaterCols,
        aisleEvery: theaterAisleEvery,
        basePrice: theaterPrice,
        section: theaterSection,
        seatType: "STANDARD",
        rowBands: rowBands,
      }
    }
    if (planType === "STADIUM_V3") {
      return {
        type: "STADIUM_V3",
        centerX: stadiumCenter.x,
        centerY: stadiumCenter.y,
        rings: rings.map(r => ({ ...r })),
      }
    }
    return {
      type: "BANQUET_V3",
      section: banquetSection,
      basePrice: banquetDefaultPrice,
      seatsPerTable: banquetDefaultSeats,
      tables: tables.map(t => ({ x: t.x, y: t.y, radius: t.radius, seats: t.seats, basePrice: t.basePrice, section: t.section, seatType: t.seatType })),
    }
  }

  const saveAndGenerate = async () => {
    try {
      setSaving(true)
      setMessage("")
      const res = await fetch(`/api/events/${eventId}/seats/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ floorPlan: buildPlanPayload() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage(data?.error || "Failed to generate seats")
        return
      }
      setMessage(data?.message || "Seats generated")
    } catch (e: any) {
      setMessage(e?.message || "Failed")
    } finally {
      setSaving(false)
    }
  }

  // Zoom and Pan State
  const [stageScale, setStageScale] = useState(1)
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 })

  const handleWheel = (e: any) => {
    e.evt.preventDefault()
    const scaleBy = 1.1
    const stage = e.target.getStage()
    const oldScale = stage.scaleX()
    const mousePointTo = {
      x: stage.getPointerPosition().x / oldScale - stage.x() / oldScale,
      y: stage.getPointerPosition().y / oldScale - stage.y() / oldScale,
    }

    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy
    setStageScale(newScale)

    setStagePos({
      x: -(mousePointTo.x - stage.getPointerPosition().x / newScale) * newScale,
      y: -(mousePointTo.y - stage.getPointerPosition().y / newScale) * newScale,
    })
  }

  return (
    <div className="min-h-screen p-4 md:p-6 bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dynamic Floor Planner V3</h1>
            <p className="text-sm text-gray-600">Cricket stadium, theater, banquet layouts with drag & drop</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={saveAndGenerate} disabled={saving}>{saving ? "Saving..." : "Save & Generate Seats"}</Button>
          </div>
        </div>

        {message && (
          <div className="p-3 rounded-md border bg-white text-sm">{message}</div>
        )}

        <div className="grid lg:grid-cols-[360px_1fr] gap-4">
          <div className="bg-white rounded-lg border p-4 space-y-4 max-h-[800px] overflow-y-auto">
            {/* Sidebar content - kept same */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Template</label>
              <select value={planType} onChange={e => setPlanType(e.target.value as PlanType)} className="w-full border rounded px-3 py-2">
                <option value="THEATER_V3">Theater</option>
                <option value="STADIUM_V3">Stadium</option>
                <option value="BANQUET_V3">Banquet</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Presets</label>
              <select
                value={presetKey}
                onChange={(e) => { setPresetKey(e.target.value); if (e.target.value) applyPreset(e.target.value) }}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Choose preset (optional)</option>
                {planType === 'THEATER_V3' && (
                  <>
                    <option value="theater-small">Theater: Small</option>
                    <option value="theater-medium">Theater: Medium</option>
                    <option value="theater-large">Theater: Large</option>
                  </>
                )}
                {planType === 'STADIUM_V3' && (
                  <>
                    <option value="stadium-cricket">Stadium: Cricket Default</option>
                  </>
                )}
                {planType === 'BANQUET_V3' && (
                  <>
                    <option value="banquet-20x10">Banquet: 20 tables x 10 seats</option>
                  </>
                )}
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">Controls</label>
                <Button variant="ghost" size="sm" onClick={() => { setStageScale(1); setStagePos({ x: 0, y: 0 }) }}>Reset View</Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={showGrid} onChange={e => setShowGrid(e.target.checked)} />
                  Show grid
                </label>
                <div>
                  <input type="number" min={5} max={100} value={gridSize} onChange={e => setGridSize(parseInt(e.target.value) || 20)} className="w-full border rounded px-3 py-2" />
                </div>
              </div>
            </div>

            {planType === "THEATER_V3" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Rows</label>
                  <input type="number" min={1} max={80} value={theaterRows} onChange={e => setTheaterRows(parseInt(e.target.value) || 1)} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Seats per Row</label>
                  <input type="number" min={1} max={120} value={theaterCols} onChange={e => setTheaterCols(parseInt(e.target.value) || 1)} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Aisle every N seats</label>
                  <input type="number" min={0} max={20} value={theaterAisleEvery} onChange={e => setTheaterAisleEvery(parseInt(e.target.value) || 0)} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Base Price</label>
                  <input type="number" min={0} value={theaterPrice} onChange={e => setTheaterPrice(parseFloat(e.target.value) || 0)} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Section</label>
                  <input type="text" value={theaterSection} onChange={e => setTheaterSection(e.target.value)} className="w-full border rounded px-3 py-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Price Bands (Rows)</span>
                    <Button variant="outline" onClick={() => setRowBands(b => [...b, { startRowIndex: 0, endRowIndex: null, basePrice: theaterPrice, seatType: 'STANDARD' }])}>+ Add Band</Button>
                  </div>
                  {rowBands.length === 0 && (
                    <div className="text-xs text-gray-600">Optional: define row ranges with different prices or seat types.</div>
                  )}
                  <div className="space-y-2">
                    {rowBands.map((band, i) => (
                      <div key={i} className="grid grid-cols-5 gap-2 items-center">
                        <div>
                          <label className="block text-xs text-gray-500">Start Row Index</label>
                          <input type="number" min={0} value={band.startRowIndex} onChange={e => setRowBands(bs => bs.map((b, idx) => idx === i ? { ...b, startRowIndex: parseInt(e.target.value) || 0 } : b))} className="w-full border rounded px-2 py-1" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500">End Row Index</label>
                          <input type="number" min={-1} placeholder="-1 for no end" value={band.endRowIndex ?? ''} onChange={e => setRowBands(bs => bs.map((b, idx) => idx === i ? { ...b, endRowIndex: e.target.value === '' ? null : (parseInt(e.target.value) || 0) } : b))} className="w-full border rounded px-2 py-1" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500">Base Price</label>
                          <input type="number" min={0} value={band.basePrice} onChange={e => setRowBands(bs => bs.map((b, idx) => idx === i ? { ...b, basePrice: parseFloat(e.target.value) || 0 } : b))} className="w-full border rounded px-2 py-1" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500">Seat Type</label>
                          <input type="text" value={band.seatType || 'STANDARD'} onChange={e => setRowBands(bs => bs.map((b, idx) => idx === i ? { ...b, seatType: e.target.value } : b))} className="w-full border rounded px-2 py-1" />
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" onClick={() => setRowBands(bs => bs.filter((_, idx) => idx !== i))}>Delete</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {planType === "STADIUM_V3" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium mb-1">Center X</label>
                    <input type="number" value={stadiumCenter.x} onChange={e => setStadiumCenter({ ...stadiumCenter, x: parseInt(e.target.value) || 0 })} className="w-full border rounded px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Center Y</label>
                    <input type="number" value={stadiumCenter.y} onChange={e => setStadiumCenter({ ...stadiumCenter, y: parseInt(e.target.value) || 0 })} className="w-full border rounded px-3 py-2" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Rings</span>
                    <Button variant="outline" onClick={addRing}>+ Add Ring</Button>
                  </div>
                  <div className="space-y-2">
                    {rings.map((r, idx) => (
                      <div key={idx} className="grid grid-cols-6 gap-2">
                        <input type="number" value={r.radius} onChange={e => setRings(rs => rs.map((x, i) => i === idx ? { ...x, radius: parseInt(e.target.value) || 0 } : x))} className="border rounded px-2 py-1" />
                        <input type="number" value={r.sectors} onChange={e => setRings(rs => rs.map((x, i) => i === idx ? { ...x, sectors: parseInt(e.target.value) || 1 } : x))} className="border rounded px-2 py-1" />
                        <input type="number" value={r.seatsPerSector} onChange={e => setRings(rs => rs.map((x, i) => i === idx ? { ...x, seatsPerSector: parseInt(e.target.value) || 1 } : x))} className="border rounded px-2 py-1" />
                        <input type="number" value={r.basePrice} onChange={e => setRings(rs => rs.map((x, i) => i === idx ? { ...x, basePrice: parseFloat(e.target.value) || 0 } : x))} className="border rounded px-2 py-1" />
                        <input type="text" value={r.name} onChange={e => setRings(rs => rs.map((x, i) => i === idx ? { ...x, name: e.target.value } : x))} className="border rounded px-2 py-1" />
                        <input type="text" value={r.seatType || 'STANDARD'} onChange={e => setRings(rs => rs.map((x, i) => i === idx ? { ...x, seatType: e.target.value || 'STANDARD' } : x))} className="border rounded px-2 py-1" />
                        <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => setRings(rs => rs.filter((_, i) => i !== idx))}>x</Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {planType === "BANQUET_V3" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium mb-1">Default Seats/Table</label>
                    <input type="number" min={1} max={12} value={banquetDefaultSeats} onChange={e => setBanquetDefaultSeats(parseInt(e.target.value) || 1)} className="w-full border rounded px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Default Base Price</label>
                    <input type="number" min={0} value={banquetDefaultPrice} onChange={e => setBanquetDefaultPrice(parseFloat(e.target.value) || 0)} className="w-full border rounded px-3 py-2" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Section</label>
                  <input type="text" value={banquetSection} onChange={e => setBanquetSection(e.target.value)} className="w-full border rounded px-3 py-2" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Tables</span>
                  <Button variant="outline" onClick={addTable}>+ Add Table</Button>
                </div>
                <div className="text-xs text-gray-600">Drag tables on canvas to reposition. Click a table to remove.</div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">Layers & Locking</div>
                  <div className="space-y-1">
                    {tables.map((t, idx) => (
                      <div key={t.id} className="flex items-center gap-2 text-sm">
                        <button className="px-2 py-1 border rounded" onClick={() => setSelectedId(t.id)}>{t.id}</button>
                        <label className="inline-flex items-center gap-1">
                          <input type="checkbox" checked={(t as any).locked || false} onChange={e => setTables(ts => ts.map(x => x.id === t.id ? { ...x, locked: e.target.checked } as any : x))} />
                          Lock
                        </label>
                        <button className="px-2 py-1 border rounded" onClick={() => setTables(ts => {
                          const i = ts.findIndex(x => x.id === t.id)
                          if (i <= 0) return ts
                          const copy = ts.slice()
                          const tmp = copy[i - 1]; copy[i - 1] = copy[i]; copy[i] = tmp
                          return copy
                        })}>Up</button>
                        <button className="px-2 py-1 border rounded" onClick={() => setTables(ts => {
                          const i = ts.findIndex(x => x.id === t.id)
                          if (i < 0 || i >= ts.length - 1) return ts
                          const copy = ts.slice()
                          const tmp = copy[i + 1]; copy[i + 1] = copy[i]; copy[i] = tmp
                          return copy
                        })}>Down</button>
                        <button className="px-2 py-1 border rounded" onClick={() => setTables(ts => ts.filter(x => x.id !== t.id))}>Delete</button>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedId && tables.find(t => t.id === selectedId) && (
                  <div className="space-y-2 border-t pt-3">
                    <div className="text-sm font-medium">Selected Table Properties</div>
                    {tables.filter(t => t.id === selectedId).map(t => (
                      <div key={t.id} className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-gray-500">Seats</label>
                          <input type="number" min={1} max={20} value={t.seats} onChange={(e) => setTables(ts => ts.map(x => x.id === t.id ? { ...x, seats: parseInt(e.target.value) || 1 } : x))} className="w-full border rounded px-2 py-1" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500">Radius</label>
                          <input type="number" min={8} max={100} value={t.radius} onChange={(e) => setTables(ts => ts.map(x => x.id === t.id ? { ...x, radius: parseInt(e.target.value) || 8 } : x))} className="w-full border rounded px-2 py-1" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500">Base Price</label>
                          <input type="number" min={0} value={t.basePrice} onChange={(e) => setTables(ts => ts.map(x => x.id === t.id ? { ...x, basePrice: parseFloat(e.target.value) || 0 } : x))} className="w-full border rounded px-2 py-1" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500">Section</label>
                          <input type="text" value={t.section} onChange={(e) => setTables(ts => ts.map(x => x.id === t.id ? { ...x, section: e.target.value } : x))} className="w-full border rounded px-2 py-1" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500">Seat Type</label>
                          <input type="text" value={t.seatType || 'STANDARD'} onChange={(e) => setTables(ts => ts.map(x => x.id === t.id ? { ...x, seatType: e.target.value || 'STANDARD' } : x))} className="w-full border rounded px-2 py-1" />
                        </div>
                        <div className="flex items-end">
                          <Button variant="outline" onClick={() => setTables(ts => [...ts, { ...t, id: `t${Date.now()}` }])}>Duplicate</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg border p-2 relative overflow-hidden active:cursor-grab">
            <Stage
              width={width}
              height={height}
              className="w-full h-full bg-slate-50"
              onMouseDown={onStageMouseDown}
              draggable={true}
              onWheel={handleWheel}
              scaleX={stageScale}
              scaleY={stageScale}
              x={stagePos.x}
              y={stagePos.y}
              onDragEnd={(e) => setStagePos(e.target.position())}
            >
              <Layer>
                <Rect x={0} y={0} width={width} height={height} fill="#f8fafc" stroke="#e5e7eb" />
                {showGrid && (
                  <Group listening={false}>
                    {Array.from({ length: Math.floor(width / gridSize) + 1 }).map((_, i) => (
                      <Line key={`gx-${i}`} points={[i * gridSize, 0, i * gridSize, height]} stroke="#e2e8f0" strokeWidth={1} />
                    ))}
                    {Array.from({ length: Math.floor(height / gridSize) + 1 }).map((_, i) => (
                      <Line key={`gy-${i}`} points={[0, i * gridSize, width, i * gridSize]} stroke="#e2e8f0" strokeWidth={1} />
                    ))}
                  </Group>
                )}
                {planType === "THEATER_V3" && (
                  <Group>
                    {theaterSeatPositions.map((p, idx) => (
                      <Circle key={idx} x={p.x} y={p.y} radius={6} fill="#10b981" stroke="#065f46" />
                    ))}
                    <Text x={16} y={12} text={`${theaterRows} x ${theaterCols} (aisle ${theaterAisleEvery || 0})`} fontSize={14} fill="#334155" />
                  </Group>
                )}
                {planType === "STADIUM_V3" && (
                  <Group>
                    {rings.map((r, idx) => (
                      <Circle key={`ring-${idx}`} x={stadiumCenter.x} y={stadiumCenter.y} radius={r.radius} stroke="#94a3b8" />
                    ))}
                    {stadiumSeatPositions.map((p, idx) => (
                      <Circle key={idx} x={p.x} y={p.y} radius={4} fill="#0ea5e9" stroke="#075985" />
                    ))}
                    <Circle x={stadiumCenter.x} y={stadiumCenter.y} radius={6} fill="#334155" />
                  </Group>
                )}
                {planType === "BANQUET_V3" && (
                  <Group>
                    {tables.map((t) => (
                      <Group key={t.id}
                        ref={(node: any) => { if (node) shapeRefs.current[t.id] = node }}
                        name={t.id}
                        draggable={!((t as any).locked)}
                        x={t.x}
                        y={t.y}
                        rotation={(t as any).rotation || 0}
                        dragBoundFunc={(pos: any) => ({ x: snap(pos.x, gridSize), y: snap(pos.y, gridSize) })}
                        onDragStart={() => setDragId(t.id)}
                        onDragEnd={(e: any) => onTableDragMove(t.id, e.target.x(), e.target.y())}
                        onClick={(e: any) => { e.cancelBubble = true; setSelectedId(t.id) }}
                        onTap={(e: any) => { e.cancelBubble = true; setSelectedId(t.id) }}
                        onTransformEnd={(e: any) => {
                          const node = shapeRefs.current[t.id]
                          const scaleX = node.scaleX() || 1
                          // adjust radius based on uniform scaleX
                          setTables(ts => ts.map(x => x.id === t.id ? { ...x, radius: Math.max(8, x.radius * scaleX) } : x))
                          node.scaleX(1); node.scaleY(1)
                          const rot = node.rotation() || 0
                          setTables(ts => ts.map(x => x.id === t.id ? { ...(x as any), rotation: rot } : x))
                        }}
                      >
                        <Circle x={0} y={0} radius={t.radius} fill="#6366f1" opacity={0.15} stroke="#4338ca" />
                        {Array.from({ length: t.seats }).map((_, i) => {
                          const ang = (2 * Math.PI * i) / t.seats
                          const x = t.radius * Math.cos(ang)
                          const y = t.radius * Math.sin(ang)
                          return <Circle key={i} x={x} y={y} radius={5} fill="#22c55e" stroke="#15803d" />
                        })}
                        <Text x={-20} y={-8} text={t.id.toUpperCase()} fontSize={12} fill="#334155" />
                      </Group>
                    ))}
                    {selectedId && shapeRefs.current[selectedId] && !((tables.find(x => x.id === selectedId) as any)?.locked) && (
                      <Transformer
                        ref={transformerRef}
                        rotateEnabled={true}
                        enabledAnchors={[]}
                        rotateAnchorOffset={30}
                      />
                    )}
                  </Group>
                )}
              </Layer>
            </Stage>
          </div>
        </div>
      </div>
    </div>
  )
}
