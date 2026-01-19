const { test, describe, beforeEach, after } = require('node:test')
const mongoose = require('mongoose')
const app = require('../app')
const supertest = require('supertest')
const assert = require('node:assert')
const Blog = require('../models/blog')
const helper = require('../utils/list_helper')
const User = require('../models/user')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')

const api = supertest(app)

let validUserToken

beforeEach(async () => {
  await Blog.deleteMany({})
  await User.deleteMany({})

  // Create a test user
  const testUser = new User({
    username: 'test user',
    name: 'test user name',
    passwordHash: await bcrypt.hash('testpassword', 10)
  })
  
  // Save test user into db
  const savedUser = await testUser.save()

  // Generate a JWT token for the test user that we can use in the tests
  const userForToken = {
    username: savedUser.username,
    id: savedUser._id,
    name: savedUser.name
  }

  const token = jwt.sign(
    userForToken,
    process.env.SECRET,
    { expiresIn: 3600 }
  )
  
  validUserToken = token

  // Use helper to generate blogs, assigning our created user to them.
  for (let blog of helper.initialBlogs) {
    let blogObject = new Blog({...blog, user: savedUser._id })
    await blogObject.save()
  }
})

test('blogs are returned as json', async () => {
  await api.get('/api/blogs')
  .expect(200)
  .set('Authorization', `Bearer ${validUserToken}`) // Unlike sessions which store login state, JWT requires tokens to be sent in every request
  .expect('Content-Type', /application\/json/)
})

test('there are two blogs', async () => {
  const response = await api.get('/api/blogs').set('Authorization', `Bearer ${validUserToken}`)
  assert.strictEqual(response.body.length, helper.initialBlogs.length)
})

test('first author is called Michael Chan"', async () => {
  const response = await api.get('/api/blogs').set('Authorization', `Bearer ${validUserToken}`)
  const author = response.body.map(e => e.author)
  assert(author[0].includes('Michael Chan'))
})

test('a valid blog can be added', async () => {
  const blogsAtStart = await helper.blogsInDb()

  const newBlog = {
    title: 'How to use ChatGPT 4o for defect detection',
    author: 'Aye Chan Zaw',
    url: 'https://ayechanzaw.com/gpt-4o',
  }

  await api.post('/api/blogs').send(newBlog).expect(201).expect('Content-Type', /application\/json/).set('Authorization', `Bearer ${validUserToken}`)

  const blogsAtEnd = await helper.blogsInDb()
  assert.strictEqual(blogsAtEnd.length, blogsAtStart.length + 1)

  const titles = blogsAtEnd.map(b => b.title)
  assert(titles.includes('How to use ChatGPT 4o for defect detection'))

})

test('blog without title is not added', async () => {

  const blogsAtStart = await helper.blogsInDb()

  const newBlog = {
    url: 'https://ayechanzaw.com/gpt-4o',
    author: "Aye Chan Zaw"
  }

  await api.post('/api/blogs').send(newBlog).expect(400).set('Authorization', `Bearer ${validUserToken}`)

  const blogsAtEnd = await helper.blogsInDb()

  assert.strictEqual(blogsAtStart.length, blogsAtEnd.length)
})

test('blog without url is not added', async () => {

  const blogsAtStart = await helper.blogsInDb()

  const newBlog = {
    title: "How to prompt gpt-4o for defect detection",
    author: "Aye Chan Zaw"
  }

  await api.post('/api/blogs').send(newBlog).expect(400).set('Authorization', `Bearer ${validUserToken}`)

  const blogsAtEnd = await helper.blogsInDb()

  assert.strictEqual(blogsAtStart.length, blogsAtEnd.length)
})

test('when blogs are added and then retrieved, we retrieve the id field and not the _id field', async () => {
  const blogsAtStart = await helper.blogsInDb()

  blogsAtStart.forEach((blog) => {
    assert.ok(blog.id, 'Blog should have id property')
    assert.equal(blog._id, undefined, 'Blog should not have an _id property') 
  })
})

test('If likes property missing, return value 0', async () => {
  await Blog.deleteMany({})

  const newBlog = {
    url: 'https://ayechanzaw.com/gpt-4o',
    author: "Aye Chan Zaw",
    title: "How to prompt gpt-4o for defect detection"

  }
  await api.post('/api/blogs').send(newBlog).expect(201).set('Authorization', `Bearer ${validUserToken}`)

  const blogsAtEnd = await helper.blogsInDb()
  const addedBlog = blogsAtEnd[0]

  assert.equal(addedBlog.likes, 0)
})

test('a blog can be deleted', async () => {
  const blogsAtStart = await helper.blogsInDb()
  const blogToDelete = blogsAtStart[0]

  await api.delete(`/api/blogs/${blogToDelete.id}`).expect(204).set('Authorization', `Bearer ${validUserToken}`)

  const blogsAtEnd = await helper.blogsInDb()
  const titles = blogsAtEnd.map(r => r.title)

  assert(!titles.includes(blogToDelete.title))
  assert.strictEqual(blogsAtStart.length, blogsAtEnd.length + 1)
})

test('a blog can be updated', async () => {
  const blogsAtStart = await helper.blogsInDb()
  const blogToUpdate = blogsAtStart[0]

  const newBlog = {
    title: "How to prompt gpt-4.5 for defect detection",
    author: "Aye Chan Zaw",
    url: 'https://ayechanzaw.com/gpt-4o'
  }
  
  await api.put(`/api/blogs/${blogToUpdate.id}`, newBlog).expect(200).set('Authorization', `Bearer ${validUserToken}`)

  const blogsAtEnd = await helper.blogsInDb()

  const titles = blogsAtEnd.map(r => r.title)

  assert(!titles.includes(newBlog.title))
  assert.strictEqual(blogsAtStart.length, blogsAtEnd.length)
})

after(async () => {
  await mongoose.connection.close()
})