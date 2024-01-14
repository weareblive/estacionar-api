//
//  Created by Trazzar on 03/01/2017.
//  Copyright © 2023 Trazzar. All rights reserved.
//
var Slack = require('slack-node');
var os = require('os');

function slackNotifier(webhookUrl) {
  this._slack = new Slack();
  this._slack.setWebhook(webhookUrl || "https://hooks.slack.com/services/SetToken");
}

// options:
//   user
//   channel
//   webhook
//   icon
//   env:  send if process.env.NODE_ENV = env
//   envs: array of environments in which to send to slack
slackNotifier.prototype.send = function( msg, options, callback ) {
  options = options || {};

  var should_send = true;
  var envs = ( options.env ) ? [options.env] : options.envs ;

  if (envs) {
    var node_env = envs.find( function(env){ return env == process.env.km_ENV; } );
    should_send = typeof node_env !== 'undefined';
  }

  if ( should_send ) {
    var km_env = process.env.km_ENV;

    if ( typeof km_env === 'undefined' ) km_env = os.hostname();

    let message = {
      channel: options.channel || "#developers-bots",
      username: options.user || "WebScraperBot",
      icon_emoji: options.icon || ':dart:',
      text: `[${km_env}] ${msg}`
    };
    if (Array.isArray(options.attachments)) message.attachments = options.attachments;

    this._slack.webhook(message, function(err, response) {
      if (err) console.error(err);
      if (typeof callback === 'function') callback(err, response);
    });
  } else {
    console.log( msg );
  }
};

let singleton = new slackNotifier();
exports = module.exports = slackNotifier;
exports.send = (...args) => singleton.send(...args);
