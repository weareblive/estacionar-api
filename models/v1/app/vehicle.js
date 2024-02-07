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
    const res = await pg.executeQuery(`SELECT v.*, ARRAY_AGG(vi.photo) AS images 
                                        FROM vehicles v 
                                        LEFT JOIN
                                          vehicle_images vi ON v.id = vi.vehicle_id
                                          WHERE uid = $1
                                            GROUP BY v.id`, [uid]);
    return res;
    
  }



  static async createVehicle(params){
    
    
    params.enabled = true;
    const images = params.images;
    delete params.images;
    
    let vehicle = await pg.insert('vehicles', params, {_ts: true});
    if(vehicle.length>0)
    {
      for(let i = 0; i< images.length; i++){
        pg.insert('vehicle_images', {vehicle_id: vehicle[0].id, photo: images[i] }, {_ts: false});
      }
      vehicle[0].images = images;
      return {success: true, res: vehicle[0] };
    }
    else
      return {success: false, res: {} };
      
    
  }



  static async updateVehicle(params){
    
    const images = params.images;
    delete params.images;

    try{
      let vehicle = await pg.update('vehicles', params, {_ts: true});
      if(vehicle.length > 0)
      {
        let prevImages = await pg.executeQuery('SELECT * FROM vehicle_images WHERE vehicle_id = $1', [vehicle[0].id]);
        
        const imagenesABorrar = prevImages.filter(obj1 =>
          !images.some(img => img === obj1.photo)
        );
        for(let i = 0; i < imagenesABorrar.length; i++){
          await pg.executeQuery('DELETE FROM vehicle_images WHERE id = $1 AND vehicle_id = $2', [imagenesABorrar[i].id, imagenesABorrar[i].vehicle_id]);
        }

        const imagenesNuevas = images.filter(obj1 =>
          !prevImages.some(img => img.photo === obj1)
        );
        for(let i = 0; i < imagenesNuevas.length; i++){
         await pg.insert('vehicle_images', {vehicle_id: vehicle[0].id, photo: imagenesNuevas[i] }, {_ts: false});
        }

        vehicle[0].images = images;
        return {success: true, res: vehicle[0] };

      }
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
