"use client"

interface ExhibitorFormFieldsProps {
  form: any
  setForm: (form: any) => void
}

export default function ExhibitorFormFields({ form, setForm }: ExhibitorFormFieldsProps) {
  return (
    <>
      {/* Exhibitor Registration - Simplified */}
      <div className="border-t-2 border-indigo-200 pt-5 space-y-4">
        <div className="text-base font-semibold text-indigo-700">Exhibitor Details</div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-sm">First Name</label><input className="mt-1 w-full rounded border px-3 py-2 text-sm" value={form.firstName || ''} onChange={e=>setForm({ ...form, firstName: e.target.value })} /></div>
          <div><label className="text-sm">Last Name</label><input className="mt-1 w-full rounded border px-3 py-2 text-sm" value={form.lastName || ''} onChange={e=>setForm({ ...form, lastName: e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-sm">Work Phone</label><input className="mt-1 w-full rounded border px-3 py-2 text-sm" value={form.workPhone || ''} onChange={e=>setForm({ ...form, workPhone: e.target.value })} /></div>
          <div><label className="text-sm">Cell Phone</label><input className="mt-1 w-full rounded border px-3 py-2 text-sm" value={form.cellPhone || ''} onChange={e=>setForm({ ...form, cellPhone: e.target.value })} /></div>
        </div>
        <div><label className="text-sm">Company</label><input className="mt-1 w-full rounded border px-3 py-2 text-sm" value={form.company || ''} onChange={e=>setForm({ ...form, company: e.target.value })} /></div>
        <div><label className="text-sm">Full Business Address</label><input className="mt-1 w-full rounded border px-3 py-2 text-sm" value={form.businessAddress || ''} onChange={e=>setForm({ ...form, businessAddress: e.target.value })} /></div>
        <div><label className="text-sm">Company Description</label><textarea className="mt-1 w-full rounded border px-3 py-2 text-sm" rows={3} value={form.companyDescription || ''} onChange={e=>setForm({ ...form, companyDescription: e.target.value })} /></div>
        <div><label className="text-sm">Product/Services to exhibit</label><textarea className="mt-1 w-full rounded border px-3 py-2 text-sm" rows={3} value={form.productsServices || ''} onChange={e=>setForm({ ...form, productsServices: e.target.value })} /></div>
        <div>
          <label className="text-sm">Booth Type</label>
          <div className="mt-2 flex flex-col gap-2 text-sm">
            <label className="inline-flex items-center gap-2"><input type="radio" name="boothType" checked={form.boothType==='IN_PERSON'} onChange={()=>setForm({ ...form, boothType: 'IN_PERSON' })}/> In-person booth only</label>
            <label className="inline-flex items-center gap-2"><input type="radio" name="boothType" checked={form.boothType==='VIRTUAL'} onChange={()=>setForm({ ...form, boothType: 'VIRTUAL' })}/> Virtual booth only</label>
            <label className="inline-flex items-center gap-2"><input type="radio" name="boothType" checked={form.boothType==='BOTH'} onChange={()=>setForm({ ...form, boothType: 'BOTH' })}/> Virtual & In-person booth</label>
          </div>
        </div>
        <div><label className="text-sm">List your staff (name, email, phone)</label><textarea className="mt-1 w-full rounded border px-3 py-2 text-sm" rows={3} value={form.staffList || ''} onChange={e=>setForm({ ...form, staffList: e.target.value })} /></div>
      </div>

    </>
  )
}
