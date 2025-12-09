export default function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h2 className="text-xl font-semibold">{title}</h2>
      {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
    </div>
  )
}
