//
//  Created by Trazzar on 03/01/2017.
//  Copyright © 2023 Trazzar. All rights reserved.
//
let airbrake = require('./airbrake');
let cache = require('./cache');
let debug = require('debug')('estacionart:worker');
let FinicityAPIError = require('./error/finicity_api_error');

const WORKER_KEY = '_worker_key'; // Property in `req` object to identify cache key

// Generates a key for cache based on request parameters
function generateKey(req) {
  let method = req.method.toLowerCase();
  let path = req.path;

  // Trim leading slash
  if (path[0] === '/') path = path.slice(1);

  return `${method}:${path}`;
}

// Caches response from `callback` for 5 minutes by default
exports.cache = function (callback, options) {
  if (typeof callback !== 'function') throw new TypeError('worker.cache(): expected callback');

  // Set default TTL to 5 minutes
  options = Object.assign({ttl: 5 * 60}, options || {});

  // Invokes `callback(req)`, caching response
  return function cacheResponse(req, res, next) {
    // Prioritize key passed `.redirect()` middleware
    let key = req[WORKER_KEY] != null ? req[WORKER_KEY] : generateKey(req);

    // Invoke callback, updating cache once complete
    callback(req)
      .then((result) => {
        return new Promise((resolve, reject) => {
          cache.set(key, {status: 200, body: result}, options, (err) => {
            if (err) return reject(err);

            debug('%s %s: cache set "%s" => 200:\n%s', req.method, req.path, key, JSON.stringify(result, null, 2));
            resolve(result);
          });
        });
      })
      .then((result) => {
        // When invoked via `.redirect()`, the response has already completed
        if (!res.finished) res.status(200).send(result);
      })
      .catch((err) => {
        if (airbrake) airbrake.notify(err, (err) => {
          if (err) console.error('Failed to report to Airbrake: %s', err.message);
        });

        if (!(err instanceof FinicityAPIError)) throw err;

        // Finicity errors are returned as 200
        let body = {error: {code: err.code, message: err.description}};
        cache.set(key, {status: 200, body});
        if (!res.finished) res.status(200).send(body);
      })
      .catch((err) => next(err));
  };
};

// Redirects client to a URL appropriate for polling the original request's response
exports.redirect = function (redirect, callback) {
  if (typeof redirect !== 'function') throw new TypeError('worker.redirect(): expected redirect callback');
  else if (typeof callback !== 'function') throw new TypeError('worker.redirect(): expected callback');

  // Return an array of middleware
  return [
    // Sets cache entry to 204 (no data) and redirects to the appropriate polling route
    function redirectAndCache(req, res, next) {
      let path = redirect(req);
      let key = (req[WORKER_KEY] = generateKey({method: 'get', path})); // set WORKER_KEY on `req`

      debug('%s %s: cache set "%s" => 204', req.method, req.path, key);
      cache.set(key, {status: 204}, (err) => {
        if (err) return next(err);

        res.redirect(path); // redirect to path provided by `redirect()`
        next();
      });
    },
    // Invoke `.cache()` middleware, which does the work of caching response
    exports.cache(callback)
  ];
};

// Responds to request if cached; otherwise, passes request to next handler
exports.respond = function () {
  return function respondIfCached(req, res, next) {
    let key = generateKey(req);

    cache.get(key, (err, result) => {
      if (err) return next(err);
      else if (result == null) {
        // Cache miss! Pass request to next handler
        debug('%s %s: cache miss "%s"', req.method, req.path, key);
        return next();
      }

      // Cache hit!
      let {body, status} = result;
      debug('%s %s: cache hit "%s" => %d:\n%s', req.method, req.path, key, status, JSON.stringify(body, null, 2));
      if (!res.headersSent) res.status(status);
      res.send(body);

      // If `body` contains an `error` property, delete from cache (we don't
      // want to keep bad data, but we also need to reply to the original request
      // that has been polling for a response)
      if (body != null && body.error != null) {
        debug('%s %s: cache delete "%s"', req.method, req.path, key);
        cache.del(key);
      }
    });
  };
};
