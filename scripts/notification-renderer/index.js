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

const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../../data/notifications.json'), 'utf8'))

const key = process.argv.length >= 3 ? process.argv[2] : 'candidatesAvailableForReview'

if (!data[key]) {
  console.error('Please provide a proper key which is present in notifications.json')
  process.exit(1)
}

const result = render(path.join(__dirname, '../../data/template.html'), data[key])
fs.writeFileSync(path.join(__dirname, 'rendered.html'), result)
