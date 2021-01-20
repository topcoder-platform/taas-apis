const fs = require('fs')
const Joi = require('joi')
const path = require('path')
const logger = require('./common/logger')

Joi.page = () => Joi.number().integer().min(1).default(1)
Joi.perPage = () => Joi.number().integer().min(1).default(20)
Joi.rateType = () => Joi.string().valid('hourly', 'daily', 'weekly', 'monthly')
Joi.jobStatus = () => Joi.string().valid('sourcing', 'in-review', 'assigned', 'closed', 'cancelled')
Joi.workload = () => Joi.string().valid('full-time', 'fractional')
Joi.jobCandidateStatus = () => Joi.string().valid('open', 'selected', 'shortlist', 'rejected', 'cancelled')
Joi.title = () => Joi.string().max(128)

function buildServices (dir) {
  const files = fs.readdirSync(dir)

  files.forEach((file) => {
    const curPath = path.join(dir, file)
    fs.stat(curPath, (err, stats) => {
      if (err) return
      if (stats.isDirectory()) {
        buildServices(curPath)
      } else if (path.extname(file) === '.js') {
        const serviceName = path.basename(file, '.js')
        logger.buildService(require(curPath), serviceName)
      }
    })
  })
}

buildServices(path.join(__dirname, 'services'))
