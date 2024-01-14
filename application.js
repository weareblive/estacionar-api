//
//  Created by Trazzar on 01/01/2017
//  Copyright © 2018 Trazzar. All rights reserved.
//
require('dotenv').config({silent: true});


let app = require ('./');

let debug = require('debug')('estacionart:data');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => debug('Estacionar Server running on http://localhost:%d', PORT));
