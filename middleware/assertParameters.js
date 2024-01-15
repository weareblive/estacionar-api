//
//  Created by WeAreBlive on 01/01/2017
//  Copyright © 2023 WeAreBlive. All rights reserved.
//
// Middleware to assert all expected parameters exist

module.exports = function assert(expected) {
  if (!Array.isArray(expected)) throw new TypeError('assert(): expected array of query parameter names');


  return function assertParameters(req, res, next) {
    console.log('ASSERT');
    console.log(req.body);
    let allExist = expected.every((name) => req.body[name] != null);
    if (allExist) return next();

    res.sendStatus(400);
  };
};
