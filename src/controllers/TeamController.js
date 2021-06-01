/**
 * Controller for TaaS teams endpoints
 */
const HttpStatus = require('http-status-codes');
const service = require('../services/TeamService');
const helper = require('../common/helper');

/**
 * Search teams
 * @param req the request
 * @param res the response
 */
async function searchTeams(req, res) {
  const result = await service.searchTeams(req.authUser, req.query);
  helper.setResHeaders(req, res, result);
  res.send(result.result);
}

/**
 * Get team
 * @param req the request
 * @param res the response
 */
async function getTeam(req, res) {
  res.send(await service.getTeam(req.authUser, req.params.id));
}

/**
 * Get team job
 * @param req the request
 * @param res the response
 */
async function getTeamJob(req, res) {
  res.send(
    await service.getTeamJob(req.authUser, req.params.id, req.params.jobId)
  );
}

/**
 * Send email through a particular template
 * @param req the request
 * @param res the response
 */
async function sendEmail(req, res) {
  await service.sendEmail(req.authUser, req.body);
  res.status(HttpStatus.NO_CONTENT).end();
}

/**
 * Add members to a team.
 * @param req the request
 * @param res the response
 */
async function addMembers(req, res) {
  res.send(
    await service.addMembers(req.authUser, req.params.id, req.query, req.body)
  );
}

/**
 * Search members in a team.
 * @param req the request
 * @param res the response
 */
async function searchMembers(req, res) {
  const result = await service.searchMembers(
    req.authUser,
    req.params.id,
    req.query
  );
  res.send(result.result);
}

/**
 * Search member invites for a team.
 * @param req the request
 * @param res the response
 */
async function searchInvites(req, res) {
  const result = await service.searchInvites(
    req.authUser,
    req.params.id,
    req.query
  );
  res.send(result.result);
}

/**
 * Remove a member from a team.
 * @param req the request
 * @param res the response
 */
async function deleteMember(req, res) {
  await service.deleteMember(
    req.authUser,
    req.params.id,
    req.params.projectMemberId
  );
  res.status(HttpStatus.NO_CONTENT).end();
}

/**
 * Return details about the current user.
 * @param req the request
 * @param res the response
 */
async function getMe(req, res) {
  res.send(await service.getMe(req.authUser));
}


/**
 * Return skills by job description.
 * @param req the request
 * @param res the response
 */
async function getSkillsByJobDescription(req, res) {
  res.send(await service.getSkillsByJobDescription(req.authUser, req.body));
}

/**
 *
 * @param req the request
 * @param res the response
 */
async function createProj(req, res) {
  res.send(await service.createProj(req.authUser, req.body));
}

module.exports = {
  searchTeams,
  getTeam,
  getTeamJob,
  sendEmail,
  addMembers,
  searchMembers,
  searchInvites,
  deleteMember,
  getMe,
  getSkillsByJobDescription,
  createProj,
};
