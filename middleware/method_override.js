//
//  Created by WeAreBlive on 01/01/2017
//  Copyright © 2023 WeAreBlive. All rights reserved.
//
var methodOverride = require("method-override");

// Allow for POST & DELETE
module.exports = methodOverride( req => {
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    var method = req.body._method;
    delete req.body._method;
    return method;
  }
});
