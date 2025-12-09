"use client"
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Building2, Check, ChevronDown } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function TenantSwitcher() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const [tenants, setTenants] = useState<any[]>([])
  const [current, setCurrent] = useState<any>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    fetch('/api/user/tenants').then(r => r.json()).then(d => {
      setTenants(d.tenants || [])
      const cur = d.tenants.find((t: any) => t.id === (session as any)?.user?.currentTenantId)
      setCurrent(cur || d.tenants[0])
    })
  }, [session])

  const switchTenant = async (id: string) => {
    await fetch('/api/user/switch-tenant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId: id })
    })
    await update()
    router.refresh()
    setOpen(false)
  }

  if (!session || tenants.length === 0) return null

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100">
        <Building2 className="w-5 h-5" />
        <span className="text-sm font-medium">{current?.name || 'Select Org'}</span>
        <ChevronDown className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border z-50">
          {tenants.map(t => (
            <button key={t.id} onClick={() => switchTenant(t.id)} 
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50">
              <span>{t.name}</span>
              {current?.id === t.id && <Check className="w-4 h-4 ml-auto" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
