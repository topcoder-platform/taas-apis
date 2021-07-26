/**
 * mapping emsi skills to topcoder skills
 */

const fs = require('fs')
const path = require('path')
const logger = require('../../src/common/logger')
const helper = require('../../src/common/helper')

async function mappingSkill () {
  const matchedSkills = {}
  const unMatchedSkills = []
  const failedSkills = []
  let tcSkills
  const startTime = Date.now()
  try {
    tcSkills = await helper.getAllTopcoderSkills()
  } catch (e) {
    logger.error({ component: 'getAllTopcoderSkills', context: 'emsi-mapping', message: JSON.stringify(e) })
  }

  for (let i = 0; i < tcSkills.length; i++) {
    const tcSkill = tcSkills[i]
    let emsiTags
    try {
      emsiTags = await helper.getTags(tcSkill.name)
    } catch (e) {
      failedSkills.push(tcSkill.name)
      logger.error({ component: 'getTags', context: 'emsi-mapping', message: JSON.stringify(e) })
    }
    if (emsiTags.length) {
      matchedSkills[emsiTags[0].tag] = tcSkill.name
    } else {
      unMatchedSkills.push(tcSkill.name)
    }
  }

  const textString = `module.exports = { matchedSkills: ${JSON.stringify(matchedSkills, 2, 3)}, unMatchedSkills: ${JSON.stringify(unMatchedSkills, 2, 2)} }`
  const filePath = path.join(__dirname, 'emsi-skills-mapping.js')
  const result = {
    totalTime: (Date.now() - startTime) / 60 / 1000 + ' min',
    totalSkills: tcSkills.length,
    matchedSkills: tcSkills.length - unMatchedSkills.length,
    unMatchedSkills: unMatchedSkills.length,
    filePath,
    failSkills: failedSkills
  }

  logger.info({ component: 'emsi-mapping', context: 'emsi-mapping', message: JSON.stringify(result) })
  fs.writeFileSync(filePath, textString)
}
mappingSkill()
