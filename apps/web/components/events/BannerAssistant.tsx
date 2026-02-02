'use client'

import { useState, useEffect } from 'react'

interface BannerAssistantProps {
    open: boolean
    onClose: () => void
    onSelectImage: (url: string) => void
    onApplyTagline: (text: string) => void
    onSelectTheme: (hex: string) => void
    onSelectPalette: (arr: string[]) => void
}

export function BannerAssistant({ open, onClose, onSelectImage, onApplyTagline, onSelectTheme, onSelectPalette }: BannerAssistantProps) {
    const [tab, setTab] = useState<'images' | 'themes' | 'taglines' | 'language'>('images')
    const [loading, setLoading] = useState(false)
    const [images, setImages] = useState<Array<{ id: string; download_url: string; author: string }>>([])
    const [palettes, setPalettes] = useState<string[][]>([])
    const [tagline, setTagline] = useState<string>('')
    const [lang, setLang] = useState<string>('en')
    const [translating, setTranslating] = useState(false)

    useEffect(() => {
        if (!open) return
        setLoading(true)
            ; (async () => {
                try {
                    const res = await fetch('https://picsum.photos/v2/list?page=2&limit=18')
                    const data = await res.json().catch(() => [])
                    if (Array.isArray(data)) setImages(data)
                } catch { }
                setLoading(false)
            })()
    }, [open])

    useEffect(() => {
        if (!open) return
            ; (async () => {
                try {
                    const seeds = ['0047AB', 'D97706', '16A34A', '7C3AED']
                    const out: string[][] = []
                    for (const s of seeds) {
                        const u = `https://www.thecolorapi.com/scheme?hex=${s}&mode=analogic&count=5`
                        const res = await fetch(u)
                        const json = await res.json().catch(() => null)
                        const cols = Array.isArray(json?.colors) ? json.colors.map((c: any) => c?.hex?.value).filter(Boolean) : []
                        if (cols.length) out.push(cols)
                    }
                    setPalettes(out)
                } catch { }
            })()
    }, [open])

    useEffect(() => {
        if (!open) return
            ; (async () => {
                try {
                    const res = await fetch('https://api.quotable.io/random?tags=success|inspirational|technology')
                    const q = await res.json().catch(() => null)
                    if (q?.content) setTagline(q.content)
                } catch { }
            })()
    }, [open])

    const translateTagline = async (target: string) => {
        setTranslating(true)
        try {
            const res = await fetch('https://libretranslate.com/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ q: tagline, source: 'en', target, format: 'text' }),
            })
            if (res.ok) {
                const j = await res.json().catch(() => null)
                const out = j?.translatedText || tagline
                setTagline(out)
                setLang(target)
            }
        } catch { }
        setTranslating(false)
    }

    if (!open) return null
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
            <div className="w-full max-w-3xl rounded-lg border bg-white shadow-lg" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b">
                    <div className="font-semibold">Banner assistant</div>
                    <button className="text-sm px-2 py-1 rounded border hover:bg-slate-50" onClick={onClose}>Close</button>
                </div>
                <div className="px-4 pt-3 border-b">
                    <div className="flex items-center gap-3 text-sm">
                        <button className={`px-3 py-2 rounded ${tab === 'images' ? 'bg-indigo-600 text-white' : 'border'}`} onClick={() => setTab('images')}>Images</button>
                        <button className={`px-3 py-2 rounded ${tab === 'themes' ? 'bg-indigo-600 text-white' : 'border'}`} onClick={() => setTab('themes')}>Themes</button>
                        <button className={`px-3 py-2 rounded ${tab === 'taglines' ? 'bg-indigo-600 text-white' : 'border'}`} onClick={() => setTab('taglines')}>Taglines</button>
                        <button className={`px-3 py-2 rounded ${tab === 'language' ? 'bg-indigo-600 text-white' : 'border'}`} onClick={() => setTab('language')}>Language</button>
                    </div>
                </div>
                <div className="p-4 max-h-[70vh] overflow-auto">
                    {tab === 'images' && (
                        <div>
                            <div className="mb-3 text-sm text-muted-foreground">Pick a free banner image (Picsum). Selecting will fill your Banner URL.</div>
                            {loading ? (
                                <div className="text-sm text-slate-500">Loading images…</div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {images.map(img => {
                                        const url = `https://picsum.photos/id/${img.id}/1200/600`
                                        return (
                                            <button key={img.id} className="relative group rounded-md overflow-hidden border" onClick={() => onSelectImage(url)}>
                                                <img src={`https://picsum.photos/id/${img.id}/400/200`} alt={img.author} className="w-full h-28 object-cover" loading="lazy" />
                                                <span className="absolute bottom-0 left-0 right-0 text-[10px] bg-black/40 text-white px-2 py-1 truncate">{img.author}</span>
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                    {tab === 'themes' && (
                        <div>
                            <div className="mb-3 text-sm text-muted-foreground">Color ideas from The Color API. Click to copy a hex code to clipboard.</div>
                            <div className="space-y-3">
                                {palettes.map((row, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        {row.map((hex) => (
                                            <button
                                                key={hex}
                                                className="h-10 flex-1 rounded-md border"
                                                style={{ backgroundColor: hex }}
                                                title={hex}
                                                onClick={() => {
                                                    onSelectTheme(hex)
                                                    onSelectPalette(row)
                                                    navigator.clipboard?.writeText(hex).catch(() => { })
                                                }}
                                            />
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {tab === 'taglines' && (
                        <div className="space-y-3">
                            <div className="text-sm text-muted-foreground">Inspirational line from Quotable. Edit if you like and apply to Description.</div>
                            <textarea className="w-full rounded-md border p-2 text-sm" rows={3} value={tagline} onChange={(e) => setTagline(e.target.value)} />
                            <div className="flex items-center gap-2">
                                <button className="rounded-md border px-3 py-2 text-sm hover:bg-slate-50" onClick={async () => { try { const r = await fetch('https://api.quotable.io/random?tags=success|inspirational|technology'); const q = await r.json(); if (q?.content) setTagline(q.content) } catch { } }}>Randomize</button>
                                <button className="rounded-md bg-indigo-600 text-white px-3 py-2 text-sm" onClick={() => onApplyTagline(tagline)}>Apply to Description</button>
                            </div>
                        </div>
                    )}
                    {tab === 'language' && (
                        <div className="space-y-3">
                            <div className="text-sm text-muted-foreground">Translate the current tagline using LibreTranslate.</div>
                            <div className="flex items-center gap-2">
                                <select className="rounded-md border px-2 py-1 text-sm" value={lang} onChange={(e) => setLang(e.target.value)}>
                                    <option value="en">English</option>
                                    <option value="hi">Hindi</option>
                                    <option value="ta">Tamil</option>
                                    <option value="te">Telugu</option>
                                    <option value="es">Spanish</option>
                                    <option value="fr">French</option>
                                </select>
                                <button className="rounded-md border px-3 py-2 text-sm hover:bg-slate-50" onClick={() => translateTagline(lang)} disabled={translating}>{translating ? 'Translating…' : 'Translate'}</button>
                                <button className="rounded-md bg-indigo-600 text-white px-3 py-2 text-sm" onClick={() => onApplyTagline(tagline)}>Apply to Description</button>
                            </div>
                            <textarea className="w-full rounded-md border p-2 text-sm" rows={3} value={tagline} onChange={(e) => setTagline(e.target.value)} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
