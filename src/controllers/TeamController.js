/**
 * Controller for TaaS teams endpoints
 */
const service = require('../services/TeamService')

/**
 * Search teams
 * @param req the request
 * @param res the response
 */
async function searchTeams (req, res) {
  res.send(await service.searchTeams(req.authUser))
}

/**
 * Get team
 * @param req the request
 * @param res the response
 */
async function getTeam (req, res) {
  res.send(await service.getTeam(req.authUser, req.params.id))
}

/**
 * Get team job
 * @param req the request
 * @param res the response
 */
async function getTeamJob (req, res) {
  res.send(await service.getTeamJob(req.authUser, req.params.id, req.params.jobId))
}

module.exports = {
  searchTeams,
  getTeam,
  getTeamJob
}
