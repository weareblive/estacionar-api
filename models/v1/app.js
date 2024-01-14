//
//  Created by Trazzar on 01/01/2017
//  Copyright © 2023 Trazzar. All rights reserved.
//
let _ = require('lodash');
let pg = require( '../../lib/pgUtil');
let bcrypt = require( 'bcrypt-nodejs' );
let debug = require('debug')('estacionart:models:v2:app');
let config = require('../../routes/config');
const { parseAsync } = require('yargs');
let fire = require('./firebase');

class App{

    // Get shops that are enabled
    static getShops(){
        return pg.executeQuery(`SELECT * FROM shops WHERE enabled = true`, []);
    }

    static getShopList() {
        return pg.executeQuery(`SELECT id, commercial_name, logo, local, rubro, phone, working_time, whatsapp, facebook, instagram, twitter
                                FROM shops 
                                WHERE enabled = true 
                                    ORDER BY commercial_name`, []);
    }



    static getSliders(){
        return new Promise( (resolve, reject) => {
            resolve([
                { 'image_mobile': '1', url: ''},
                { 'image_mobile': '2', url: ''}
            ]);
        });
    }



static async getLastTrxs(uid){

    let client = await pg.executeQuery(`SELECT id FROM clients WHERE uid = $1 AND enabled`, [uid]);
    if(client.length>0)
    {
      const dni = client[0].id;
      let res =  await Promise.all([
        pg.executeQuery(`SELECT to_char(ca.created_at, 'DD/MM/YYYY HH24:MI') as fecha, ca.trx_id as trx, ca.description as concepto, ca.amount_club as importe, 
        ca.amount_shop as importe_shop, ca.shop_id
            FROM clients_account ca
            WHERE ca.client_id = $1
            ORDER BY ca.created_at DESC LIMIT 100`, [dni]),
        pg.executeQuery(`SELECT sum(amount_club) as saldo, sum(amount_shop) as saldo_shop FROM clients_account
        WHERE client_id = $1`, [dni]),
        pg.executeQuery(`SELECT CONCAT(clients.first_name, ' ', clients.last_name) as cliente, 
            clients.id as dni, created_at as fecha_creacion, updated_at as fecha_activacion 
            FROM clients WHERE id = $1`, [dni])
               
      ]);
    
      if(res[2].length >0)
      {
        let cliente = res[2][0];
        cliente.saldo = res[1][0].saldo;
  
        return {
                  cliente: cliente,
                  operaciones: res[0]
              }
      }
      else
      {
        return {};
      }
    }
    else{
      return {};
    }
  }
  


  static async registerClient(params){
    await pg.executeQuery('SELECT NOW()', [])
    return {success: true, res: 'Cliente registrado satisfactoriamente'}
  }
  
  static getPromos(){
    
    return pg.executeQuery(`SELECT p.*, s.logo, s.name FROM promos p INNER JOIN shops s ON s.id = p.shop_id 
                            WHERE p.enabled AND p.approved AND NOW() > p.begining AND NOW() < p.finishing`, [])
    
  }


  
  static getProfile(uid){
    return pg.executeQuery(`SELECT id, first_name, last_name, to_char(birthdate, 'DD/MM/YYYY') as birthdate,
      mobile, email, address_1, address_2, city, state, zip, uid, tramit_number FROM clients WHERE uid = $1`, [uid])
    .then(res => {
      if(res.length > 0)
        return res[0];
      
      return {};
    });
  }

  // User validation
  static realtime(shop, dni){   

    debug('realtiming');
    return fire.test(shop, dni);


  }



