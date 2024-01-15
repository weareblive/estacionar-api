//
//  Created by WeAreBlive on 03/01/2017.
//  Copyright © 2023 WeAreBlive. All rights reserved.
//
class MFAError extends Error {
  constructor(message, options) {
    super();
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.message = message;
    this.session = options.session;
    this.challenge = options.challenge;
  }
}

module.exports = MFAError;
