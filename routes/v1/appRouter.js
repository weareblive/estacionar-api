let express = require('express');

let router = express.Router();
let assert = require('../../middleware/assertParameters');
// let params = require('../../models/v1/back/params');
// let project = require('../../models/v1/back/project');
// let user = require('../../models/v1/back/user');
// let ticket = require('../../models/v1/back/ticket');
// let dash = require('../../models/v1/back/dashboard');

let params = require('../../models/v1/app/params');
let user = require('../../models/v1/app/user');
let debug = require('debug')('estacionar:router:back');


router.get('/users', (req, res, next) => {
  user.getUserById(req.body.uid).then( (results) => res.status(200).send(results)).catch(next);
});

router.get('/users/firebase/:uid', (req, res, next) => {
  user.getUserByUid(req.params.uid).then( (results) => res.status(200).send(results)).catch(next);
});

router.post('/users', assert(['uid', 'dni', 'display_name', 'first_name', 'last_name', 'network', 'email', 'birthdate']), (req, res, next) => {
  user.createUser(req.body).then( (results) => res.status(200).send(results)).catch(next);
});

router.put('/users', assert(['uid', 'dni', 'display_name', 'first_name', 'last_name', 'birthdate']), (req, res, next) => {
  user.updateUser(req.body).then( (results) => res.status(200).send(results)).catch(next);
});



// PARAMS
router.get('/params', (req, res, next) => {
  params.getParams().then( (results) => res.status(200).send(results)).catch(next);
});









module.exports = router;