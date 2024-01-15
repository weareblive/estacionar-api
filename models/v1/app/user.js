//
//  Created by WeAreBlivet on 01/01/2017
//  Copyright © 2021 WeAreBlivet. All rights reserved.
//
let pg = require( '../../../lib/pgUtil');
let debug = require('debug')('estacionar:models:back:user');
let dateFormat = require('dateformat');
const admin = require('firebase-admin');
let emails = require('../helpers/emails');
let mailer = require('../../../lib/mailer');

class User{

  static async getUserById(uid){
    const res = await pg.executeQuery(`SELECT * FROM users WHERE id = $1 AND enabled = true`, [uid]);
    if(res.length > 0) return res[0];
    return {}
  }

  
  static async getUserByUid(uid){

    let userInfo = await admin.auth().getUser(uid);

    return userInfo;
  
  }


  static async createUser(params){
    
    params.id = params.uid;
    delete params.uid;
    params.email_verified = true;
    params.enabled = true;
    params.account_type = 1;
    
    let user = await pg.insert('users', params, {_ts: true});
    if(user.length>0)
      return {success: true, res: user[0] };
    else
      return {success: false, res: {} };
      
    
  }



  static async updateUser(params){
    
    params.id = params.uid;
    delete params.uid;
    delete params.email_verifiedl
    delete params.enabled;
    delete params.account_type;

    try{
      let res = await pg.update('users', params, {_ts: false});
      if(res.length > 0) return {success: true, res: res[0] };
      return {success: false, res: clientProfile };
      
    }
    catch (err) {
      return {success: false, res: err };
    }
     
  }

}
module.exports = User;
