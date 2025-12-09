"use client"

import { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { listTeamMembers, inviteTeamMembers, reinviteTeamMember, approveTeamMember, updateTeamMember, deleteTeamMember, type TeamMember as ApiTeamMember } from '@/lib/api/team'
import ManageTabs from '@/components/events/ManageTabs'

type Member = {
  id: string
  name: string
  email: string
  role: string
  status: string
  statusAgo?: string
  progressLabel?: string
  progress?: number
}

export default function EventTeamPage({ params }: { params: { id: string } }) {
  const { status } = useSession()
  const [activeTab, setActiveTab] = useState<'members' | 'roles'>('members')
  const [searchEventMembers, setSearchEventMembers] = useState('')
  const [banner, setBanner] = useState<string | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmails, setInviteEmails] = useState('')
  const [inviteRole, setInviteRole] = useState('Event Staff')
  const [companyUsers, setCompanyUsers] = useState<any[]>([])
  const [loadingCompanyUsers, setLoadingCompanyUsers] = useState(false)
  const [selectedCompanyEmails, setSelectedCompanyEmails] = useState<Record<string, boolean>>({})
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [sortBy, setSortBy] = useState<'name'|'email'|'role'|'status'|'invitedAt'|'joinedAt'>('name')
  const [sortDir, setSortDir] = useState<'ASC'|'DESC'>('ASC')
  const [totalPages, setTotalPages] = useState(1)
  const [editOpen, setEditOpen] = useState<{id: string, role: string, status: 'Invited'|'Joined'} | null>(null)

  // API-driven members
  const [eventMembers, setEventMembers] = useState<Member[]>([])
  const [portalMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { data } = useSession()
  const accessToken = (data as any)?.accessToken as string | undefined

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        setLoading(true)
        const resp = await listTeamMembers(params.id, { page, limit, q: searchEventMembers || undefined, sortBy, sortDir }, accessToken)
        if (!mounted) return
        const mapped: Member[] = resp.items.map((m: ApiTeamMember) => ({
          id: String(m.id),
          name: m.name,
          email: m.email,
          role: m.role,
          status: m.status === 'INVITED' ? 'Invited' : m.status === 'JOINED' ? 'Joined' : m.status === 'REJECTED' ? 'Rejected' : String(m.status),
          statusAgo: m.invitedAt ? 'Recently' : undefined,
          progressLabel: 'Profile',
          progress: typeof m.progress === 'number' ? m.progress : 0,
        }))
        setEventMembers(mapped)
        setTotalPages(resp.totalPages || 1)
        setError(null)
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Failed to load team members')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    if (accessToken || status === 'authenticated') load()
    return () => { mounted = false }
  }, [params.id, accessToken, status, page, limit, sortBy, sortDir, searchEventMembers])

  useEffect(() => {
    const loadCompany = async () => {
      if (!inviteOpen) return
      setLoadingCompanyUsers(true)
      try {
        const res = await fetch(`/api/company/users?limit=200`, { credentials: 'include', cache: 'no-store' })
        const data = await res.json().catch(() => ({ users: [] }))
        const users = Array.isArray(data?.users) ? data.users : (Array.isArray(data) ? data : [])
        setCompanyUsers(users || [])
      } catch {
        setCompanyUsers([])
      } finally {
        setLoadingCompanyUsers(false)
      }
    }
    loadCompany()
  }, [inviteOpen])

  const filteredEventMembers = useMemo(() => {
    const base = eventMembers.filter(m => m.name !== 'anonymousUser' && m.email !== 'anonymousUser')
    const q = searchEventMembers.trim().toLowerCase()
    if (!q) return base
    return base.filter(m => `${m.name} ${m.email} ${m.role} ${m.status}`.toLowerCase().includes(q))
  }, [searchEventMembers, eventMembers])

  const reloadMembers = async () => {
    const resp = await listTeamMembers(params.id, { page, limit, q: searchEventMembers || undefined, sortBy, sortDir }, accessToken)
    const mapped: Member[] = resp.items.map((m: ApiTeamMember) => ({
      id: String(m.id),
      name: m.name,
      email: m.email,
      role: m.role,
      status: m.status === 'INVITED' ? 'Invited' : m.status === 'JOINED' ? 'Joined' : m.status === 'REJECTED' ? 'Rejected' : String(m.status),
      statusAgo: m.invitedAt ? 'Recently' : undefined,
      progressLabel: 'Profile',
      progress: typeof m.progress === 'number' ? m.progress : 0,
    }))
    setEventMembers(mapped)
    setTotalPages(resp.totalPages || 1)
  }

  const onInvite = async () => {
    const typedList = inviteEmails
      .split(/[\n,;]/)
      .map(s => s.trim())
      .filter(Boolean)
    const selectedFromCompany = companyUsers
      .filter((u: any) => selectedCompanyEmails[u.email])
      .map((u: any) => String(u.email).trim())
      .filter(Boolean)
    const list = Array.from(new Set([...typedList, ...selectedFromCompany]))
    if (list.length === 0) {
      setBanner('Please enter at least one email')
      return
    }
    try {
      await inviteTeamMembers(params.id, list, inviteRole, accessToken)
      await reloadMembers()
      setInviteOpen(false)
      setInviteEmails('')
      setInviteRole('Event Staff')
      setSelectedCompanyEmails({})
      setBanner(`Invited ${list.length} member(s) as ${inviteRole}`)
      setTimeout(() => setBanner(null), 3000)
    } catch (e: any) {
      setBanner(e?.message || 'Invite failed')
      setTimeout(() => setBanner(null), 3000)
    }
  }

  const onReinvite = async (email: string) => {
    try {
      await reinviteTeamMember(params.id, email, accessToken)
      setBanner(`Reinvitation sent to ${email}`)
      setTimeout(() => setBanner(null), 2500)
    } catch (e: any) {
      setBanner(e?.message || 'Reinvite failed')
      setTimeout(() => setBanner(null), 3000)
    }
  }

  const onApprove = async (email: string) => {
    try {
      await approveTeamMember(params.id, email, accessToken)
      await reloadMembers()
      setBanner(`${email} approved`)
      setTimeout(() => setBanner(null), 2500)
    } catch (e: any) {
      setBanner(e?.message || 'Approve failed')
      setTimeout(() => setBanner(null), 3000)
    }
  }

  if (status === 'loading' || loading) return <div className="p-6">Loading...</div>

  return (
    <div className="space-y-6">
      <ManageTabs eventId={params.id} />
      <header>
        <h1 className="text-xl font-semibold">Team</h1>
        <p className="text-sm text-muted-foreground">Manage members and roles for event ID: {params.id}</p>
      </header>

      {error && (
        <div className="rounded-md border border-rose-300 bg-rose-50 text-rose-800 px-3 py-2 text-sm">{error}</div>
      )}
      {banner && (
        <div className="rounded-md border border-emerald-300 bg-emerald-50 text-emerald-800 px-3 py-2 text-sm">{banner}</div>
      )}

      {/* Tabs */}
      <div className="border-b">
        <div className="flex items-center gap-6">
          <button
            className={`relative pb-2 text-sm ${activeTab === 'members' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab('members')}
          >
            Members
            <span className={`pointer-events-none absolute left-0 right-0 -bottom-px h-0.5 rounded-full bg-indigo-600 transition-transform ${activeTab === 'members' ? 'scale-x-100' : 'scale-x-0'}`} />
          </button>
          <button
            className={`relative pb-2 text-sm ${activeTab === 'roles' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab('roles')}
          >
            Roles and Privileges
            <span className={`pointer-events-none absolute left-0 right-0 -bottom-px h-0.5 rounded-full bg-indigo-600 transition-transform ${activeTab === 'roles' ? 'scale-x-100' : 'scale-x-0'}`} />
          </button>
        </div>
      </div>

      {activeTab === 'members' ? (
        <div className="space-y-8">
          {/* Event Members */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Event Members ({filteredEventMembers.length})</h2>
              <button onClick={() => setInviteOpen(true)} className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700">+ Add Event Members</button>
            </div>
            <div className="flex items-center justify-between gap-3">
              <input
                className="w-80 max-w-full rounded-md border px-3 py-2 text-sm"
                placeholder="Search"
                value={searchEventMembers}
                onChange={(e) => { setSearchEventMembers(e.target.value); setPage(1); }}
              />
              <div className="flex items-center gap-2 text-slate-500">
                <select className="rounded-md border px-2 py-1 text-xs" value={sortBy} onChange={(e)=>{ setSortBy(e.target.value as any); setPage(1); }}>
                  <option value="name">Name</option>
                  <option value="email">Email</option>
                  <option value="role">Role</option>
                  <option value="status">Status</option>
                  <option value="invitedAt">Invited</option>
                  <option value="joinedAt">Joined</option>
                </select>
                <button title="Sort direction" onClick={()=> setSortDir(d=> d==='ASC'?'DESC':'ASC')} className="rounded-md border px-2 py-1 text-xs hover:bg-slate-50">{sortDir==='ASC'?'ASC':'DESC'}</button>
              </div>
            </div>
            <div className="rounded-md border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="text-left px-4 py-2">Name & Email</th>
                    <th className="text-left px-4 py-2">Role</th>
                    <th className="text-left px-4 py-2">Status</th>
                    <th className="text-left px-4 py-2">Progress</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEventMembers.map(m => (
                    <tr key={m.id} className="border-t">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-semibold">
                            {m.name.split(' ').map(s => s[0]).join('').slice(0,2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium">{m.name}</div>
                            <div className="text-xs text-slate-500">{m.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">{m.role}</td>
                      <td className="px-4 py-3 text-slate-600">
                        <span className="mr-2">{m.status}</span>
                        {m.statusAgo && <span className="text-xs text-slate-400">· {m.statusAgo}</span>}
                      </td>
                      <td className="px-4 py-3 w-64">
                        <div className="text-xs text-slate-500 mb-1">{m.progressLabel || 'Profile'}</div>
                        <div className="h-2 w-full rounded bg-slate-100 overflow-hidden">
                          <div className="h-2 rounded bg-indigo-600" style={{ width: `${m.progress ?? 0}%` }} />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          {m.status === 'Invited' && (
                            <>
                              <button onClick={() => onApprove(m.email)} className="rounded-md border border-emerald-300 text-emerald-700 px-2 py-1 text-xs hover:bg-emerald-50">Approve</button>
                              <button onClick={() => onReinvite(m.email)} className="rounded-md border px-2 py-1 text-xs hover:bg-slate-50">Resend invite</button>
                            </>
                          )}
                          {m.status === 'Rejected' && (
                            <button onClick={() => onReinvite(m.email)} className="rounded-md border px-2 py-1 text-xs hover:bg-slate-50">Resend invite</button>
                          )}
                          <button onClick={()=> setEditOpen({ id: m.id, role: m.role, status: m.status as any})} className="rounded-md border px-2 py-1 text-xs hover:bg-slate-50">Edit</button>
                          <button onClick={async ()=>{ 
                            if (status !== 'authenticated') {
                              setBanner('You must be logged in to remove team members')
                              setTimeout(() => setBanner(null), 3000)
                              return
                            }
                            if(confirm('Remove this member?')) { 
                              try { 
                                console.log('Deleting member:', m.id, 'from event:', params.id)
                                await deleteTeamMember(params.id, Number(m.id), accessToken); 
                                await reloadMembers(); 
                                setBanner('Member removed successfully')
                                setTimeout(() => setBanner(null), 2500)
                              } catch(e:any){ 
                                console.error('Delete member error:', e)
                                setBanner(e?.message||'Delete failed'); 
                                setTimeout(()=> setBanner(null), 3000) 
                              } 
                            } 
                          }} className="rounded-md border border-rose-300 text-rose-700 px-2 py-1 text-xs hover:bg-rose-50">Remove</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredEventMembers.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">No members found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-600">
              <div>Page {page} of {totalPages}</div>
              <div className="flex items-center gap-2">
                <button disabled={page<=1} onClick={()=> setPage(p=> Math.max(1, p-1))} className="rounded-md border px-2 py-1 disabled:opacity-50">Prev</button>
                <button disabled={page>=totalPages} onClick={()=> setPage(p=> Math.min(totalPages, p+1))} className="rounded-md border px-2 py-1 disabled:opacity-50">Next</button>
                <select className="rounded-md border px-2 py-1" value={limit} onChange={(e)=> { setLimit(parseInt(e.target.value)); setPage(1); }}>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
          </section>

        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-md border bg-white">
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold">Event Team Roles</h2>
                <p className="text-sm text-slate-600 mt-1">Define roles and their permissions for event team members</p>
              </div>
              <button 
                onClick={() => setActiveTab('roles')}
                className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
              >
                + Add Custom Role
              </button>
            </div>
            <div className="divide-y">
              {/* Event Owner */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-medium">Event Owner</h3>
                    <p className="text-sm text-slate-600">Full control over the event and all settings</p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800">System Role</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-700">
                    <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Manage event details
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Invite/remove team members
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Manage registrations
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    View all reports
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Delete event
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Full access
                  </div>
                </div>
              </div>

              {/* Coordinator */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-medium">Coordinator</h3>
                    <p className="text-sm text-slate-600">Manage event operations and registrations</p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">Standard Role</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-700">
                    <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Edit event details
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Manage registrations
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    View reports
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Manage sessions
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    Cannot delete event
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    Cannot remove owner
                  </div>
                </div>
              </div>

              {/* Event Staff */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-medium">Event Staff</h3>
                    <p className="text-sm text-slate-600">Check-in attendees and view event information</p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">Standard Role</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-700">
                    <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    View event details
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Check-in attendees
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    View attendee list
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    Cannot edit event
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    Cannot view reports
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    Limited access
                  </div>
                </div>
              </div>

              {/* Vendor */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-medium">Vendor</h3>
                    <p className="text-sm text-slate-600">Manage booth/service information</p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">External Role</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-700">
                    <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    View event details
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Manage booth info
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    View schedule
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    Cannot edit event
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    Cannot view attendees
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    Read-only access
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-md border bg-amber-50 border-amber-200 p-4">
            <div className="flex items-start gap-3">
              <svg className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="font-medium text-amber-900">About Event Team Roles</h3>
                <p className="text-sm text-amber-800 mt-1">These roles apply only to this specific event. They are different from system-wide roles (SUPER_ADMIN, ADMIN, EVENT_MANAGER, USER) which control access across the entire platform.</p>
                <p className="text-sm text-amber-800 mt-2">As a <strong>SUPER_ADMIN</strong>, you have full access to all events and can override any permission restrictions.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {inviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-lg border bg-white p-4 shadow-lg dark:bg-slate-900">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold">Add Event Members</h3>
              <button onClick={() => setInviteOpen(false)} className="rounded-md border px-2 py-1 text-xs">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-600 mb-1">Emails</label>
                <textarea
                  className="w-full rounded-md border px-3 py-2 text-sm min-h-28"
                  placeholder="Enter emails separated by commas or new lines"
                  value={inviteEmails}
                  onChange={(e) => setInviteEmails(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Role</label>
                <select
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                >
                  <option>Event Staff</option>
                  <option>Event Owner</option>
                  <option>Coordinator</option>
                  <option>Vendor</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Select from Company Users</label>
                <div className="max-h-48 overflow-auto rounded border">
                  {loadingCompanyUsers ? (
                    <div className="p-3 text-xs text-slate-500">Loading users…</div>
                  ) : (companyUsers?.length || 0) === 0 ? (
                    <div className="p-3 text-xs text-slate-500">No users found for your company</div>
                  ) : (
                    <ul className="divide-y">
                      {companyUsers.map((u: any) => (
                        <li key={u.id || u.email} className="flex items-center gap-2 p-2 text-sm">
                          <input
                            type="checkbox"
                            checked={!!selectedCompanyEmails[u.email]}
                            onChange={() => setSelectedCompanyEmails(prev => ({ ...prev, [u.email]: !prev[u.email] }))}
                          />
                          <div className="flex-1">
                            <div className="font-medium">{u.name || u.email}</div>
                            <div className="text-xs text-slate-500">{u.email}</div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Selected users will be added along with any typed emails.</p>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button onClick={() => setInviteOpen(false)} className="rounded-md border px-3 py-1.5 text-sm">Cancel</button>
                <button onClick={onInvite} className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700">Send Invites</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-lg border bg-white p-4 shadow-lg dark:bg-slate-900">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold">Edit Member</h3>
              <button onClick={()=> setEditOpen(null)} className="rounded-md border px-2 py-1 text-xs">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-600 mb-1">Role</label>
                <input className="w-full rounded-md border px-3 py-2 text-sm" value={editOpen.role} onChange={(e)=> setEditOpen(prev=> prev? { ...prev, role: e.target.value } : prev)} />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Status</label>
                <select className="w-full rounded-md border px-3 py-2 text-sm" value={editOpen.status} onChange={(e)=> setEditOpen(prev=> prev? { ...prev, status: e.target.value as any } : prev)}>
                  <option value="Invited">Invited</option>
                  <option value="Joined">Joined</option>
                </select>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button onClick={()=> setEditOpen(null)} className="rounded-md border px-3 py-1.5 text-sm">Cancel</button>
                <button onClick={async ()=> {
                  if (!editOpen) return
                  try {
                    await updateTeamMember(params.id, Number(editOpen.id), { role: editOpen.role, status: editOpen.status === 'Joined' ? 'JOINED' : 'INVITED' }, accessToken)
                    await reloadMembers()
                    setEditOpen(null)
                    setBanner('Member updated')
                    setTimeout(()=> setBanner(null), 2500)
                  } catch(e:any) {
                    setBanner(e?.message||'Update failed')
                    setTimeout(()=> setBanner(null), 3000)
                  }
                }} className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
