//
//  Created by Trazzart on 01/01/2017
//  Copyright © 2021 Trazzart. All rights reserved.
//
let pg = require( '../../../lib/pgUtil');
let debug = require('debug')('estacionart:models:back:params');
let dateFormat = require('dateformat');

class Params{


  static async getProfiles(){
    let res = await pg.executeQuery(`SELECT  ARRAY(SELECT id FROM profiles WHERE enabled) AS profiles`, []);
    if(res.length>0)
      return res[0];
    else
      return {profiles: []}
  }

  static getProjectStates(){
    return pg.executeQuery(`SELECT * FROM status`, []);
  }

}
module.exports = Params;
