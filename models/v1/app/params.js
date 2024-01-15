//
//  Created by WeAreBlivet on 01/01/2017
//  Copyright © 2021 WeAreBlivet. All rights reserved.
//
let pg = require( '../../../lib/pgUtil');
let debug = require('debug')('estacionar:models:back:params');
let dateFormat = require('dateformat');

class Params{


  static async getParams(){
    let promises = [pg.executeQuery(`SELECT * FROM vehicle_types`, []),
                    pg.executeQuery(`SELECT * FROM brands`, []),
                    pg.executeQuery(`SELECT * FROM vehicle_models`, [])];
                    
    let res = await Promise.all(promises);

    
    
    if(res.length>0)

      return {
                vehicle_types: res[0],
                brands: res[1],
                vehicle_models: res[2]
              };
    else
      return {  vehicle_types: [],
                brands: [],
                vehicle_models: []}
  }

}
module.exports = Params;
