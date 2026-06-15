// Capa base de acceso a datos de v2 (Fase E0).
//
// Copia del patron de src/repositories/base.repository.ts, sobre los modelos v2
// (colecciones v2_*). CRUD generico + findPage, sin logica de negocio. El tipo
// de documento T se infiere del propio modelo con ModelDocType<M> porque los
// modelos usan `export =` y no exportan su interfaz de documento.

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
  // items y el total de documentos que cumplen el filtro.
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
