//
//  Created by Trazzar on 03/01/2017.
//  Copyright © 2023 Trazzar. All rights reserved.
//
var inspect = require('./inspect');
var pg = require('pg');
var debug = require('debug')('estacionart:sql');
var parseDbUrl = require("parse-database-url");

const DATABASE_URL = process.env.DATABASE_URL || '';
if (DATABASE_URL === '') throw new Error('Expected $DATABASE_URL to be set');

const PG_MAX_POOL = parseInt(process.env.PG_MAX_POOL, 10) || 15;

// Set database config
let db = Object.assign(parseDbUrl(DATABASE_URL), {
  ssl: process.env.POSTGRES_SSL === 'true',
  min: 4,
  max: PG_MAX_POOL,
  idleTimeoutMillis: 1000
});

// Gets the Postgres connection pool
function pool() {
  let instance;

  if ((instance = pool._instance) != null) return Promise.resolve(instance);

  return Promise.resolve((pool._instance = new pg.Pool(db)));
}
pool._instance = null;

exports = (module.exports = pool);
exports.close = function () {
  return pool()
    .then((pool) => pool.end())
    .then(() => {
      pool._instance = null;
    });
};

exports.psql_command = function( ){
  var psql = "psql ";
  if (db.user !== '') psql += '-U ' + db.user + ' ';
  if (db.host !== '') psql += '-h ' + db.host + ' ';
  if (db.database !== '') psql += ' ' + db.database + ' ';

  return psql;
};

exports.removeTrademarkCopyright = function(value){
  return value.replace(/™|®/g, '').trim();
};

exports.reduceByFirstOfAttribute = function(items, attribute){
  return items.reduce( function(items, item){

    // Does an item already exist in the results for the current item
    var found_item = items.find( function(an_item){
      return an_item[attribute] == item[attribute];
    });

    // If no item is found add this item to the results
    if ( found_item == null ) items.push( item );

    return items;
  }, []);
};

// For right now just alias, dedup may have different implementation evenutally
exports.dedupItemsByAttribute = exports.reduceByFirstOfAttribute;

exports.psql_connection_info = function(){
  return db;
};

exports.config= function(config){
  Object.assign( db, config );
};

exports.executeQuery = function(query, params){
  if (debug.enabled) {
    // Remove tailing spaces, then split into array, removing empty lines
    let sql = query.replace(/\s+;?$/, ';').split(/(?:\r\n|\n)/).filter((line) => line.length > 0).join('\n');
    let options = (params || []).reduce((params, param, i) => Object.assign(params, {[`$${i + 1}`]: param}), {});
    let total = Object.keys(options).length;

    // Add spacing between SQL and params to distinguish them easier
    if (total > 0) sql += (total === 1 ? ' ' : '\n') + inspect(options);

    debug(sql);
  }

  return pool()
    .then((pool) => pool.query(query, params || []))
    .then((results) => results.rows);
};


exports.selectById = function( table, id) {
  return exports.select(table, {id: id})
  .then( function( results ){
    var obj = null;
    if (results && results.length == 1) obj = results[0];
    return obj;
  });
};

// Return object as arrays of keys & values
// { keys: [1,2,3], value: ['a','b','c']}
exports.parseObject = function( options ){
  var values = [];
  var keys = [];

  if ( options !== null ) {
    for(var k in options) {
      values.push( options[k] );
      keys.push( k );
    }
  }

  return { keys: keys, values: values };
};

// options:
//   include_where: true => add 'WHERE'
//   start: index to start placeholders
exports.qualifierForKeys = function( keys, options ){
  var sql = '';

  if ( options === null || typeof options === 'undefined' ) options = { include_where: true, start: 1 };
  if (typeof options.include_where === 'undefined' ) options.include_where = true;
  if (options.include_where && keys.length > 0)
    sql = ' WHERE ';

  var start = options.start ? options.start : 1;

  if ( keys.length > 0 ) {
    for( var i = 0; i < keys.length; i++ ) {
      if ( i > 0 ) sql += ' AND ';
      sql += ` ${keys[i]} = $${start + i} `;
    }
  }

  return sql;
};

exports.getIdForName = function(table, name){
  return exports.executeQuery( `SELECT id FROM ${table} WHERE UPPER(name) = UPPER($1)`, [name] )
  .then(function(results){
    return (results.length > 0 ? results[0].id : null);
  });
};

exports.selectCount = function( table, options) {
  var sql = `SELECT COUNT(*) FROM ${table}`;
  var keys_and_values = exports.parseObject( options ); // { keys: ..., values: ... }
  sql += exports.qualifierForKeys( keys_and_values.keys );
  return exports.executeQuery(sql, keys_and_values.values)
  .then( function( results ){ return +results[0].count; }); // + coerces to int
};

exports.select = function( table, options) {
  var sql = `SELECT * FROM ${table}`;
  var keys_and_values = exports.parseObject( options ); // { keys: ..., values: ... }
  sql += exports.qualifierForKeys( keys_and_values.keys );
  return exports.executeQuery(sql, keys_and_values.values);
};

exports.deleteById = function( table, id) {
  return exports.delete(table, {id: id});
};

