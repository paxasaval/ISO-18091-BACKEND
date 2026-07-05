// Escala de semaforo unica de v2 (HC#6). Centraliza la escala 0-3 que antes
// vivia hardcodeada en el FE. Cada nivel expone:
//   - value: el valor numerico (0..3) que se persiste/calcula.
//   - key:   identificador estable, seguro para usar en codigo/i18n.
//   - label: etiqueta legible (es-EC) para mostrar al usuario.
//   - color: PLACEHOLDER de color. El FE alineara el hex real con su tema; estos
//            son valores indicativos documentados, NO una decision de marca.
//
// NOTA: los umbrales numericos que mapean una puntuacion (0..1) a un nivel del
// semaforo son GLOBALES y viven en el scoring service
// (SEMAPHORE_RED_THRESHOLD=0.50 / SEMAPHORE_YELLOW_THRESHOLD=0.75 en
// src/v2/services/scoring.service.ts). Los campos `red`/`yellow`/`green` de
// `Type`/`Indicator` NO son umbrales: guardan los descriptores cualitativos de la
// norma ISO (texto). Esta escala solo define los niveles canonicos y su presentacion.

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
  'Los umbrales (puntuacion 0..1 -> nivel) son GLOBALES: rojo < 0.50, ' +
  'amarillo < 0.75, verde >= 0.75. Los campos red/yellow/green de Type/Indicator ' +
  'son descriptores cualitativos de la norma (texto), no umbrales. Los colores ' +
  'son placeholders; el frontend alinea el hex con su tema.'

export default SEMAPHORE_SCALE
