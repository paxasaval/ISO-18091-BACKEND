import 'dotenv/config'

type NodeEnv = 'development' | 'test' | 'production'

const rawNodeEnv = process.env.NODE_ENV
const NODE_ENV: NodeEnv =
  rawNodeEnv === 'test' || rawNodeEnv === 'production'
    ? rawNodeEnv
    : 'development'

const required = (name: string, value: string | undefined): string => {
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

const PORT = process.env.PORT

// En test se usa TEST_MONGODB_URI, replicando utils/config.js
const MONGODB_URI =
  NODE_ENV === 'test'
    ? process.env.TEST_MONGODB_URI
    : process.env.MONGODB_URI

// JWT: hoy leido suelto como process.env.SECRET en los controladores
const SECRET = required('SECRET', process.env.SECRET)

// Rol admin: replica utils/config.js (ROL_ADMIN === ROL_ADMIN_KEY)
const ROL_ADMIN_KEY = process.env.ROL_ADMIN_KEY
const ROL_ADMIN = ROL_ADMIN_KEY

// Rol user: hoy leido suelto como process.env.ROL_USER en los controladores
const ROL_USER = process.env.ROL_USER

// Origenes CORS tomados de app.js (lineas ~40-49)
const DEFAULT_CORS_ORIGINS = [
  'http://localhost:4200',
  'https://iso18091storage.web.app',
  'https://transformaciondigitalgobiernosabiertos.azurewebsites.net',
  'https://iso18091-test.web.app'
]

const CORS_ORIGINS: string[] = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0)
  : DEFAULT_CORS_ORIGINS

export interface EnvConfig {
  NODE_ENV: NodeEnv
  PORT: string | undefined
  MONGODB_URI: string | undefined
  SECRET: string
  ROL_ADMIN: string | undefined
  ROL_ADMIN_KEY: string | undefined
  ROL_USER: string | undefined
  CORS_ORIGINS: string[]
}

export const env: EnvConfig = {
  NODE_ENV,
  PORT,
  MONGODB_URI,
  SECRET,
  ROL_ADMIN,
  ROL_ADMIN_KEY,
  ROL_USER,
  CORS_ORIGINS
}

export default env