  static async getClientBalance(uid){

    let cli = await pg.executeQuery(`SELECT *,  TO_CHAR(birthdate, 'DD/MM') as cumple, date_part('month',age(birthdate, DATE(now()))) AS meses_cumple, date_part('day',age(birthdate, DATE(now()))) AS dias_cumple 
                                      FROM clients WHERE uid = $1`, [uid]);
    if(cli.length>0){
      if(cli[0].enabled){

        // Cliente habilitado
        return Promise.all([
          pg.executeQuery(`SELECT COALESCE(sum(amount_club),0) AS saldo, COALESCE(max(created_at), NOW()) AS ultima_compra 
            FROM clients_account WHERE client_id = $1`, [cli[0].id]),
          pg.executeQuery(`SELECT COALESCE(sum(amount_shop),0) AS saldo, COALESCE(max(created_at), NOW()) AS ultima_compra 
            FROM clients_account WHERE client_id = $1`, [cli[0].id]),
          pg.executeQuery(`WITH consumo AS (SELECT COALESCE(SUM(total), 0) AS total FROM transactions WHERE created_at > (now()- INTERVAL '12 MONTH') AND client_id = $1)
            SELECT id FROM category_buy WHERE (SELECT total from consumo) >= amount_from AND (SELECT total from consumo) < amount_to`, [cli[0].id]),
          pg.executeQuery(`WITH frequency AS (SELECT COALESCE(count(*), 0) AS qty FROM transactions WHERE created_at > (now()- INTERVAL '12 MONTH') AND client_id = $1)
            SELECT id FROM category_frequency WHERE (SELECT qty from frequency) >= qty_from AND (SELECT qty from frequency) < qty_to`, [cli[0].id]),
          pg.executeQuery(`SELECT s.name, s.logo, s.id, qry.saldo FROM shops s 
            INNER JOIN (SELECT shop_id, SUM(amount_shop) as saldo FROM clients_account
            WHERE client_id = $1  GROUP BY client_id, shop_id) AS qry
            ON qry.shop_id = s.id ORDER BY saldo DESC` ,[cli[0].id]),
          pg.executeQuery(`SELECT TO_CHAR(MAX(created_at), 'DD/MM/YY HH24:MI') as last_trx  FROM clients_account WHERE client_id = $1;` ,[cli[0].id])
        ])
        .then( function(results){
          let respuesta = {};
          let puntosClub = results[0];
          let puntosLocal = results[1];
          let categoriaConsumo = results[2];
          let categoriaFrecuencia = results[3];
          let detalleSaldoShop = results[4];
          let ultimaCompraEnLocal = results[5];

          respuesta.detalleSaldoShop = detalleSaldoShop;
          if(ultimaCompraEnLocal.length > 0)
            respuesta.ultimaTrxEnLocal = ultimaCompraEnLocal[0].last_trx;

          respuesta.cliente = {'nombre': cli[0].first_name, 'apellido': cli[0].last_name};
          respuesta.dni = cli[0].id;

          if(cli[0].dias_cumple != null && cli[0].meses_cumple != null) {

            let diasCumple = cli[0].dias_cumple;
            let mesesCumple = cli[0].meses_cumple;

            if(mesesCumple == -11 && diasCumple <= -25)
              respuesta.alerta = cli[0].nombre + ` cumple años en los próximos dias (${cli[0].birthdate})`;
            
            if(mesesCumple == 0 && diasCumple >= -5)
              respuesta.alerta = cli[0].nombre + ` cumplió años recientemente (${cli[0].birthdate})`;
            
            if(diasCumple == 0 && mesesCumple == 0)
              respuesta.alerta = `HOY es el cumpleaños de ` + cli[0].nombre;

            if(respuesta.alerta)
              respuesta.tipo_alerta = 'CUMPLE';
    
          }
          
          
          respuesta.cumple = cli[0].cumple;
          respuesta.categoria_consumo = (categoriaConsumo[0]) ? categoriaConsumo[0].id : 'BRONCE';
          respuesta.categoria_frecuencia = categoriaFrecuencia[0] ? categoriaFrecuencia[0].id : 'POCO FRECUENTE';

          if(puntosClub.length>0) respuesta.puntos_club = puntosClub[0].saldo | 0;
          if(puntosLocal.length>0) respuesta.puntos_local = puntosLocal[0].saldo | 0;
          respuesta.puntos_total = respuesta.puntos_club + respuesta.puntos_local;  

          // Agregar en en el primer elemento los puntos Club a pesar de que esten en 0
          respuesta.detalleSaldoShop.unshift( 
            {
              name: 'Puntos CLUB',
              logo: 'https://firebasestorage.googleapis.com/v0/b/club-galeria.appspot.com/o/images%2Fcg.png?alt=media&token=56fd48ed-b92d-4963-aa04-30bfad29c351',
              id: 0,
              saldo: respuesta.puntos_club
            }
          );


          debug(respuesta);
          
          return {'err': false, 'res': respuesta};  
          
           
        })
      }
    }
  
  }

  static async getMessages(uid){
    const msg = await pg.executeQuery(`SELECT NOW()`, []);
    return [];
  }
}
module.exports = App;
