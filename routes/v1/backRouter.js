let express = require('express');

let router = express.Router();
let assert = require('../../middleware/assertParameters');
let params = require('../../models/v1/back/params');
let project = require('../../models/v1/back/project');
let user = require('../../models/v1/back/user');
let ticket = require('../../models/v1/back/ticket');
let dash = require('../../models/v1/back/dashboard');

let debug = require('debug')('estacionart:router:back');



router.get('/users/', (req, res, next) => {
  user.getAllUsers().then( (results) => res.status(200).send(results)).catch(next);
});

router.get('/users/firebase/:uid', (req, res, next) => {
  user.getUserByUid(req.params.uid).then( (results) => res.status(200).send(results)).catch(next);
});

router.get('/users/info', (req, res, next) => {
  user.getUserById(req.body.uid).then( (results) => res.status(200).send(results)).catch(next);
});

router.get('/users/borrar/:userId', (req, res, next) => {
  user.getUserById(req.params.userId).then( (results) => res.status(200).send(results)).catch(next);
});

router.post('/users/', assert(['email', 'first_name', 'last_name', 'mobile', 'profile_id']), (req, res, next) => {
  user.createUser(req.body).then( (results) => res.status(200).send(results)).catch(next);
});


router.put('/users/', assert(['user_id']), (req, res, next) => {
  user.updateUser(req.body).then( (results) => res.status(200).send(results)).catch(next);
});


router.post('/users/login', assert(['email', 'password']), (req, res, next) => {
  user.login(req.body.email, req.body.password).then( (results) => res.status(200).send(results)).catch(next);
});

router.post('/users/change_password', assert(['old_password', 'new_password']), (req, res, next) => {
  user.changeUserPassword(req.body).then( (results) => res.status(200).send(results)).catch(next);
});

router.post('/users/send_password', assert(['user_id']), (req, res, next) => {
  user.sendUserPassword(req.body.user_id).then( (results) => res.status(200).send(results)).catch(next);
});




router.get('/dashboard', (req, res, next) => {
  dash.getStatistics(req.body.uid).then( (results) => res.status(200).send(results)).catch(next);
});







// PROJECTS
router.get('/projects',  (req, res, next) => {
  project.getProjects().then( (results) => res.status(200).send(results)).catch(next);
});

router.put('/projects/status',  assert(['project_id', 'status' ]), (req, res, next) => {
  project.updateProjectStatus(req.body.project_id, req.body.status).then( (results) => res.status(200).send(results)).catch(next);
});

router.get('/projects/:project_id',  (req, res, next) => {
  project.getProject(req.params.project_id).then( (results) => res.status(200).send(results)).catch(next);
});

router.get('/projects/:project_id/users',  (req, res, next) => {
  project.getUsersByProject(req.params.project_id).then( (results) => res.status(200).send(results)).catch(next);
});

router.get('/projects/:project_id/users',  (req, res, next) => {
  project.getUsersByProject(req.params.project_id).then( (results) => res.status(200).send(results)).catch(next);
});

router.post('/projects',  assert(['name', 'description', 'responsable', 'logo', 'platforms']), (req, res, next) => {
  project.createProject(req.body).then( (results) => res.status(200).send(results)).catch(next);
});

router.put('/projects',  assert(['id', 'name', 'description', 'responsable', 'logo', 'platforms']), (req, res, next) => {
  project.updateProject(req.body).then( (results) => res.status(200).send(results)).catch(next);
});







router.get('/params/profiles',  (req, res, next) => {
  params.getProfiles().then( (results) => res.status(200).send(results)).catch(next);
});


router.get('/params/project_status',  (req, res, next) => {
  params.getProjectStates().then( (results) => res.status(200).send(results)).catch(next);
});





router.get('/tickets',  (req, res, next) => {
  ticket.getTicketsList(req.body.uid).then( (results) => res.status(200).send(results)).catch(next);
});

router.post('/tickets/messages',  assert(['ticket_id', 'message']), (req, res, next) => {
  ticket.addMessage(req.body).then( (results) => res.status(200).send(results)).catch(next);
});

router.get('/tickets/:id',  (req, res, next) => {
  ticket.getTicketById(req.params.id).then( (results) => res.status(200).send(results)).catch(next);
});


router.post('/tickets', assert(['project_id', 'type', 'platform', 'current_result', 'creator_id']), (req, res, next) => {
  ticket.createTicket(req.body).then( (results) => res.status(200).send(results)).catch(next);
});

router.put('/tickets', assert(['id', 'project_id', 'type', 'platform', 'location', 'current_result', 'creator_id']), (req, res, next) => {
  ticket.updateTicket(req.body).then( (results) => res.status(200).send(results)).catch(next);
});

router.put('/tickets/status', assert(['id', 'status_id']), (req, res, next) => {
  ticket.updateTicketStatus(req.body.id, req.body.status_id).then( (results) => res.status(200).send(results)).catch(next);
});



module.exports = router;