//
//  Created by Trazzar on 03/01/2017.
//  Copyright © 2023 Trazzar. All rights reserved.
//
var Git = function(){};
var git = require('git-rev');

Git.prototype.getShortHash = function(callback){
  git.short(function (results) {
    //console.log(results);
    callback(results);
  });
};

Git.prototype.getLongHash = function(callback){
  git.long(function (results) {
    //console.log(results);
    callback(results);
  });
};

Git.prototype.getBranch = function(callback){
  git.branch(function (results) {
    //console.log(results);
    callback(results);
  });
};

Git.prototype.getTag  = function(callback){
  git.tag(function (results) {
    //console.log(results);
    callback(results);
  });
};

module.exports = new Git();
