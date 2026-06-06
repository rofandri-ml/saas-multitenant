import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createProperty } from '@/app/actions'
import { PropertyForm } from '../property-form'

export default async function NewPropertyPage() {
  const { userId } = await auth()
  if (!userId) redirect('/dashboard')

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 font-serif text-3xl font-semibold text-primary">Publicar propiedad</h1>
      <PropertyForm action={createProperty} submitLabel="Publicar propiedad" />
    </div>
  )
}
