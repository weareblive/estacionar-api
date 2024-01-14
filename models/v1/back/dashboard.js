//
//  Created by Trazzart on 01/01/2017
//  Copyright © 2021 Trazzart. All rights reserved.
//
let pg = require( '../../../lib/pgUtil');
let debug = require('debug')('estacionart:models:back:dashboard');
let dateFormat = require('dateformat');
let emails = require('../emails');
let mailer = require('../../../lib/mailer');

class Dashboards{

  // Get Statistics
  static async getStatistics(uid){
    let user = await pg.executeQuery(`SELECT * FROM users WHERE id = $1 AND enabled`, [uid]);
    let res = [];
    let arrayAgrupado = [];
    if(user.length>0)
    {
      switch(user[0].profile_id){
        case 'CLIENTE':
          res = await pg.executeQuery(`SELECT platform, s.name AS status, COUNT(*)::integer AS count
                                          FROM tickets t 
                                            INNER JOIN status s 
                                            ON s.id= t.status_id 
                                          WHERE project_id = $1
                                          GROUP BY platform, s.name`, [user[0].project_id]);

          arrayAgrupado = Object.values(res.reduce((resultado, objeto) => {
            // Usa la propiedad 'categoria' para agrupar
            const platform = objeto.platform;
          
         

            // Inicializa el array de esa categoría si aún no existe
            if (!resultado[platform]) {
              resultado[platform] = { platform, 
               generados: 0, pendientes: 0, en_desarrollo: 0, cerrados: 0 };
            }
            
            // Añade el objeto al array correspondiente
            if(objeto.status == 'Abierto') resultado[platform].pendientes += objeto.count;
            if(objeto.status == 'En curso' || objeto.status == 'En desarrollo' || objeto.status == 'En testing') resultado[platform].en_desarrollo += objeto.count;
            if(objeto.status == 'Cancelado' || objeto.status == 'Cerrado') resultado[platform].cerrados += objeto.count;
            if(objeto.status != 'Pendiente') resultado[platform].generados += objeto.count;
            
          
            return resultado;
          }, {}));
                                
          break;

        default:
          res = await pg.executeQuery(`SELECT p.logo, p.name AS project_name, s.name AS status, COUNT(*)::integer AS count 
                                        FROM tickets t 
                                          INNER JOIN status s 
                                            ON s.id= t.status_id
                                          INNER JOiN projects p
                                            ON p.id = t.project_id
                                        WHERE p.enabled
                                          GROUP BY p.name, s.name, p.logo`, []);

                                          
                                            
          arrayAgrupado = Object.values(res.reduce((resultado, objeto) => {
            // Usa la propiedad 'categoria' para agrupar
            const projectName = objeto.project_name;
          
            // Inicializa el array de esa categoría si aún no existe
            if (!resultado[projectName]) {
                resultado[projectName] = { logo: objeto.logo, project_name: objeto.project_name, 
                  generados: 0, pendientes: 0, en_desarrollo: 0, cerrados: 0 };
            }
          
            // Añade el objeto al array correspondiente
            if(objeto.status == 'Abierto') resultado[projectName].pendientes += objeto.count;
            if(objeto.status == 'En curso' || objeto.status == 'En desarrollo' || objeto.status == 'En testing') resultado[projectName].en_desarrollo += objeto.count;
            if(objeto.status == 'Cancelado' || objeto.status == 'Cerrado') resultado[projectName].cerrados += objeto.count;
            if(objeto.status != 'Pendiente') resultado[projectName].generados += objeto.count;
              
            
          
            return resultado;
          }, {}));

          break;
      

      }

      if(res.length>0)
        return {'err': false, 'res': arrayAgrupado};
      else 
        return {'err': true, 'res': []};

    }
    else{
      return {'err': true, 'res': 'Existe un problema con el usuario que hace la peticion'};
    }
  }
  


}
module.exports = Dashboards;
