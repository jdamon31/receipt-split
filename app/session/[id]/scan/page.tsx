'use client'

import { useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ShareBanner } from '@/components/share-banner'

export default function ScanPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (f: File) => {
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f?.type.startsWith('image/')) handleFile(f)
  }

  const submit = async () => {
    if (!file) return
    setUploading(true)
    setError(null)
    const form = new FormData()
    form.append('image', file)
    const res = await fetch(`/api/session/${id}/receipt`, { method: 'POST', body: form })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Something went wrong. Please try again.')
      setUploading(false)
      return
    }
    router.push(`/session/${id}/review`)
  }

  return (
    <main className="min-h-screen p-6 max-w-md mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Scan Receipt</h1>
        <p className="text-muted-foreground text-sm">
          Take a photo or upload an image of the receipt.
        </p>
      </div>

      <ShareBanner sessionId={id} />

      {/* Upload area */}
      <div
        className="border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer hover:border-primary/60 transition-colors"
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
      >
        {preview ? (
          <img src={preview} alt="Receipt preview" className="max-h-64 mx-auto rounded-xl object-contain" />
        ) : (
          <div className="space-y-2">
            <div className="text-4xl">📷</div>
            <p className="font-medium">Tap to upload or drag &amp; drop</p>
            <p className="text-xs text-muted-foreground">JPG, PNG, HEIC supported</p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        />
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-3">{error}</p>
      )}

      {file && (
        <Button
          size="lg"
          className="w-full h-14 rounded-xl text-base"
          onClick={submit}
          disabled={uploading}
        >
          {uploading ? '🔍 Reading receipt…' : '✓ Looks good — continue'}
        </Button>
      )}
    </main>
  )
}
