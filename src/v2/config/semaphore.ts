// Escala de semaforo unica de v2 (HC#6). Centraliza la escala 0-3 que antes
// vivia hardcodeada en el FE. Cada nivel expone:
//   - value: el valor numerico (0..3) que se persiste/calcula.
//   - key:   identificador estable, seguro para usar en codigo/i18n.
//   - label: etiqueta legible (es-EC) para mostrar al usuario.
//   - color: PLACEHOLDER de color. El FE alineara el hex real con su tema; estos
//            son valores indicativos documentados, NO una decision de marca.
//
// NOTA: los umbrales red/yellow/green (que mapean una puntuacion a un nivel del
// semaforo) NO viven aqui: son configurables por catalogo y se almacenan en los
// campos `red`/`yellow`/`green` de `Type` e `Indicator`. Esta escala solo define
// los niveles canonicos y su presentacion.

export interface SemaphoreLevel {
  value: number
  key: string
  label: string
  color: string
}

export const SEMAPHORE_SCALE: readonly SemaphoreLevel[] = [
  { value: 0, key: 'no-evaluado', label: 'No evaluado', color: '#9e9e9e' },
  { value: 1, key: 'inaceptable', label: 'Inaceptable', color: '#e53935' },
  { value: 2, key: 'debajo', label: 'Debajo de lo aceptable', color: '#fbc02d' },
  { value: 3, key: 'aceptable', label: 'Aceptable', color: '#43a047' }
] as const

// Nota documentada para los consumidores del recurso /config/semaphore.
export const SEMAPHORE_NOTE =
  'Los umbrales red/yellow/green (puntuacion -> nivel) son configurables por ' +
  'catalogo y viven en los campos red/yellow/green de Type e Indicator. Los ' +
  'colores son placeholders; el frontend alinea el hex con su tema.'

export default SEMAPHORE_SCALE
