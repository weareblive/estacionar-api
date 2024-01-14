//
//  Created by Trazzart on 01/01/2017
//  Copyright © 2021 Trazzart. All rights reserved.
//
let pg = require( '../../../lib/pgUtil');
let debug = require('debug')('estacionart:models:back:project');
let dateFormat = require('dateformat');


class Project{


  static getProjects(){
    return pg.executeQuery(`SELECT id, name, logo, enabled FROM projects WHERE enabled = true ORDER BY name ASC`, []);
  }



  // static getShopsByManager(uid){

  // }


  
  // static getEmployeesByShop(shopId){
  //   return pg.executeQuery(`SELECT se.shop_id, CONCAT(first_name, ' ', last_name) as employee, email, mobile FROM shop_employees se INNER JOIN clients c ON c.id = se.id WHERE se.shop_id = $1 ORDER BY first_name, last_name`,[localId])
    
  // }


  // static getFullList(){
  //   return pg.executeQuery(`SELECT * FROM locales ORDER BY nombre`,[]);
  // }

  static async getProject(id){
    let res = await pg.executeQuery(`SELECT * FROM projects WHERE id = $1`,[id])
    if(res.length>0)
      return res[0];
    return {};
  }




  static async updateProjectStatus(projectId, enabled){
    const data = {id: projectId, enabled}
    let res = await pg.update('projects', data, {_ts: false});
    if(res.length>0 && res[0].enabled == enabled)
    {
      return {success: true, res: 'Proyecto actualizado correctamente.'};
    }
    else
      return {success: false, res: 'Ocurrio un error al querer actualizar el proyecto'};

  }


  // static updateShop(shop){
  //   delete shop.tags;
  //   return pg.update('shops', shop, {_ts: false})
  //   .then(res => res[0]);
  // }

  // static newShop(shop){
    
  //   delete shop.id;
  //   delete shop.tags;
  //   return pg.insert('shops', shop, {_ts: false})
  //   .then(res => res[0]);
  // }

    
  static getUsersByProject(projectId){
    return pg.executeQuery(`SELECT se.shop_id, CONCAT(first_name, ' ', last_name) as employee, se.employee_id, email, mobile FROM shop_employees se INNER JOIN clients c ON c.id = se.employee_id WHERE se.shop_id = $1 ORDER BY first_name, last_name`,[shopId])
    
  }

  static getUsersByShop(shopId){
    return pg.executeQuery(`SELECT id, CONCAT(first_name, ' ', last_name) AS name 
    FROM users WHERE enabled AND $1 = ANY (SELECT unnest(shops));`,[shopId]);
    
  }


  

  static updateProject(project){
    delete project.uid;
    return pg.update('projects', project, {_ts: false})
    .then(res => res[0]);
  }

  static createProject(project){
    project.enabled = true;
    delete project.id;
    delete project.uid;
    return pg.insert('projects', project, {_ts: false})
    .then(res => res[0]);
  }






  static async getShopParameters(){
    let res = await pg.executeQuery(`SELECT p.*, s.name, s.logo  FROM porcentages p INNER JOIN shops s 
                                      ON s.id = p.shop_id  WHERE p.shop_id <> 0`, []);
    return res;
    
  }

  
  static async createShopParameters(params){
    
    
    let user = await pg.executeQuery(`SELECT profile FROM users WHERE id = $1`, [params.uid]);
    if(user.length>0 &&  params.shop_id != 0 && user[0].profile.toLowerCase() == 'admin')
    {

      let shopParameters = await pg.executeQuery(`SELECT * FROM porcentages WHERE shop_id = $1`, [params.shop_id]);
      if(shopParameters.length>0)
      {
        // Ya existe
        params.id = shopParameters[0].id;
        debug(params);
        let res = await pg.update('porcentages', params, {_ts: true});
        return { success: true, res };
      }
      else{
        let res = await pg.insert('porcentages', params, {_ts: true});
        return { success: true, res };
      }

    }
    return { success: false, res: 'El usuario no tiene privilegios para cambiar los parametros' };
        
  }

  static async updateShopParameters(params){
    
    
    let user = await pg.executeQuery(`SELECT profile FROM users WHERE id = $1`, [params.uid]);
    if(user.length>0 &&  params.shop_id != 0 && user[0].profile.toLowerCase() == 'admin')
    {
      let res = await pg.update('porcentages', params, {_ts: true});
      return { success: true, res };
    }
    return { success: false, res: 'El usuario no tiene privilegios para cambiar los parametros' };
        
  }
  


  static async deleteShopParameters(uid, shopId){
    
    
    let user = await pg.executeQuery(`SELECT profile FROM users WHERE id = $1`, [uid]);
    if(user.length>0 && user[0].profile.toLowerCase() == 'admin')
    {
      let res = await pg.executeQuery(`DELETE FROM porcentages WHERE shop_id = $1 RETURNING *`, [shopId]);
      if(res.length>0)
        return { success: true, res: 'Parametro eliminado correctamente' };
      else
        return { success: false, res: 'Ocurrio un error al querer eliminar los parametros asociados al local' };
    }
    return { success: false, res: 'El usuario no tiene privilegios para cambiar los parametros' };
        
  }
  



