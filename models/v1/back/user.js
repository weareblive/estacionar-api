//
//  Created by Trazzart on 01/01/2017
//  Copyright © 2021 Trazzart. All rights reserved.
//
let pg = require( '../../../lib/pgUtil');
let debug = require('debug')('estacionart:models:back:user');
let dateFormat = require('dateformat');
const admin = require('firebase-admin');
let emails = require('../emails');
let mailer = require('../../../lib/mailer');

class User{

  // USERS
  static async getAllUsers(){

    let res = await pg.executeQuery(`SELECT u.*, p.logo AS project_logo, p.name AS project_name FROM users u LEFT JOIN projects p ON u.project_id = p.id
                                        ORDER BY created_at DESC`, []);
    
    // for(let i=0; i<res.length; i++)
    // { 
    //   if(res[i].profile.toLowerCase() == 'manager' && Boolean(res[i].shops) && res[i].shops.length>0) {
    //     res[i].shops = await pg.executeQuery(`SELECT id, name, logo FROM shops WHERE enabled AND id = ANY(SELECT unnest(shops) FROM users WHERE id = $1)`, [res[i].id]);
    //   }
    //   else
    //     res[i].shops = [];
    // }
    return res;
  }

  static async getUserById(userId){

    const res = await pg.executeQuery(`SELECT * FROM users WHERE id = $1 ORDER BY created_at DESC`, [userId]);

    // if(res[0].profile.toLowerCase() == 'manager')
    //   // res[0].shops = await pg.executeQuery(`SELECT id, name, logo FROM shops WHERE enabled and id <= 99 ORDER BY id DESC LIMIT 3`);
    //   res[0].shops = await pg.executeQuery(`SELECT id, name, logo FROM shops WHERE enabled AND id = ANY(SELECT unnest(shops) FROM users WHERE id = $1)`, [userId]);
    // else
    //   res[0].shops = await pg.executeQuery(`SELECT id, name, logo FROM shops WHERE enabled and id = 0`);
    return res[0];
  
  }
  


  static async getUserByUid(uid){

    let userInfo = await admin.auth().getUser(uid);

    return userInfo;
  
  }


