/**
 * Sequelize generated file
 */

const fs = require('fs')
const path = require('path')
// https://github.com/sequelize/sequelize/issues/1774#issuecomment-126714889
require('pg').defaults.parseInt8 = true

const Sequelize = require('sequelize')
const config = require('config')

const basename = path.basename(module.filename)
const db = {}

const sequelize = new Sequelize(config.get('DATABASE_URL'), {
  logging: false
})

// add customized toJSON method to a model
const addMethodOfToJSON = (model) => {
  model.prototype.toJSON = function () {
    const result = Object.assign({}, this.get())
    delete result.deletedAt
    return result
  }
}

fs
  .readdirSync(__dirname)
  .filter(file => (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js'))
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(sequelize)
    addMethodOfToJSON(model)
    db[model.name] = model
  })

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db)
  }
})

db.sequelize = sequelize
db.Sequelize = Sequelize

module.exports = db
