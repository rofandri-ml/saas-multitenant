'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export type AccessState = { error?: string }

// Verifica la contraseña del modo privado contra SITE_ACCESS_PASSWORD. Si coincide,
// setea una cookie httpOnly `site_access` y manda a la home. Gate "blando" de
// pre-lanzamiento: la seguridad real sigue siendo Clerk en /dashboard/*.
export async function verifyAccess(_prevState: AccessState, formData: FormData): Promise<AccessState> {
  const password = (formData.get('password') as string) ?? ''
  const expected = process.env.SITE_ACCESS_PASSWORD

  if (!expected || password !== expected) {
    return { error: 'Contraseña incorrecta.' }
  }

  const cookieStore = await cookies()
  cookieStore.set('site_access', expected, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // en local (http) no se setea si fuera true
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 días
  })

  redirect('/')
}
