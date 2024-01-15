require('dotenv').config({silent: true});

let git = require ('../lib/git');
const authMiddleware = require("./auth-middleware");

let router = {
  route: function (app) {


    app.use(function(req, res, next) {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
      res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
      next();
    });

    // GRAL RESPONSE
    app.use('/ping', (req, res) => res.status(200).send('PONG') );
    
    app.use('/app', authMiddleware);
    app.use('/app/v1', require( './v1/appRouter'));
      
    
  }
};

module.exports = router;
