//
//  Created by Trazzar on 01/01/2017
//  Copyright © 2023 Trazzar. All rights reserved.
//
/* Require before most other middleware */
module.exports = 
  function( req, res, next) {
    if ( req.headers['x-forwarded-proto'] && 
         req.headers['x-forwarded-proto']!='https' && 
         !process.env.REQUIRE_HTTPS 
       )
      res.redirect('https://' + req.get('host') + req.originalUrl);
      
    else
      next(); /* Continue to other routes if we're not redirecting */
  };
