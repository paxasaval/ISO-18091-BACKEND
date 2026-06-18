// Se ejecuta una vez por archivo de test (setupFiles), antes de cargar app.js
// y los controladores. Los controladores leen process.env.ROL_* y
// process.env.SECRET en el momento del require, por lo que deben existir aqui.
require('dotenv').config()

if (!process.env.SECRET) {
  process.env.SECRET = 'test-secret'
}
if (!process.env.ROL_ADMIN) {
  process.env.ROL_ADMIN = 'Administrador'
}
if (!process.env.ROL_USER) {
  process.env.ROL_USER = 'Ciudadano'
}
if (!process.env.ROL_REPONSIBLE) {
  process.env.ROL_REPONSIBLE = 'Responsable'
}
