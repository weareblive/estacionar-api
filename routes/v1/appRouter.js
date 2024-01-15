let express = require('express');

let router = express.Router();
let assert = require('../../middleware/assertParameters');
let params = require('../../models/v1/app/params');
let vehicle = require('../../models/v1/app/vehicle');
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


// Vehicles
router.get('/users/vehicles',  assert(['uid']), (req, res, next) => {
  vehicle.getVehicles(req.body.uid).then( (results) => res.status(200).send(results)).catch(next);
});

router.post('/users/vehicles', assert(['uid', 'plate_number', 'type', 'brand_id','model_id','color', 'year', 'photo']), (req, res, next) => {
  vehicle.createVehicle(req.body).then( (results) => res.status(200).send(results)).catch(next);
});

router.put('/users/vehicles', assert(['id', 'uid', 'plate_number', 'type', 'brand_id','model_id','color', 'year', 'photo', 'enabled']), (req, res, next) => {
  vehicle.updateVehicle(req.body).then( (results) => res.status(200).send(results)).catch(next);
});




// PARAMS
router.get('/params', (req, res, next) => {
  params.getParams().then( (results) => res.status(200).send(results)).catch(next);
});









module.exports = router;