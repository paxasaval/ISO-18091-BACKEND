const mongoose = require('mongoose')
const supertest = require('supertest')
//const helper = require('./test_helper')
const app = require('../app')
const api = supertest(app)
//const User = require('../models/users')


test('user are returned as json', async () => {
  await api
    .get('/api/users')
    .expect(200)
    .expect('Content-Type', /application\/json/)
}, 100000)

test('there are three users',async () => {
  const response = await api.get('/api/users')

  expect(response.body).toHaveLength(3)
})

test('the first user is Juan Pérez',async () => {
  const response = await api.get('/api/users')

  expect(response.body[0].name).toBe('Juan Pérez')
})

afterAll(() => {
  mongoose.connection.close()
})