"use client"

import { useMemo, useState } from "react"

export type TicketTier = {
  id: string
  name: string
  price: number
  currency: "INR"
  benefits?: string[]
}

export default function TicketSelector({ tiers }: { tiers: TicketTier[] }) {
  const [selected, setSelected] = useState<string>(tiers[0]?.id ?? "")
  const [qty, setQty] = useState<number>(1)

  const selTier = useMemo(() => tiers.find((t) => t.id === selected) ?? tiers[0], [selected, tiers])
  const currencySymbol = "₹"
  const total = (selTier?.price ?? 0) * qty

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <h3 className="mb-3 text-base font-semibold">Tickets</h3>

      <div className="space-y-2">
        {tiers.map((t) => (
          <label key={t.id} className="flex cursor-pointer items-start gap-3 rounded-xl border p-3 hover:bg-gray-50">
            <input
              type="radio"
              name="tier"
              value={t.id}
              checked={(selected || tiers[0]?.id) === t.id}
              onChange={() => setSelected(t.id)}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-medium">{t.name}</span>
                <span className="font-semibold">{currencySymbol}{t.price.toLocaleString("en-IN")}</span>
              </div>
              {t.benefits && t.benefits.length > 0 && (
                <ul className="mt-1 list-disc pl-5 text-sm text-gray-600">
                  {t.benefits.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              )}
            </div>
          </label>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm text-gray-700">Quantity</span>
        <div className="inline-flex items-center gap-2">
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="h-8 w-8 rounded-full border text-lg leading-none"
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="w-6 text-center font-medium">{qty}</span>
          <button
            onClick={() => setQty((q) => Math.min(10, q + 1))}
            className="h-8 w-8 rounded-full border text-lg leading-none"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-sm text-gray-600">Total</span>
        <span className="text-xl font-bold">{currencySymbol}{total.toLocaleString("en-IN")}</span>
      </div>

      <button
        className="mt-4 w-full rounded-xl bg-gray-900 px-4 py-3 font-medium text-white hover:bg-black"
        onClick={() => alert(`Proceed to checkout: ${currencySymbol}${total.toLocaleString('en-IN')} for ${qty} ticket(s)`) }
      >
        Get tickets
      </button>
      <p className="mt-2 text-center text-xs text-gray-500">Limited seats available</p>
    </div>
  )
}