  static async createUser(params){
    delete params.uid;
    params.enabled = true;


    // Array de palabras comunes
    const palabrasComunes = [
      'perro', 'gato', 'elefante', 'jirafa', 'tigre', 'leon', 'cebra', 'cocodrilo', 'conejo', 'raton', 'vaca', 'oveja',
      'caballo', 'pollo', 'pato', 'pavo', 'serpiente', 'araña', 'pez', 'rana', 'pinguino', 'loro', 'abeja', 'hormiga',
      'canguro', 'koala', 'panda', 'hiena', 'rinoceronte', 'hipopotamo', 'manzana', 'platano', 'naranja', 'uva', 'pera',
      'sandia', 'melon', 'fresa', 'mango', 'kiwi', 'piña', 'limon', 'cereza', 'papaya', 'tomate', 'zanahoria', 'cebolla',
      'papa', 'calabaza', 'lechuga', 'espinaca', 'brocoli', 'coliflor', 'pepino', 'repollo', 'pimiento', 'ajo', 'calabacin',
      'zanahoria', 'pepino', 'pimiento', 'ajo', 'calabacin', 'uva', 'banana', 'manzana', 'naranja', 'sandia', 'platano',
      'pera', 'fresa', 'piña', 'papaya', 'mango', 'limon', 'kiwi', 'ciruela', 'durazno', 'pomelo', 'kiwi', 'nuez', 'almendra',
      'avellana', 'castaña', 'mandarina', 'higo', 'mora', 'morron', 'batata', 'rabanito', 'espinaca', 'acelga', 'apio',
      'choclo', 'remolacha', 'guisante', 'endivia', 'nabo', 'berenjena', 'calabacin', 'garbanzo', 'guayaba', 'sandia', 'platano',
      'pera', 'fresa', 'piña', 'papaya', 'mango', 'limon', 'kiwi', 'ciruela', 'durazno', 'pomelo', 'kiwi', 'nuez', 'almendra',
      'avellana', 'castaña', 'mandarina', 'higo', 'mora', 'morron', 'batata', 'rabanito', 'espinaca', 'acelga', 'apio',
      'choclo', 'remolacha', 'guisante', 'endivia', 'nabo', 'berenjena', 'calabacin', 'garbanzo'
    ];
  
    // Generar un número aleatorio del 100 al 999
    const numeroAleatorio = Math.floor(Math.random() * (999 - 100 + 1)) + 100;
  
    // Obtener una palabra aleatoria del array de palabras comunes
    const palabraAleatoria = palabrasComunes[Math.floor(Math.random() * palabrasComunes.length)];
  
    // Construir la contraseña concatenando la palabra aleatoria y el número aleatorio
    const pwd = palabraAleatoria + '.' +  numeroAleatorio;
    // params.password = this.generatePassword();
    params.password = pwd;

    const userData = {
      email: params.email,
      emailVerified: true,
      password: params.password,
      displayName: `${params.first_name}  ${params.last_name}`,
      disabled: false
    };

    debug(params.password);

    try{
      let res = await admin.auth().createUser(userData);
      
      if(res.uid)
      { 
        params.id = res.uid;

        let projects = [];
        
        let user = await pg.insert('users', params, {_ts: true});

        let claim = {profile: user[0].profile_id};

        if(user[0].profile_id == 'CLIENTE' && Boolean(user[0].project_id)){

            claim.project = { id: user[0].project_id };
            const project = await pg.executeQuery(`SELECT name, logo FROM projects WHERE id = $1`, [user[0].project_id]);

            if(project.length > 0) {
              claim.project.name = project[0].name;
              claim.project.logo = project[0].logo;
            }
          

        }
        let maver = await admin.auth().setCustomUserClaims(user[0].id, claim);
        
        await emails.getContent('new_user', { 
                                from: 'helpdesk@trazzart.com', 
                                to: user[0].email, 
                                message: 'Nuevo usuario', 
                                user_email: user[0].email,
                                user_name: user[0].first_name,
                                user_password: user[0].password,
                                title: 'Nuevo usuario'})
        .then((htmlContent) => {
          mailer.send({"email": user[0].email, "subject": `Nueva cuenta de acceso`, "text": 'Nueva cuenta de acceso', "html": htmlContent });
        });

        return {success: true, res: user[0] };
        
      }
      else { 
        console.log('NO HAY UID');
        return {success: false, res: 'Error al querer crear usuario' };
      }      
        
    }
    catch(err){
      debug(err);
      if(err.code)
        return { success: false, res: err.code }
      else
        return { success: false, res: err }
    }
    
  }


  static login(email, pwd){

    return pg.executeQuery(`SELECT id, first_name, last_name, profile, enabled FROM users WHERE email = $1 AND password = $2 AND enabled = true`, [email, pwd])
    .then(res => {
      if(res.length > 0)
        return res[0];
      else
        return {};
    });
  
  }


  static async changeUserPassword(params){

    debug(params);
    
    const res =  await pg.executeQuery(`SELECT COUNT(*) AS qty FROM users WHERE id = $1 AND password = $2 AND enabled = true`, [params.uid, params.old_password]);

    debug(res);

    if(res[0].qty == 1){

      if(params.new_password.length < 6){
        return {success: false, res: `La nueva contraseña debe contener al menos 6 caracteres`};
      }
      else {
        const user = await pg.executeQuery(`UPDATE users SET password = $1 WHERE id = $2 RETURNING *`, [params.new_password, params.uid]);
        
        if(user.length>0) 
          return {success: true, res: `Contraseña cambiada satisfactoriamente.`};  
        else 
          return {success: false, res: `No se pudo cambiar la contraseña`};
      }  
    }
    else {
      return {success: false, res: `No se pudo cambiar la contraseña`};
    }
  
  }

  
  
  static async sendUserPassword(userId){

    const user =  await pg.executeQuery(`SELECT email, first_name, last_name, first_name, last_name, password FROM users WHERE enabled AND id = $1`, [userId]);

    if(user.length == 1){
  
      await emails.getContent('pwd_recovery', { 
              from: 'helpdesk@trazzart.com', 
              to: user[0].email, 
              message: 'Envio de contraseña', 
              user_email: user[0].email,
              user_name: user[0].first_name,
              user_password: user[0].password,
              title: 'Envio de contraseña'})
      .then((htmlContent) => {
      mailer.send({"email": user[0].email, "subject": `Recuperación de contraseña`, "text": 'Recuperación  de contraseña', "html": htmlContent });
      });

      return {success: true, res: `Contraseña enviada satisfactoriamente.`};  
      
    }
    else {
      return {success: false, res: `No se pudo enviar la contraseña`};
    }
  
  }




