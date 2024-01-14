//
//  Created by Elias Janetis on 1/1/17.
//  Copyright © 2023 Squeeze. All rights reserved.
//
const cacheManager = require('cache-manager');
let redisStore = require('cache-manager-redis');
let parseDbUrl = require('parse-database-url');
let debug = require('debug')('squeeze:cache');

const REDIS_URL = process.env.REDIS_URL || '';

let cache;
if (REDIS_URL !== '') {
  cache = cacheManager.caching(Object.assign(parseDbUrl(REDIS_URL), {store: redisStore}));
} else {
  cache = cacheManager.caching();
}
debug( 'Cache Initialized:', cache.store.name );

exports = (module.exports = cache);
exports.wrap_unless_empty = (_, callback) => Promise.resolve(callback());
