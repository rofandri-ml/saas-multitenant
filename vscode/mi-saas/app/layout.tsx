import type { Metadata } from 'next'
import {
  ClerkProvider,
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
  OrganizationSwitcher,
} from '@clerk/nextjs'
import { Fraunces, Hanken_Grotesk } from 'next/font/google'
import './globals.css'

// Títulos: Fraunces (serif con carácter). Cuerpo: Hanken Grotesk. Expuestas como
// variables CSS; el ruteo headings→Fraunces / body→Hanken se hace en globals.css.
const fraunces = Fraunces({ variable: '--font-fraunces', subsets: ['latin'], display: 'swap' })
const hankenGrotesk = Hanken_Grotesk({ variable: '--font-hanken', subsets: ['latin'], display: 'swap' })

export const metadata: Metadata = {
  title: 'Mi SaaS',
  description: 'Plantilla SaaS multi-tenant',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${fraunces.variable} ${hankenGrotesk.variable} antialiased`}>
        <ClerkProvider>
          <header className="flex justify-end items-center p-4 gap-4 h-16">
            <Show when="signed-out">
              <SignInButton />
              <SignUpButton>
                <button className="bg-[#6c47ff] text-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer">
                  Sign Up
                </button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <OrganizationSwitcher />
              <UserButton />
            </Show>
          </header>
          {children}
        </ClerkProvider>
      </body>
    </html>
  )
}
