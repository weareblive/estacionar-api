//
//  Created by WeAreBlivet on 01/01/2017
//  Copyright © 2021 WeAreBlivet. All rights reserved.
//
let pg = require( '../../../lib/pgUtil');
let debug = require('debug')('estacionar:models:app:parking');
let dateFormat = require('dateformat');
const admin = require('firebase-admin');

class Parking{

  static async getParkings(uid){
    const res = await pg.executeQuery(`SELECT p.*, ARRAY_AGG(pi.photo) AS images 
                                        FROM parkings p
                                        LEFT JOIN
                                          parking_images pi ON p.id = pi.parking_id
                                          WHERE uid = $1 AND status <> 'deleted'
                                            GROUP BY p.id`, [uid]);
    return res;
    
  }



  static async createParking(params){
    
    
    params.enabled = true;
    params.status = 'in-progress';
    const images = params.images;
    delete params.images;
    
    let parking = await pg.insert('parkings', params, {_ts: true});
    if(parking.length>0)
    {
      for(let i = 0; i< images.length; i++){

        pg.insert('parking_images', {parking_id: parking[0].id, is_default: (i==0), photo: images[i] }, {_ts: false});
      }
      parking[0].images = images;
      return {success: true, res: parking[0] };
    }
    else
      return {success: false, res: {} };
      
    
  }



  static async updateParking(params){
    
    const images = params.images;
    delete params.images;
    delete params.status;

    try{
      let parking = await pg.update('parkings', params, {_ts: true});
      if(parking.length > 0)
      {
        let prevImages = await pg.executeQuery('SELECT * FROM parking_images WHERE parking_id = $1', [parking[0].id]);
        
        const imagenesABorrar = prevImages.filter(obj1 =>
          !images.some(img => img === obj1.photo)
        );
        for(let i = 0; i < imagenesABorrar.length; i++){
          await pg.executeQuery('DELETE FROM parking_images WHERE id = $1 AND parking_id = $2', [imagenesABorrar[i].id, imagenesABorrar[i].parking_id]);
        }

        const imagenesNuevas = images.filter(obj1 =>
          !prevImages.some(img => img.photo === obj1)
        );
        for(let i = 0; i < imagenesNuevas.length; i++){
         await pg.insert('parking_images', {parking_id: parking[0].id, photo: imagenesNuevas[i] }, {_ts: false});
        }

        parking[0].images = images;
        return {success: true, res: parking[0] };

      }
      return {success: false, res: {} };
      
    }
    catch (err) {
      return {success: false, res: err };
    }
     
  }

  static async activateParking(uid, parkingId, code){
    if(code == 8008) {
      let res = await pg.executeQuery(`UPDATE parkings SET status = 'available' WHERE uid = $1 AND id = $2 RETURNING *`, [uid, parkingId]);
      if(res.length > 0) 
        return { success: true, res: 'Parking activado correctamente' };
      return { success: false, res: 'Ocurrio un error al querer activar el parking.  Intenete nuevamente mas tarde.' };
    }
    else
      return { success: false, res: 'Código incorrecto' };
    
  }


  // static async  setAsDefault(uid, parkingId)
  // {
  //   let all = await pg.executeQuery('UPDATE parkings SET is_default = false WHERE uid = $1',[uid]);
  //   let res = await pg.executeQuery('UPDATE parkings SET is_default = true WHERE id = $1 RETURNING *',[parkingId]);
    
  //   return {success: (res.length > 0)};
  // }

  static async  setPhotoAsDefault(uid, parkingId, photoId)
  {
    let all = await pg.executeQuery('UPDATE parking_images SET is_default = false WHERE parking_id = $1',[parkingId]);
    let res = await pg.executeQuery('UPDATE parking_images SET is_default = true WHERE id = $1 AND id = $2 RETURNING *',[parkingId, photoId]);
    
    return {success: (res.length > 0)};
  }


  static async  delete(parkingId)
  {
    let res = await pg.executeQuery(`UPDATE parkings SET  status = 'deleted' WHERE id = $1 RETURNING *`,[parkingId]);
    return {success: (res.length > 0)};
  }

}
module.exports = Parking;
