'use client'

import { useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

// Galería de la ficha: imagen grande + tira de miniaturas; al tocar una miniatura
// se muestra ampliada arriba. (Solo presentación; no necesita deps externas.)
// Compartida por la ficha del panel y la ficha pública.
export function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0)

  return (
    <div>
      <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-secondary ring-1 ring-border">
        <Image
          src={images[active]}
          alt={alt}
          fill
          sizes="(max-width: 896px) 100vw, 896px"
          className="object-cover"
          priority
        />
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Ver imagen ${i + 1}`}
              className={cn(
                'relative size-20 shrink-0 overflow-hidden rounded-lg transition',
                i === active ? 'ring-2 ring-primary' : 'opacity-75 ring-1 ring-border hover:opacity-100',
              )}
            >
              <Image src={url} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
