'use client'

import { useActionState } from 'react'
import { LockIcon, AlertCircleIcon } from 'lucide-react'
import { verifyAccess, type AccessState } from './actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SubmitButton } from '@/app/submit-button'

const initialState: AccessState = {}

export function AccessForm() {
  const [state, formAction] = useActionState(verifyAccess, initialState)

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="password">Contraseña de acceso</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoFocus
          autoComplete="current-password"
          placeholder="••••••••"
        />
      </div>

      {state.error && (
        <p className="flex items-center gap-1.5 text-sm text-destructive">
          <AlertCircleIcon className="size-4 shrink-0" />
          {state.error}
        </p>
      )}

      <SubmitButton className="w-full" pendingLabel="Verificando…">
        <LockIcon /> Ingresar
      </SubmitButton>
    </form>
  )
}
