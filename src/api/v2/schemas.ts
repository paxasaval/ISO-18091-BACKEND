// Schemas zod compartidos entre recursos de /api/v2.
//
// `objectId` valida un string de 24 caracteres hexadecimales (formato de un
// ObjectId de MongoDB). Se mantiene como string: Mongoose castea el string a
// `mongoose.Types.ObjectId` en runtime al crear/actualizar el documento, asi
// que no es necesario convertir aqui.

import { z } from 'zod'

export const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'invalid ObjectId')

export default objectId
