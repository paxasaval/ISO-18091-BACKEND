// Utilidad minima de slugify para la capa de migracion v2.
// No depende de librerias externas (no hay slug en package.json).
// Reglas: minusculas, acentos normalizados, espacios/signos -> guion,
// guiones multiples colapsados, guiones al inicio/fin eliminados.

export const slugify = (text: string): string => {
  return text
    .normalize('NFD')                        // descompone acentos
    .replace(/[̀-ͯ]/g, '')         // elimina diacriticos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')           // conserva alfanum, espacio y guion
    .replace(/[\s]+/g, '-')                 // espacios -> guion
    .replace(/-+/g, '-')                    // colapsa guiones multiples
    .replace(/^-|-$/g, '')                  // recorta guiones extremos
}