  static async getGralParameters(){
    let porcentages = await pg.executeQuery(`SELECT * FROM porcentages WHERE shop_id = 0`, []);
    let categoryFreq = await pg.executeQuery(`SELECT * FROM category_frequency`, []);
    let categoryBuy = await pg.executeQuery(`SELECT * FROM category_buy`, []);
    let buyLimit = await pg.executeQuery(`SELECT value FROM settings WHERE key = 'buy_limit'`, []);
    let buyWarning = await pg.executeQuery(`SELECT value FROM settings WHERE key = 'buy_warning'`, []);


    if(porcentages.length>0){
      delete porcentages[0].id;
      delete porcentages[0].shop_id;
      return { 
              gral_porcentages: porcentages[0],
              category_buy: categoryBuy,
              category_frequency: categoryFreq,
              buy_limit: buyLimit[0].value,
              buy_warning: buyWarning[0].value
            }
    }
    return {}
  }


  static async updateGralParameters(params){
    
    // ['gral_porcentages', 'category_buy', 'category_frequency', 'buy_limit', 'buy_warning'])
    let user = await pg.executeQuery(`SELECT profile FROM users WHERE id = $1`, [params.uid]);
    if(user.length>0 && user[0].profile.toLowerCase() == 'admin')
    {
      let id = await pg.executeQuery(`SELECT id FROM porcentages WHERE shop_id = 0`)
      let data = params.gral_porcentages;
      data.id = id[0].id;
      data.shop_id = 0;
      data.uid = params.uid;

      let res1 = await pg.update('porcentages', data, {_ts: true});
      let res2 = await pg.executeQuery(`UPDATE settings SET value = $1 WHERE key = 'buy_warning'`, [params.buy_warning]);
      let res3 = await pg.executeQuery(`UPDATE settings SET value = $1 WHERE key = 'buy_limit'`, [params.buy_limit]);
      
      for(let i = 0; i<params.category_frequency.length; i++) {
        await pg.update('category_frequency',params.category_frequency[i], {_ts: false});
      }
      for(let i = 0; i<params.category_buy.length; i++) {
        await pg.update('category_buy',params.category_buy[i], {_ts: false});
      }

      // if(res1.length > 0 && res2.length> 0 && res3.length> 0)
        return { success: true, res: 'Parametros actualizados' };
      // else
      //   return { success: false, res: 'No se pudo actualizar los parametros grales' };
     
      
    }
    return { success: false, res: 'El usuario no tiene privilegios para cambiar los parametros' };
        
  }
  

  
  // static getTransactions(localId, qty){
  //   if(qty>0)
  //   {
  //     return pg.executeQuery(`SELECT t.id, t.fecha, t.total, t.puntos, t.puntos_a_generar, CONCAT(e.nombre, ' ', e.apellido) as vendedor,
  //                             CONCAT(c.nombre, ' ', c.apellido) as cliente
  //                           FROM transacciones t
  //                             INNER JOIN empleados e ON t.empleado_id = e.id
  //                             INNER JOIN clientes c ON t.tarjeta_id = c.tarjeta_id
  //                           WHERE t.local_id = $1 AND fecha >= (NOW() - INTERVAL '$2 DAY')
  //                             ORDER BY fecha DESC`, [localId, qty]);
  //   }
  //   else{
  //     return pg.executeQuery(`SELECT t.id, t.fecha, t.total, t.puntos, t.puntos_a_generar, CONCAT(e.nombre, ' ', e.apellido) as vendedor,
  //                             CONCAT(c.nombre, ' ', c.apellido) as cliente
  //                           FROM transacciones t
  //                             INNER JOIN empleados e ON t.empleado_id = e.id
  //                             INNER JOIN clientes c ON t.tarjeta_id = c.tarjeta_id
  //                           WHERE t.local_id = $1 AND fecha >= (NOW() - INTERVAL '30 DAY')
  //                             ORDER BY fecha DESC`, [localId]);
  //   }
  // }


  // static getDashboard(localId){

  //   return Promise.all([
      
  //     pg.executeQuery(`SELECT COALESCE(sum(total),0) as total, COALESCE(sum(efectivo),0) as efectivo, COALESCE(sum(credito),0) as credito, 
  //                       COALESCE(sum(debito),0) as debito, COALESCE(sum(puntos),0) as puntos_gastados, COALESCE(sum(puntos_a_generar),0) as puntos_a_generar 
  //                      FROM transacciones
  //                       WHERE local_id = $1 AND DATE(fecha) = DATE(NOW());`, [localId]),
  //                       pg.executeQuery(`SELECT COALESCE(sum(total),0) as total, COALESCE(sum(efectivo),0) as efectivo, COALESCE(sum(credito),0) as credito, 
  //                       COALESCE(sum(debito),0) as debito, COALESCE(sum(puntos),0) as puntos_gastados, COALESCE(sum(puntos_a_generar),0) as puntos_a_generar 
  //                      FROM transacciones
  //                       WHERE local_id = $1 AND EXTRACT(MONTH FROM fecha) = EXTRACT (MONTH FROM NOW()) 
  //                       AND EXTRACT(YEAR FROM fecha) = EXTRACT (YEAR FROM NOW());`, [localId]),
  //                       pg.executeQuery(`SELECT COALESCE(sum(total),0) as total, COALESCE(sum(efectivo),0) as efectivo, COALESCE(sum(credito),0) as credito, 
  //                       COALESCE(sum(debito),0) as debito, COALESCE(sum(puntos),0) as puntos_gastados, COALESCE(sum(puntos_a_generar),0) as puntos_a_generar 
  //                      FROM transacciones
  //                       WHERE local_id = $1 AND EXTRACT(YEAR FROM fecha) = EXTRACT (YEAR FROM NOW());`, [localId])
  //   ])                  
  //   .then( function(res){
      
  //     const result = { 'Hoy': res[0][0],
  //                    'Mes actual': res[1][0],
  //                    'Año actual': res[2][0]
  //                  }
  //     return result;
  //   })

  // }

}
module.exports = Project;
