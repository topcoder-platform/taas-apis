const express = require('express')
const cors = require('cors')
const config = require('config')
const _ = require('lodash')
const authenticator = require('tc-core-library-js').middleware.jwtAuthenticator

const app = express()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.set('port', config.PORT)

app.use(authenticator(_.pick(config, ['AUTH_SECRET', 'VALID_ISSUERS'])))

app.get('/v5/projects/:id', (req, res) => {
  if (_.includes(req.authUser.roles, 'Connect Manager') || _.includes(req.authUser.roles, 'Connect User')) {
    res.end()
  } else {
    res.status(403).end()
  }
  res.end()
})

app.use((err, req, res, next) => {
  res.status(500).end(err)
})

app.listen(app.get('port'), () => {
  console.log(`Express server listening on port ${app.get('port')}`)
})
