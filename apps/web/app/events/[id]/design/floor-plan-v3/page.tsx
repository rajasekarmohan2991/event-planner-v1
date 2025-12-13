"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useParams } from "next/navigation"
import { Stage, Layer, Rect, Circle, Text, Group } from "react-konva"
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

  const [dragId, setDragId] = useState<string | null>(null)

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
          <div className="bg-white rounded-lg border p-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Template</label>
              <select value={planType} onChange={e => setPlanType(e.target.value as PlanType)} className="w-full border rounded px-3 py-2">
                <option value="THEATER_V3">Theater</option>
                <option value="STADIUM_V3">Stadium</option>
                <option value="BANQUET_V3">Banquet</option>
              </select>
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
                      <div key={idx} className="grid grid-cols-5 gap-2">
                        <input type="number" value={r.radius} onChange={e => setRings(rs => rs.map((x,i)=> i===idx? { ...x, radius: parseInt(e.target.value)||0 }: x))} className="border rounded px-2 py-1" />
                        <input type="number" value={r.sectors} onChange={e => setRings(rs => rs.map((x,i)=> i===idx? { ...x, sectors: parseInt(e.target.value)||1 }: x))} className="border rounded px-2 py-1" />
                        <input type="number" value={r.seatsPerSector} onChange={e => setRings(rs => rs.map((x,i)=> i===idx? { ...x, seatsPerSector: parseInt(e.target.value)||1 }: x))} className="border rounded px-2 py-1" />
                        <input type="number" value={r.basePrice} onChange={e => setRings(rs => rs.map((x,i)=> i===idx? { ...x, basePrice: parseFloat(e.target.value)||0 }: x))} className="border rounded px-2 py-1" />
                        <input type="text" value={r.name} onChange={e => setRings(rs => rs.map((x,i)=> i===idx? { ...x, name: e.target.value }: x))} className="border rounded px-2 py-1" />
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
                    <input type="number" min={1} max={12} value={banquetDefaultSeats} onChange={e => setBanquetDefaultSeats(parseInt(e.target.value)||1)} className="w-full border rounded px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Default Base Price</label>
                    <input type="number" min={0} value={banquetDefaultPrice} onChange={e => setBanquetDefaultPrice(parseFloat(e.target.value)||0)} className="w-full border rounded px-3 py-2" />
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
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg border p-2">
            <Stage width={width} height={height} className="w-full h-full">
              <Layer>
                <Rect x={0} y={0} width={width} height={height} fill="#f8fafc" stroke="#e5e7eb"/>
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
                        draggable
                        x={t.x}
                        y={t.y}
                        onDragStart={() => setDragId(t.id)}
                        onDragEnd={e => onTableDragMove(t.id, e.target.x(), e.target.y())}
                        onClick={() => removeTable(t.id)}
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
