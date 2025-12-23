# Speaker Edit Form Enhancement Guide

## Current Issue
The speaker edit form is missing:
1. Photo upload functionality
2. Session selection dropdown

## Location
File: `/apps/web/app/events/[id]/speakers/page.tsx`
Component: `SpeakerRow` (lines 195-256)

## Changes Needed

### 1. Add State Variables to SpeakerRow Component

After line 202, add:
```typescript
const [uploading, setUploading] = useState(false)
const [uploadError, setUploadError] = useState<string | null>(null)
const [sessions, setSessions] = useState<any[]>([])
const [selectedSessionId, setSelectedSessionId] = useState('')
```

### 2. Add useEffect to Load Sessions

After the state declarations, add:
```typescript
useEffect(() => {
  if (editing) {
    fetch(`/api/events/${eventId}/sessions`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : Promise.reject('Failed'))
      .then(d => {
        const sessionsList = d.sessions || d.content || []
        setSessions(sessionsList)
      })
      .catch(e => {
        console.error('Sessions fetch error:', e)
        setSessions([])
      })
  }
}, [editing, eventId])
```

### 3. Replace the Edit Form (lines 239-251)

Replace the entire edit form section with:

```typescript
      ) : (
        <div className="space-y-3">
          {err && <div className="text-xs text-rose-600">{err}</div>}
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Name *</label>
              <input 
                value={name} 
                onChange={e => setName(e.target.value)} 
                className="w-full rounded-md border px-2 py-1.5 text-sm" 
                placeholder="Name" 
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Title</label>
              <input 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                className="w-full rounded-md border px-2 py-1.5 text-sm" 
                placeholder="Title" 
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-xs text-slate-500 mb-1">Photo URL</label>
              <input 
                value={photoUrl} 
                onChange={e => setPhotoUrl(e.target.value)} 
                className="w-full rounded-md border px-2 py-1.5 text-sm" 
                placeholder="https://..." 
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-xs text-slate-500 mb-1">Or upload photo</label>
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  try {
                    setUploadError(null)
                    setUploading(true)
                    const fd = new FormData()
                    fd.append('file', file)
                    const res = await fetch('/api/uploads', { method: 'POST', body: fd })
                    const data = await res.json().catch(() => null)
                    if (!res.ok) throw new Error(data?.message || 'Upload failed')
                    if (data?.url) setPhotoUrl(data.url)
                  } catch (err: any) {
                    setUploadError(err?.message || 'Upload failed')
                  } finally {
                    setUploading(false)
                  }
                }}
                className="w-full text-sm"
              />
              {uploading ? <div className="mt-1 text-xs text-slate-500">Uploading...</div> : null}
              {uploadError ? <div className="mt-1 text-xs text-rose-600">{uploadError}</div> : null}
              {photoUrl ? (
                <div className="mt-2 flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoUrl} alt="Preview" className="h-12 w-12 rounded-full object-cover border" />
                  <span className="text-xs text-slate-500">Preview</span>
                </div>
              ) : null}
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-xs text-slate-500 mb-1">Assign to Session (Optional)</label>
              <select 
                value={selectedSessionId} 
                onChange={e => setSelectedSessionId(e.target.value)} 
                className="w-full rounded-md border px-2 py-1.5 text-sm bg-white"
              >
                <option value="">-- No session change --</option>
                {sessions.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.title || `Session ${s.id}`}
                  </option>
                ))}
              </select>
              {sessions.length === 0 && (
                <p className="mt-1 text-xs text-amber-600">
                  💡 Create sessions first to assign speakers
                </p>
              )}
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-xs text-slate-500 mb-1">Bio</label>
              <textarea 
                value={bio} 
                onChange={e => setBio(e.target.value)} 
                className="w-full rounded-md border px-2 py-1.5 text-sm min-h-20" 
                placeholder="Bio" 
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              disabled={busy} 
              onClick={save} 
              className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
            >
              Save
            </button>
            <button 
              disabled={busy} 
              onClick={() => setEditing(false)} 
              className="rounded-md border px-3 py-1.5 text-xs"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
```

## Summary of Changes

1. **Added state for photo upload**: `uploading`, `uploadError`
2. **Added state for sessions**: `sessions`, `selectedSessionId`
3. **Added useEffect**: Loads sessions when editing starts
4. **Enhanced form**: Now includes:
   - Photo URL input
   - Photo file upload with preview
   - Session selection dropdown
   - Better labels and layout
   - Upload progress indicator
   - Error messages

## Result

After these changes, the speaker edit form will have the same functionality as the add form:
- ✅ Upload photos
- ✅ Change session assignment
- ✅ Edit bio (already working)
- ✅ Better UX with labels and previews

## Testing

1. Click "Edit" on a speaker
2. Try uploading a photo
3. Try selecting a different session
4. Save and verify changes persist
