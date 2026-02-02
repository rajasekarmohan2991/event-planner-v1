"use client"

import { motion } from 'framer-motion'

export type Category = { id: string; label: string }

export default function CategoryChips({ items, onSelect }: { items: Category[]; onSelect?: (id: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((c, i) => (
        <motion.button
          key={c.id}
          whileTap={{ scale: 0.96 }}
          className="rounded-full border bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm hover:bg-gray-50"
          onClick={() => onSelect?.(c.id)}
        >
          {c.label}
        </motion.button>
      ))}
    </div>
  )
}