exports.delete = function( table, options) {
  var sql = `DELETE FROM ${table}`;
  var keys_and_values = exports.parseObject( options ); // { keys: ..., values: ... }
  var qualifier = exports.qualifierForKeys( keys_and_values.keys );
  if (typeof qualifier === undefined || !(/\S/.test(qualifier)) )
    throw new Error('Un-qualified delete not allowed');
  sql += qualifier;
  return exports.executeQuery(sql, keys_and_values.values);
};

exports.insert_or_update = function( table, criteria, object, options ) {
  return exports.select( table, criteria )
  .then( function(results){
    if ( results.length > 1 ) {
      throw new Error( 'pg_util insert_or_update cannot update more than a single object' );
    } else if ( results.length === 0 ) {
      return exports.insert( table, object, options );
    } else {
      object.id = results[0].id;
      return exports.update( table, object, options );
    }
  });
};

exports.insert_if_not_exist= function( table, criteria, object, options ) {
  return exports.select( table, criteria )
  .then( function(results){
    if ( results.length > 1 ) {
      throw new Error( 'pg_util insert_if_not_exist cannot select more than a single object' );
    } else if ( results.length === 0 ) {
      return exports.insert( table, object, options );
    } else {
      return results;
    }
  });
};


exports.insert = function( table, object, options ) {
  options = options || {};
  var _ts = options._ts || false;
  delete options._ts;
  var _nulls = options._nulls || null;
  delete options._nulls;

  var keys_and_values = exports.parseObject( object ); // { keys: ..., values: ... }
  var n = 1;
  var placeholders = Array.apply(null, Array(keys_and_values.keys.length)).map(function(){return `$${n++}`;});
  if (_nulls){
    _nulls.forEach( function(field){
      keys_and_values.keys.push( field );
      placeholders.push( 'NULL');
    });
  }
  if (_ts) {
    keys_and_values.keys.push( 'created_at' ); keys_and_values.keys.push( 'updated_at' );
    placeholders.push( 'now()' ); placeholders.push( 'now()' );
  }

  var sql = `INSERT INTO ${table} (${keys_and_values.keys.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`;

  return exports.executeQuery(sql, keys_and_values.values);
};

exports.insertObjects = function( table, objects ) {
  let calls = objects.map((o) => exports.insert(table, o));

  return Promise.all( calls );
};

// object: id & columns to update, ex: { id: 5, price: 100 }
// options: additional criteria, for now will be and'd ex: { description: 'abc' }
//   special_keys: _ts: false => will not update updated_at
//                 _nulls: array of fields to be set to null: ex: ['this', 'or', 'that']
exports.update = function( table, object, options ) {
  var id = object.id;
  delete object.id;

  if (options === null || typeof options === 'undefined') options = {id:id};
  if (typeof options.id === 'undefined' ) options.id = id;
  var _ts = options._ts || false;
  delete options._ts;

  var _nulls = options._nulls || null;
  delete options._nulls;

  var keys_and_values = exports.parseObject( object ); // { keys: ..., values: ... }
  if ( id === null || typeof id === 'undefined' ) throw new Error('Cannot update object, no ID given');

  var options_keys_and_values = exports.parseObject( options );

  var n = 1;
  var setters = keys_and_values.keys.map( function( key ){ return `${key} = $${n++}`; } );
  var qualifier_options = {start: keys_and_values.keys.length+1};
  if ( _ts === true ) setters.push( ' updated_at = now() ');

  if ( _nulls ) {
    _nulls.forEach( function( field ){
      setters.push( ` ${field} = NULL ` );
    });
  }

  var sql = `UPDATE ${table} SET ${setters.join(', ')}`;
  sql += exports.qualifierForKeys( options_keys_and_values.keys, qualifier_options );
  sql += ` RETURNING *`;

  return exports.executeQuery(sql, [].concat.apply([], [keys_and_values.values, options_keys_and_values.values]) );
};



// object: uid & columns to update, ex: { uid: 5, price: 100 }
// options: additional criteria, for now will be and'd ex: { description: 'abc' }
//   special_keys: _ts: false => will not update updated_at
//                 _nulls: array of fields to be set to null: ex: ['this', 'or', 'that']
exports.updateWithUID = function( table, object, options ) {
  var uid = object.uid;
  delete object.uid;

  if (options === null || typeof options === 'undefined') options = {uid:uid};
  if (typeof options.uid === 'undefined' ) options.uid = uid;
  var _ts = options._ts || false;
  delete options._ts;

  var _nulls = options._nulls || null;
  delete options._nulls;

  var keys_and_values = exports.parseObject( object ); // { keys: ..., values: ... }
  if ( uid === null || typeof uid === 'undefined' ) throw new Error('Cannot update object, no UID given');

  var options_keys_and_values = exports.parseObject( options );

  var n = 1;
  var setters = keys_and_values.keys.map( function( key ){ return `${key} = $${n++}`; } );
  var qualifier_options = {start: keys_and_values.keys.length+1};
  if ( _ts === true ) setters.push( ' updated_at = now() ');

  if ( _nulls ) {
    _nulls.forEach( function( field ){
      setters.push( ` ${field} = NULL ` );
    });
  }

  var sql = `UPDATE ${table} SET ${setters.join(', ')}`;
  sql += exports.qualifierForKeys( options_keys_and_values.keys, qualifier_options );
  sql += ` RETURNING *`;

  return exports.executeQuery(sql, [].concat.apply([], [keys_and_values.values, options_keys_and_values.values]) );
};