  static generatePwd() {
    // Array de palabras comunes
    const palabrasComunes = [
      'perro', 'gato', 'elefante', 'jirafa', 'tigre', 'leon', 'cebra', 'cocodrilo', 'conejo', 'raton', 'vaca', 'oveja',
      'caballo', 'pollo', 'pato', 'pavo', 'serpiente', 'araña', 'pez', 'rana', 'pinguino', 'loro', 'abeja', 'hormiga',
      'canguro', 'koala', 'panda', 'hiena', 'rinoceronte', 'hipopotamo', 'manzana', 'platano', 'naranja', 'uva', 'pera',
      'sandia', 'melon', 'fresa', 'mango', 'kiwi', 'piña', 'limon', 'cereza', 'papaya', 'tomate', 'zanahoria', 'cebolla',
      'papa', 'calabaza', 'lechuga', 'espinaca', 'brocoli', 'coliflor', 'pepino', 'repollo', 'pimiento', 'ajo', 'calabacin',
      'zanahoria', 'pepino', 'pimiento', 'ajo', 'calabacin', 'uva', 'banana', 'manzana', 'naranja', 'sandia', 'platano',
      'pera', 'fresa', 'piña', 'papaya', 'mango', 'limon', 'kiwi', 'ciruela', 'durazno', 'pomelo', 'kiwi', 'nuez', 'almendra',
      'avellana', 'castaña', 'mandarina', 'higo', 'mora', 'morron', 'batata', 'rabanito', 'espinaca', 'acelga', 'apio',
      'choclo', 'remolacha', 'guisante', 'endivia', 'nabo', 'berenjena', 'calabacin', 'garbanzo', 'guayaba', 'sandia', 'platano',
      'pera', 'fresa', 'piña', 'papaya', 'mango', 'limon', 'kiwi', 'ciruela', 'durazno', 'pomelo', 'kiwi', 'nuez', 'almendra',
      'avellana', 'castaña', 'mandarina', 'higo', 'mora', 'morron', 'batata', 'rabanito', 'espinaca', 'acelga', 'apio',
      'choclo', 'remolacha', 'guisante', 'endivia', 'nabo', 'berenjena', 'calabacin', 'garbanzo'
    ];
  
    // Generar un número aleatorio del 100 al 999
    const numeroAleatorio = Math.floor(Math.random() * (999 - 100 + 1)) + 100;
  
    // Obtener una palabra aleatoria del array de palabras comunes
    const palabraAleatoria = palabrasComunes[Math.floor(Math.random() * palabrasComunes.length)];
  
    // Construir la contraseña concatenando la palabra aleatoria y el número aleatorio
    const pwd = palabraAleatoria + numeroAleatorio;
  
    return pwd;
  }
  


  static async updateUser(params){
    
    delete params.uid;
    delete params.password;
    params.id = params.user_id;
    delete params.user_id;

    try{
      let res = await pg.update('users', params, {_ts: false});
      if(res.length > 0)
      {
        let userData = {
          email: res[0].email,
          displayName: `${res[0].first_name}  ${res[0].last_name}`,
          disabled: !res[0].enabled
        }
        await admin.auth().updateUser(res[0].id, userData);

        let claim = {profile: res[0].profile_id};

        if(res[0].profile_id == 'CLIENTE' && Boolean(res[0].project_id)){

          claim.project = { id: res[0].project_id };
          const project = await pg.executeQuery(`SELECT name, logo FROM projects WHERE id = $1`, [res[0].project_id]);

          if(project.length > 0) {
            claim.project.name = project[0].name;
            claim.project.logo = project[0].logo;
          }

        }
        let maver = await admin.auth().setCustomUserClaims(res[0].id, claim);
        
        
        return {success: true, res: res[0] };
        

      }
      else {
        return {success: false, res: clientProfile };
      }
    }
    catch (err) {
      return {success: false, res: err };
    }
     
  }

}
module.exports = User;
