// Normalizacion de nombres de documentos de la biblioteca (v2_source_documents).
//
// DEBE coincidir EXACTAMENTE con la normalizacion del frontend para que el aviso
// de "documento duplicado" del FE y el dedupe del backend traten los mismos
// nombres como iguales. Reglas acordadas FE↔backend:
//   1. trim (quita espacios al inicio/fin)
//   2. minusculas
//   3. colapsar espacios internos (varios espacios -> uno)
//
// NOTA: extensiones (.pdf) y guiones bajos NO se tratan de forma especial: cuentan
// tal cual. Si en el futuro se decide ignorarlos, hay que cambiarlo en AMBOS lados.
export const normalizeSourceName = (name: string): string =>
  String(name ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')

export default normalizeSourceName
