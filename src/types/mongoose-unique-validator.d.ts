declare module 'mongoose-unique-validator' {
  import { Schema } from 'mongoose'

  interface UniqueValidatorOptions {
    message?: string
    type?: string
  }

  function uniqueValidator (schema: Schema, options?: UniqueValidatorOptions): void

  export = uniqueValidator
}
