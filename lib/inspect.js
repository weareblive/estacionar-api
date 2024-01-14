//
//  Created by Trazzar on 03/01/2017.
//  Copyright © 2023 Trazzar. All rights reserved.
//
let util = require('util');

module.exports = function inspect(object, options) {
  return util.inspect(object, Object.assign({colors: true, depth: null, maxArrayLength: null}, options));
};
