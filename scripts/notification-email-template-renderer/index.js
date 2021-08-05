/**
 * Script for rendering email template
 */
const fs = require('fs')
const Handlebars = require('handlebars')
const path = require('path')

function render (filename, data) {
  const source = fs.readFileSync(filename, 'utf8').toString()
  const template = Handlebars.compile(source)
  const output = template(data)
  return output
}

const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../../data/notifications-email-demo-data.json'), 'utf8'))

const key = process.argv.length >= 3 ? process.argv[2] : 'candidatesAvailableForReview'

if (!data[key]) {
  console.error('Please provide a proper key which is present in notifications.json')
  process.exit(1)
}

const outputDir = path.join(__dirname, '../../out')
const outputFile = path.join(__dirname, '../../out/notifications-email-template-with-data.html')
const result = render(path.join(__dirname, '../../data/notifications-email-template.html'), data[key])
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir)
}
fs.writeFileSync(outputFile, result)

console.log(`Template has been rendered to: ${outputFile}`)
