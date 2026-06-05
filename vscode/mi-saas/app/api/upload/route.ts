import { auth } from '@clerk/nextjs/server'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { NextResponse } from 'next/server'

// Client uploads de Vercel Blob: el archivo va directo del navegador a Blob,
// evitando el límite de 4.5 MB de los Route Handlers / Server Actions y funcionando
// en producción. Este handler solo emite el token de subida (tras chequear auth).
// Requiere la env BLOB_READ_WRITE_TOKEN (la lee handleUpload automáticamente).
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        // Solo usuarios autenticados pueden generar un token de subida.
        const { userId } = await auth()
        if (!userId) throw new Error('No autorizado')

        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp'],
          addRandomSuffix: true,
        }
      },
      onUploadCompleted: async () => {
        // Callback server-to-server de Blob al completar (no corre en localhost).
        // Las URLs las maneja el cliente; acá no hace falta hacer nada.
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 })
  }
}
