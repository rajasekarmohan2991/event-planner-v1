"use client"

import { FloorPlanConfig } from '@/lib/floorPlanGenerator'
import { Building2, Users, Armchair, Theater, DoorOpen } from 'lucide-react'

interface FloorPlanFormProps {
  formData: FloorPlanConfig
  setFormData: (data: FloorPlanConfig) => void
  onGenerate: () => void
}

export default function FloorPlanForm({ formData, setFormData, onGenerate }: FloorPlanFormProps) {
  const updateField = (field: keyof FloorPlanConfig, value: any) => {
    setFormData({ ...formData, [field]: value })
  }

  const updateNumberField = (field: keyof FloorPlanConfig, value: string) => {
    const numValue = parseInt(value)
    setFormData({ ...formData, [field]: isNaN(numValue) ? 0 : numValue })
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); onGenerate(); }} className="space-y-6">
      {/* Hall Specifications */}
      <div className="bg-white p-4 rounded-lg border-l-4 border-indigo-500">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Hall Specifications
        </h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Hall Name/Title *</label>
            <input
              type="text"
              value={formData.hallName}
              onChange={(e) => updateField('hallName', e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              required
              placeholder="e.g., Grand Ballroom"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Length (ft) *</label>
              <input
                type="number"
                value={formData.hallLength}
                onChange={(e) => updateNumberField('hallLength', e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                required
                min="20"
                max="500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Width (ft) *</label>
              <input
                type="number"
                value={formData.hallWidth}
                onChange={(e) => updateNumberField('hallWidth', e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                required
                min="20"
                max="500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Event Details */}
      <div className="bg-white p-4 rounded-lg border-l-4 border-indigo-500">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Event Details
        </h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Event Type *</label>
            <select
              value={formData.eventType}
              onChange={(e) => updateField('eventType', e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              required
            >
              <option value="conference">Conference</option>
              <option value="wedding">Wedding</option>
              <option value="banquet">Banquet</option>
              <option value="exhibition">Exhibition</option>
              <option value="seminar">Seminar</option>
              <option value="party">Party</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Total Number of Guests *</label>
            <input
              type="number"
              value={formData.guestCount}
              onChange={(e) => updateNumberField('guestCount', e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              required
              min="10"
              max="5000"
            />
          </div>
        </div>
      </div>

      {/* Seating Arrangements */}
      <div className="bg-white p-4 rounded-lg border-l-4 border-indigo-500">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Armchair className="w-5 h-5" />
          Seating Arrangements
        </h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Seating Style *</label>
            <select
              value={formData.tableType}
              onChange={(e) => {
                updateField('tableType', e.target.value)
                // If "Seats Only" selected, set seatsPerTable to 1
                if (e.target.value === 'seats-only') {
                  updateField('seatsPerTable', 1)
                }
              }}
              className="w-full px-3 py-2 border rounded-md bg-white relative z-10"
              required
            >
              <option value="seats-only">🪑 Seats Only (Theater Style)</option>
              <option value="round">🔵 Round Tables</option>
              <option value="rectangular">▭ Rectangular Tables</option>
              <option value="square">◻️ Square Tables</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {formData.tableType === 'seats-only' 
                ? '✓ Individual seats without tables - perfect for theater, auditorium, or conference seating'
                : '✓ Tables with multiple seats - ideal for banquets, weddings, or dining events'}
            </p>
          </div>
          
          {/* Only show table-related fields if NOT "Seats Only" */}
          {formData.tableType !== 'seats-only' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Seats per Table *</label>
                <input
                  type="number"
                  value={formData.seatsPerTable}
                  onChange={(e) => updateNumberField('seatsPerTable', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                  min="1"
                  max="12"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Table Size (ft) *</label>
                <input
                  type="number"
                  value={formData.tableSize}
                  onChange={(e) => updateField('tableSize', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                  min="2"
                  max="10"
                  step="0.5"
                />
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Layout Style *</label>
            <select
              value={formData.layoutStyle}
              onChange={(e) => updateField('layoutStyle', e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-white relative z-10"
              required
            >
              <option value="banquet">Banquet (Scattered)</option>
              <option value="theater">Theater (Rows)</option>
              <option value="classroom">Classroom</option>
              <option value="hollow">Hollow Square</option>
              <option value="ushape">U-Shape</option>
            </select>
          </div>
        </div>
      </div>

      {/* Seating Categories */}
      <div className="bg-white p-4 rounded-lg border-l-4 border-purple-500">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Seating Categories
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-2 rounded-lg border-2 border-yellow-300 flex flex-col items-center text-center">
              <label className="block text-xs font-bold mb-1 text-yellow-700">
                <span className="text-xl block mb-1">⭐</span>
                VIP Seats
              </label>
              <input
                type="number"
                value={formData.vipSeats}
                onChange={(e) => updateNumberField('vipSeats', e.target.value)}
                className="w-full px-2 py-1 border-2 border-yellow-400 rounded-md focus:ring-2 focus:ring-yellow-500 text-sm font-semibold text-center"
                min="0"
                placeholder="50"
              />
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-2 rounded-lg border-2 border-blue-300 flex flex-col items-center text-center">
              <label className="block text-xs font-bold mb-1 text-blue-700">
                <span className="text-xl block mb-1">💎</span>
                Premium
              </label>
              <input
                type="number"
                value={formData.premiumSeats}
                onChange={(e) => updateNumberField('premiumSeats', e.target.value)}
                className="w-full px-2 py-1 border-2 border-blue-400 rounded-md focus:ring-2 focus:ring-blue-500 text-sm font-semibold text-center"
                min="0"
                placeholder="150"
              />
            </div>
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-2 rounded-lg border-2 border-gray-300 flex flex-col items-center text-center">
              <label className="block text-xs font-bold mb-1 text-gray-700">
                <span className="text-xl block mb-1">🪑</span>
                General
              </label>
              <input
                type="number"
                value={formData.generalSeats}
                onChange={(e) => updateNumberField('generalSeats', e.target.value)}
                className="w-full px-2 py-1 border-2 border-gray-400 rounded-md focus:ring-2 focus:ring-gray-500 text-sm font-semibold text-center"
                min="0"
                placeholder="300"
              />
            </div>
          </div>
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-3 rounded-lg border-2 border-indigo-200 text-center">
            <p className="text-sm font-bold text-indigo-900">
              Total: <span className="text-lg text-purple-600">{(formData.vipSeats || 0) + (formData.premiumSeats || 0) + (formData.generalSeats || 0)}</span> / {formData.guestCount}
            </p>
          </div>
        </div>
      </div>

      {/* Stage Area */}
      <div className="bg-white p-4 rounded-lg border-l-4 border-indigo-500">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Theater className="w-5 h-5" />
          Stage/Presentation Area
        </h3>
        <div className="space-y-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.stageRequired}
              onChange={(e) => updateField('stageRequired', e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium">Include Stage</span>
          </label>
          {formData.stageRequired && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Stage Position</label>
                <select
                  value={formData.stagePosition}
                  onChange={(e) => updateField('stagePosition', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="front">Front (Top)</option>
                  <option value="back">Back (Bottom)</option>
                  <option value="left">Left Side</option>
                  <option value="right">Right Side</option>
                  <option value="center">Center</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Stage Width (ft)</label>
                  <input
                    type="number"
                    value={formData.stageWidth}
                    onChange={(e) => updateNumberField('stageWidth', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                    min="10"
                    max="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Stage Depth (ft)</label>
                  <input
                    type="number"
                    value={formData.stageDepth}
                    onChange={(e) => updateNumberField('stageDepth', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                    min="5"
                    max="30"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.bannerRequired}
                  onChange={(e) => updateField('bannerRequired', e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">Include Banner/Backdrop</span>
              </label>
            </>
          )}
        </div>
      </div>

      {/* Facilities */}
      <div className="bg-white p-4 rounded-lg border-l-4 border-indigo-500">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <DoorOpen className="w-5 h-5" />
          Facilities
        </h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Entry Points *</label>
              <input
                type="number"
                value={formData.entryPoints}
                onChange={(e) => updateNumberField('entryPoints', e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                required
                min="1"
                max="10"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Exit Points *</label>
              <input
                type="number"
                value={formData.exitPoints}
                onChange={(e) => updateNumberField('exitPoints', e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                required
                min="1"
                max="10"
              />
            </div>
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.restroomsRequired}
              onChange={(e) => updateField('restroomsRequired', e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium">Include Restrooms</span>
          </label>
          {formData.restroomsRequired && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Men's Restrooms</label>
                <input
                  type="number"
                  value={formData.mensRestrooms}
                  onChange={(e) => updateNumberField('mensRestrooms', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  min="0"
                  max="10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Women's Restrooms</label>
                <input
                  type="number"
                  value={formData.womensRestrooms}
                  onChange={(e) => updateNumberField('womensRestrooms', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  min="0"
                  max="10"
                />
              </div>
            </div>
          )}
        </div>
      </div>


      {/* Special Requirements */}
      <div className="bg-white p-4 rounded-lg border-l-4 border-indigo-500">
        <h3 className="font-semibold mb-4">📝 Special Requirements</h3>
        <div>
          <label className="block text-sm font-medium mb-1">Additional Notes</label>
          <textarea
            value={formData.specialNotes}
            onChange={(e) => updateField('specialNotes', e.target.value)}
            className="w-full px-3 py-2 border rounded-md min-h-[80px]"
            placeholder="Enter any special requirements or preferences..."
          />
        </div>
      </div>

      <button
        type="submit"
        className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all"
      >
        🎨 Generate Floor Plan
      </button>
    </form>
  )
}
