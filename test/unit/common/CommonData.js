const currentUser = {
  userId: '00000000-0000-0000-0000-000000000000',
  isMachine: true,
  scopes: []
}

const UsrTCConnCopilot = {
  userId: '14848314',
  handle: 'TCConnCopilot'
}

const userWithManagePermission = {
  hasManagePermission: true
}
const regularUser = {
  userId: '222'
}
const ESClient = {
  create: () => {},
  update: () => {},
  delete: () => {},
  search: () => {}
}

module.exports = {
  currentUser,
  UsrTCConnCopilot,
  userWithManagePermission,
  regularUser,
  ESClient
}
