/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  testEnvironment: 'node',
  // ts-jest transforma los modelos .ts; babel-jest no es necesario porque
  // ts-jest tambien procesa los .js de los controladores cuando lo pedimos.
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        // Los modelos usan `export =` (CommonJS); el tsconfig del repo ya
        // emite CommonJS, asi que reutilizamos esa configuracion.
        tsconfig: 'tsconfig.json',
        diagnostics: false
      }
    ]
  },
  // Los .js (app.js, controllers/*, utils/*) se ejecutan tal cual con Node.
  transformIgnorePatterns: ['/node_modules/'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  // Carga variables de entorno (.env) y SECRET/ROL_* antes de cualquier test.
  setupFiles: ['./test/setup.js'],
  globalTeardown: './test/teardown.js',
  testMatch: ['**/test/**/*.test.js'],
  testTimeout: 30000
}
