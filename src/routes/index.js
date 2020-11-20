/**
 * Defines the API routes
 */

const fs = require('fs')
const path = require('path')

const modules = {}

fs
  .readdirSync(__dirname)
  .filter(file => (file.indexOf('.') !== 0) && (file !== path.basename(module.filename)) && (file.slice(-3) === '.js'))
  .forEach((file) => {
    const moduleName = file.slice(0, -3)
    modules[moduleName] = require(path.join(__dirname, file))
  })

module.exports = Object.assign({}, ...Object.values(modules))
