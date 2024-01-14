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
    
   
    
    app.use('/back', authMiddleware);
    app.use('/back/v1', require( './v1/backRouter'));
      
    // app.use('/api/v1/user', require( './v1/userRouter' ));
    // app.use('/api/v1/admin', require( './v1/adminRouter' ));
    // app.use('/api/v1/shop', require( './v1/shopRouter' ));

  }
};

module.exports = router;
