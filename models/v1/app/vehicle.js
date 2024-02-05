//
//  Created by WeAreBlivet on 01/01/2017
//  Copyright © 2021 WeAreBlivet. All rights reserved.
//
let pg = require( '../../../lib/pgUtil');
let debug = require('debug')('estacionar:models:app:vehicle');
let dateFormat = require('dateformat');
const admin = require('firebase-admin');
let emails = require('../helpers/emails');
let mailer = require('../../../lib/mailer');

class Vehicle{

  static async getVehicles(uid){
    const res = await pg.executeQuery(`SELECT * FROM vehicles WHERE uid = $1`, [uid]);
    return res;
    
  }



  static async createVehicle(params){
    
    
    params.enabled = true;
    
    let vehicle = await pg.insert('vehicles', params, {_ts: true});
    if(vehicle.length>0)
      return {success: true, res: vehicle[0] };
    else
      return {success: false, res: {} };
      
    
  }



  static async updateVehicle(params){
    
    try{
      let vehicle = await pg.update('vehicles', params, {_ts: true});
      if(vehicle.length > 0) return {success: true, res: vehicle[0] };
      return {success: false, res: {} };
      
    }
    catch (err) {
      return {success: false, res: err };
    }
     
  }

  static async  setAsDefault(uid, vehicleId)
  {
    let all = await pg.executeQuery('UPDATE vehicles SET is_default = false WHERE uid = $1',[uid]);
    let res = await pg.executeQuery('UPDATE vehicles SET is_default = true WHERE id = $1 RETURNING *',[vehicleId]);
    
    return {success: (res.length > 0)};
  }

}
module.exports = Vehicle;
