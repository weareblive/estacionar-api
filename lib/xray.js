//
//  Created by WeAreBlive on 03/01/2017.
//  Copyright © 2023 WeAreBlive. All rights reserved.
//
const Xray = require('x-ray');

Xray.promisify = function(xQuery) {
  return new Promise((resolve, reject) => {
    xQuery((err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

module.exports = Xray;
