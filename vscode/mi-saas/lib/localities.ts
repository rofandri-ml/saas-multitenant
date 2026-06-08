// Lista fija de localidades/zonas disponibles para publicar.
// Ejemplos de la Costa Atlántica argentina; editá libremente este array
// (agregá, quitá o reordená) — el formulario y los filtros lo toman de acá.
export const LOCALITIES = [
  'Mar del Plata',
  'Pinamar',
  'Cariló',
  'Villa Gesell',
  'Mar de las Pampas',
  'Mar de Ajó',
  'San Bernardo',
  'Lucila del Mar',
  'San Clemente del Tuyú',
  'Santa Teresita',
  'Necochea',
  'Miramar',
  'Monte Hermoso',
  'Las Toninas',
  'Santa Clara del Mar',
] as const

export type Locality = (typeof LOCALITIES)[number]
