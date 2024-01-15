//
//  Created by WeAreBlive on 3/1/17.
//  Copyright © 2023 WeAreBlive. All rights reserved.
//
const _ = require('lodash');

// There are a couple challenges with filtering logs
// - xml data can be logged so we need a regex to filter replace strings
// - we can dump full objects and certain keys need to be filtered
// - logs need to perform extremely fast
// - logs can't change the original/passed data

const hasAnyProperties = function(obj, keys) {
  for( let i = 0; i <= keys.length; i++ ){
    if ( obj != null && obj.hasOwnProperty( keys[i] ) ) return true;
  }
  return false;
};

// Determines if an object or any of its child nodes has a key
const hasOwnPropertyRecursive = function(obj, keys){
  if ( Array.isArray(obj) ) {
    for( let i = 0; i < obj.length; i++ ){
      if ( hasOwnPropertyRecursive(obj[i], keys) ) return true;
    }
  } else if (obj != null && _.isPlainObject(obj)) {
    if ( hasAnyProperties(obj, keys)) return true;

    const obj_keys = Object.keys(obj);
    for( let i = 0; i < obj_keys.length; i++ ){
      if ( hasOwnPropertyRecursive(obj[obj_keys[i]], keys) ) return true;
    }
  }

  return false;
};

// List of regexes to filter
const filtered_strings = [
  { pattern: /<credentials>.*<\/credentials>/g, replace: '<credentials>[FILTERED]</credentials>'}
];

// Determines if an object or graph has a string that matches
const hasMatchedStringPropertyRecursive = function(obj){
  if ( Array.isArray(obj) ) {
    for( let i = 0; i < obj.length; i++ ){
      if ( hasMatchedStringPropertyRecursive( obj[i]) ) return true;
    }
  } else if (obj != null && _.isPlainObject(obj)) {
    const obj_keys = Object.keys(obj);
    for( let i = 0; i < obj_keys.length; i++ ){
      if ( hasMatchedStringPropertyRecursive( obj[obj_keys[i]]) ) return true;
    }
  } else if (typeof obj === 'string') {
    for( let i = 0; i < filtered_strings.length; i++ ){
      const filtered_string = filtered_strings[i];
      if (obj.match(filtered_string.pattern)) return true;
    }
  }

  return false;
};

// Keys to filter out with [FILTERED]
const filtered_fields = [
  'credentials',
  'password',
  'password_confirmation',
  'pin_code',
  'pinCode',
  'pincode'
];

// In a single object filter a key if it matches one of the filtered_fields
const filter_key = function( obj, key ) {
  const v = obj[key];
  if ( filtered_fields.includes(key) )
    obj[key] = '[FILTERED]';
  else {
    obj[key] = log_filter(v);
  }
};

// In a given string look for regex matches and replace
const filter_string = function( s ) {
  for( let i = 0; i < filtered_strings.length; i++ ){
    const {pattern, replace} = filtered_strings[i];
    s = s.replace( pattern, replace);
  }

  return s;
};

// filter out keys and strings that match
const log_filter = function (params) {
  if ( process.env.NO_PARAM_FILTER === 'true' ) return params;
  else if (params == null) return params;

  switch (typeof params) {
    case 'boolean':
    case 'number':
    case 'symbol':
      return params;
    case 'string':
      return filter_string( params );
  }

  try {
    // First check without replacing.  Replacing requires a deep copy
    // Which is very expensive so we only want to do it on params that match
    if ( !hasOwnPropertyRecursive(params, filtered_fields) &&
         !hasMatchedStringPropertyRecursive(params) )
      return params;

    // Make a deep copy since we are changeing keys and strings
    params = _.cloneDeep( params );

    if (Array.isArray(params)) {
      for( let i = 0; i < params.length; i++ ) {
        params[i] = log_filter(params[i]);
      }
    } else if ( _.isPlainObject(params) ) {
      Object.keys(params).forEach( (key) => {
        filter_key( params, key );
      });
    }
  } catch (err) {
    console.error('log_filter: %s', err.message);
  }

  return params;
};

module.exports = log_filter;
