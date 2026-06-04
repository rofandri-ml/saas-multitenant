import { PricingTable } from '@clerk/nextjs'

export default function PricingPage() {
  return (
    <main className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Planes</h1>
      <PricingTable />
    </main>
  )
}