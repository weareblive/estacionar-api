//
//  Created by Trazzar on 01/01/2017
//  Copyright © 2023 Trazzar. All rights reserved.
//

let UnauthorizedError = require('express-jwt/lib/errors/UnauthorizedError');

// const VIBOZ_ENV = process.env.VIBOZ_ENV || 'development';

module.exports = function (/* options */) {
  let middleware = [
    // Returns 401 if JWT validation failed and 200 on Finicity error; otherwise,
    // passes error to next handler
    function reportError(err, req, res, next) {
      if (err instanceof UnauthorizedError) return res.sendStatus(401);
      else next(err);
      // else if (err instanceof FinicityAPIError) {
      //   // Report to Airbrake manually as we intentionally return 200 back to app
      //   // if (airbrake) airbrake.notify(err, (err) => {
      //   //   if (err) console.error('Failed to report to Airbrake: %s', err.message);
      //   // });
      //
      //   res.status(200).json({error: {code: err.code, message: err.description}});
      // } else {
      //   next(err);
      // }
    }
  ];

  // // Add Airbrake handler, disabling crash-on-error if not in development
  // if (airbrake) middleware.push(airbrake.expressHandler(VIBOZ_ENV !== 'development'));

  return middleware;
};
