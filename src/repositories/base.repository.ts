// Capa base de acceso a datos (Fase 2B).
//
// Encapsula las operaciones CRUD genericas sobre un Model<T> de Mongoose para
// que la futura capa de servicios (Fase 3) NO dependa directamente de los
// modelos. No contiene logica de negocio: solo traduce intenciones de lectura/
// escritura a llamadas de Mongoose y devuelve documentos/resultados crudos.
//
// Tipado: los modelos legacy usan `export = mongoose.model(...)` con interfaces
// de documento NO exportadas (restriccion de `export =`). Por eso el tipo de
// documento T se infiere DESDE el propio modelo con `ModelDocType<M>`, en lugar
// de importar una interfaz inexistente. Cuando el modelo se importa sin tipo
// (ver auth.ts), T degenera a un tipo laxo, lo cual es aceptable en esta fase.

import {
  Document,
  FilterQuery,
  Model,
  PopulateOptions,
  Query,
  QueryOptions,
  UpdateQuery
} from 'mongoose'

// Opciones de lectura comunes que aceptan los repositorios.
export interface FindOptions {
  populate?: PopulateOptions | (PopulateOptions | string)[] | string
  sort?: Record<string, 1 | -1> | string
  select?: Record<string, 0 | 1> | string
  lean?: boolean
}

// Extrae el tipo de documento T a partir de un Model<T>.
export type ModelDocType<M> = M extends Model<infer T> ? T : never

export class BaseRepository<T extends Document> {
  protected readonly model: Model<T>

  constructor(model: Model<T>) {
    this.model = model
  }

  // Aplica populate/select/sort sobre una query SIN reasignar la variable
  // tipada (populate cambia el ResultType en los tipos de mongoose). Las
  // mutaciones de mongoose son in-place, asi que devolvemos la misma query.
  private applyOptions<Q extends Query<unknown, T>>(
    query: Q,
    options: FindOptions
  ): Q {
    if (options.populate) {
      // populate acepta string | PopulateOptions | (string|PopulateOptions)[];
      // el cast unifica las sobrecargas (no altera el comportamiento runtime).
      query.populate(options.populate as PopulateOptions[])
    }
    if (options.select) {
      query.select(options.select)
    }
    if (options.sort) {
      query.sort(options.sort)
    }
    return query
  }

  async findAll(
    filter: FilterQuery<T> = {},
    options: FindOptions = {}
  ): Promise<T[]> {
    const query = this.applyOptions(this.model.find(filter), options)
    if (options.lean) {
      return query.lean<T[]>().exec()
    }
    return query.exec()
  }

  // Paginacion 1-indexada para /api/v2 (page>=1, size>=1). Devuelve la pagina de
  // items y el total de documentos que cumplen el filtro. Metodo ADITIVO: no
  // altera findAll ni el resto de operaciones usadas por v1.
  async findPage(
    filter: FilterQuery<T> = {},
    page: number,
    size: number,
    options: FindOptions = {}
  ): Promise<{ items: T[]; total: number }> {
    const skip = (page - 1) * size
    const query = this.applyOptions(this.model.find(filter), options)
      .skip(skip)
      .limit(size)
    const [items, total] = await Promise.all([
      options.lean ? query.lean<T[]>().exec() : query.exec(),
      this.model.countDocuments(filter).exec()
    ])
    return { items, total }
  }

  async findById(
    id: string,
    options: FindOptions = {}
  ): Promise<T | null> {
    return this.applyOptions(this.model.findById(id), options).exec()
  }

  async findOne(
    filter: FilterQuery<T>,
    options: FindOptions = {}
  ): Promise<T | null> {
    return this.applyOptions(this.model.findOne(filter), options).exec()
  }

  async create(data: Partial<T>): Promise<T> {
    const doc = new this.model(data)
    return doc.save()
  }

  async updateById(
    id: string,
    data: UpdateQuery<T>,
    opts: QueryOptions = { new: true }
  ): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, data, opts).exec()
  }

  async deleteById(id: string): Promise<T | null> {
    return this.model.findByIdAndDelete(id).exec()
  }

  async count(filter: FilterQuery<T> = {}): Promise<number> {
    return this.model.countDocuments(filter).exec()
  }
}

export default BaseRepository
