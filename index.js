//
//  Created by WeAreBlive on 01/01/2017
//  Copyright © 2024 WeAreBlive. All rights reserved.
//
require('dotenv').config({silent: true});

let express = require("express");
let app = express();
let bodyParser = require("body-parser");
let path = require("path");
let router = require('./routes/router');
let admin = require("firebase-admin");

// Initialize Firebase Admin
let serviceAccount = require("./credentials/estacionar-3fb9f-firebase-adminsdk-1sltp-a0ae4e691d.json");

try{
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://estacionart-manager.firebaseio.com"
    });
}
catch(exe){
    console.log('ERROR whilie initializing'); 
    console.log(exe);
}

// Cross policy
const cors = require('cors');
app.use(cors(
    [{
        origin: "*", 
        credentials: true
    }]
  ));


app.use( require( './middleware/require_https') );
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(require('./middleware/method_override'));
app.use(express.static(path.join(__dirname, 'public')));

router.route( app );

module.exports = app;
