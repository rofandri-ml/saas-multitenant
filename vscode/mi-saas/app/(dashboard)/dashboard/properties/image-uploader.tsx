'use client'

import { useState } from 'react'
import Image from 'next/image'
import { upload } from '@vercel/blob/client'
import { ImagePlusIcon, XIcon } from 'lucide-react'
import { Label } from '@/components/ui/label'

// Subida de imágenes con client uploads de Vercel Blob: cada archivo va directo
// del navegador a Blob (vía /api/upload, que emite el token). Las URLs resultantes
// se exponen al PropertyForm como inputs ocultos name="images" (la primera = portada).
export function ImageUploader({ initialImages = [] }: { initialImages?: string[] }) {
  const [urls, setUrls] = useState<string[]>(initialImages)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = '' // permitir re-elegir el mismo archivo
    if (files.length === 0) return

    setUploading(true)
    setError(null)
    try {
      const uploaded = await Promise.all(
        files.map(async (file) => {
          const blob = await upload(file.name, file, {
            access: 'public',
            handleUploadUrl: '/api/upload',
          })
          return blob.url
        }),
      )
      setUrls((prev) => [...prev, ...uploaded])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo subir la imagen')
    } finally {
      setUploading(false)
    }
  }

  function removeImage(url: string) {
    setUrls((prev) => prev.filter((u) => u !== url))
  }

  return (
    <div className="space-y-2">
      <Label>Imágenes</Label>

      {/* El form las lee con getAll('images'); la primera es la portada. */}
      {urls.map((url) => (
        <input key={url} type="hidden" name="images" value={url} />
      ))}

      <div className="flex flex-wrap gap-3">
        {urls.map((url, i) => (
          <div key={url} className="relative size-24 overflow-hidden rounded-lg ring-1 ring-border">
            <Image src={url} alt="" fill sizes="96px" className="object-cover" />
            <button
              type="button"
              onClick={() => removeImage(url)}
              aria-label="Quitar imagen"
              className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
            >
              <XIcon className="size-3.5" />
            </button>
            {i === 0 && (
              <span className="absolute inset-x-0 bottom-0 bg-primary/90 py-0.5 text-center text-[10px] font-semibold text-primary-foreground">
                Portada
              </span>
            )}
          </div>
        ))}

        <label className="flex size-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
          <ImagePlusIcon className="size-5" />
          {uploading ? 'Subiendo…' : 'Agregar'}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={uploading}
            onChange={handleFiles}
            className="hidden"
          />
        </label>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
