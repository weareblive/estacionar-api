//
//  Created by WeAreBlive on 01/01/2017
//  Copyright © 2024 WeAreBlive. All rights reserved.
//
require('dotenv').config({silent: true});


let app = require ('./');

let debug = require('debug')('estacionar:data');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => debug('Estacionar Server running on http://localhost:%d', PORT));
