// Calificaciones 0-3 usadas en utils/middleware.js (qualifySubindicator / updateIndicator).
// 0 = gris, 1 = rojo, 2 = amarillo, 3 = verde.
export enum Qualification {
  Gray = 0,
  Red = 1,
  Yellow = 2,
  Green = 3
}

export const QUALIFICATION_LABELS: Record<Qualification, string> = {
  [Qualification.Gray]: 'gris',
  [Qualification.Red]: 'rojo',
  [Qualification.Yellow]: 'amarillo',
  [Qualification.Green]: 'verde'
}
