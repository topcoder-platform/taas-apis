/**
 * The mock APIs.
 */

const config = require('config')
const express = require('express')
const cors = require('cors')
const logger = require('../src/common/logger')
const _ = require('lodash')

const skills = [{ name: 'EJB', id: '23e00d92-207a-4b5b-b3c9-4c5662644941' },
  { name: 'Dropwizard', id: '7d076384-ccf6-4e43-a45d-1b24b1e624aa' },
  { name: 'NGINX', id: 'cbac57a3-7180-4316-8769-73af64893158' },
  { name: 'Machine Learning', id: 'a2b4bc11-c641-4a19-9eb7-33980378f82e' },
  { name: 'Force.com', id: '94eae221-1158-4aa9-a6a4-50ecb0bbb8b6' },
  { name: 'Database', id: '2742759c-d0f9-4456-9482-e558aa960969' },
  { name: 'Winforms', id: 'b81859b6-4c50-45d8-afcb-71b35d16ea1e' },
  { name: 'User Interface (Ui)', id: '17b61c7a-98dc-498d-ba8d-c52b6677d73c' },
  { name: 'Photoshop', id: '30d01540-ebed-46b6-88e7-4c210de63862' },
  { name: 'Docker', id: 'bd417c10-d81a-45b6-85a9-d79efe86b9bb' },
  { name: '.NET', id: '4fce6ced-3610-443c-92eb-3f6d76b34f5c' }]

const projects = [

  { id: 111, name: 'Project-111', invites: 1, members: [{ userId: 40158994 }, { userId: 88774634 }] },
  { id: 112, name: 'Project-112', invites: 1, members: [{ userId: 40158994 }, { userId: 88774634 }] },
  { id: 113, name: 'Project-113', invites: 1, members: [{ userId: 40158994 }, { userId: 88774634 }] },
  { id: 222, name: 'Project-222', invites: 1, members: [] }
]

const app = express()
app.set('port', config.MOCK_API_PORT || 4000)
app.use(cors())
app.use(express.json())
app.use((req, res, next) => {
  logger.info({ component: 'Mock Api', message: `${req.method} ${req.url}` })
  next()
})

app.get('/v5/projects', (req, res) => {
  let results = _.cloneDeep(projects)
  if (req.query.name) {
    results = _.filter(results, ['name', req.query.name])
  }
  res.status(200).json(results)
})

app.get('/v5/projects/:projectId', (req, res) => {
  const project = _.find(projects, project => project.id.toString() === req.params.projectId)
  if (project) {
    res.json(project)
  } else {
    res.status(404).end()
  }
})

app.post('/v5/projects/:projectId/members', (req, res) => {
  res.status(200).json(req.body)
})

app.get('/v5/projects/:projectId/members', (req, res) => {
  const project = _.find(projects, project => project.id.toString() === req.params.projectId)
  res.status(200).json(project.members)
})

app.delete('/v5/projects/:projectId/members/:memberId', (req, res) => {
  const project = _.find(projects, project => project.id.toString() === req.params.projectId)
  const member = _.find(project.members, member => member.userId.toString() === req.params.memberId)
  if (member) {
    res.status(204).end()
  } else { res.status(404).end() }
})

app.get('/v5/projects/:projectId/invites', (req, res) => {
  const project = _.find(projects, project => project.id.toString() === req.params.projectId)
  res.status(200).json({ invites: project.invites })
})

app.get('/v5/skills/:skillId', (req, res) => {
  const foundSkill = _.find(skills, ['id', req.params.skillId])
  if (foundSkill) {
    res.status(200).json(foundSkill)
  } else {
    res.status(404).end()
  }
})

app.get('/v5/skills', (req, res) => {
  res.status(200).json(skills)
})

app.get('/v5/users', (req, res) => {
  res.status(200).json([{ id: '00000000-0000-0000-0000-000000000000' }])
})

app.get('/v5/users/:userId', (req, res) => {
  if (_.includes(['99999999-9999-9999-9999-999999999999'], req.params.userId)) {
    res.status(404).end()
  } else {
    res.status(200).json({ id: req.params.userId, userId: req.params.userId, handle: 'userHandle', firstName: 'firstName', lastName: 'lastName' })
  }
})

app.get('/v5/members/:userHandle', (req, res) => {
  res.status(200).json({ email: 'test@gmail.com', handle: req.params.userHandle })
})

app.get('/v5/members', (req, res) => {
  res.status(200).json([{ handleLower: 'userhandle' }])
})

app.get('/v3/users', (req, res) => {
  res.status(200).json({ result: { content: [{ email: 'test@gmail.com', firstName: 'firstName', lastName: 'lastName', handle: 'userhandle', id: 1 }] } })
})

app.get('/v3/members/_search', (req, res) => {
  res.status(200).json({ result: { content: [{ email: 'test@gmail.com', firstName: 'firstName', lastName: 'lastName', handle: 'userhandle', userId: 1 }] } })
})

app.use((req, res) => {
  res.status(404).json({ error: 'route not found' })
})

app.use((err, req, res, next) => {
  logger.logFullError(err, { component: 'Mock Api', signature: `${req.method}_${req.url}` })
  res.status(500).json({
    error: err.message
  })
})

app.listen(app.get('port'), '0.0.0.0', () => {
  logger.info({ component: 'Mock Api', message: `Mock Api listening on port ${app.get('port')}` })
})
