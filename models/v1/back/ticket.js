//
//  Created by Trazzart on 01/01/2017
//  Copyright © 2021 Trazzart. All rights reserved.
//
let pg = require( '../../../lib/pgUtil');
let debug = require('debug')('estacionart:models:back:ticket');
let dateFormat = require('dateformat');
let emails = require('../emails');
let mailer = require('../../../lib/mailer');

class Tickets{

  // Get Ticket List
  static async getTicketsList(uid){
    let user = await pg.executeQuery(`SELECT * FROM users WHERE id = $1 AND enabled`, [uid]);
    let res = [];
    debug(user);
    if(user.length>0)
    {
      // created_at
      // current_result
      // location
      switch(user[0].profile_id){
        case 'ADMIN':
          res = await pg.executeQuery(`SELECT t.id, project_id, type, platform, status_id, updated_at, created_at, current_result, location, p.name AS project_name, p.logo
                                        FROM tickets t INNER JOIN projects p
                                          ON p.id = t.project_id 
                                        WHERE replier_id = $1 OR replier_id IS NULL`, [uid]);
          break;
        case 'SOPORTE':
          res = await pg.executeQuery(`SELECT t.id, project_id, type, platform, status_id, updated_at, created_at, current_result, location, p.name AS project_name, p.logo
                                        FROM tickets t INNER JOIN projects p
                                          ON p.id = t.project_id 
                                        WHERE replier_id = $1 OR replier_id IS NULL`, [uid]);
          break;
        case 'CLIENTE':
          res = await pg.executeQuery(`SELECT t.id, project_id, type, platform, status_id, updated_at, created_at, current_result, location, p.name AS project_name, p.logo
                                        FROM tickets t INNER JOIN projects p
                                          ON p.id = t.project_id 
                                        WHERE creator_id = $1`, [uid]);
          break;

      }

      if(res.length>0)
        return {'err': false, 'res': res};
      else 
        return {'err': true, 'res': []};

    }
    else{
      return {'err': true, 'res': 'Existe un problema con el usuario que hace la peticion'};
    }
  }
  


  // Create Ticket
  static async createTicket(params){
   
    let data = params;
    data.creator_id = params.uid;
    delete params.uid;

    let ticket = await pg.insert('tickets', data);
    if(ticket.length>0){
      
      let status = await pg.executeQuery(`SELECT UPPER(name) AS name FROM status WHERE id = $1`, [ticket[0].status_id]);
      let projects = await pg.executeQuery(`SELECT * FROM projects WHERE id = $1`, [ticket[0].project_id]);
      let user = await pg.executeQuery(`SELECT * FROM users WHERE id = $1`, [ticket[0].creator_id]);
      let users = await pg.executeQuery(`SELECT STRING_AGG(email, ',') AS soportes
                                            FROM users
                                            WHERE project_id IS NULL;`, []);
      
      await emails.getContent('new_ticket', { 
                              from: 'helpdesk@trazzart.com', 
                              to: users[0].soportes, 
                              project_name: projects[0].name,
                              project_logo: projects[0].logo, 
                              message: 'Nuevo ticket', 
                              ticket_status: status[0].name, 
                              ticket_number: ticket[0].id, 
                              ticket_type: ticket[0].type,
                              title: 'Nuevo ticket'})
      .then((htmlContent) => {
        mailer.send({"email": users[0].soportes, "subject": `Nuevo Ticket (#${ticket[0].id}) de ${projects[0].name}`, "text": 'Nuevo ticket', "html": htmlContent });
      });

      return {'err': false, 'res': ticket[0]};
    }
    else 
      return {'err': true, 'res': 'Error al crear el ticket'};
    
  }

  static async getTicketById(id){
    let res = await pg.executeQuery(`SELECT id, project_id, type, platform, location, current_result, expected_result, messages, suggestion, screenshot, 
              creator_id, replier_id, status_id, 
              to_char(created_at, 'DD/MM/YYYY HH24:MI') as created_at,
              to_char(updated_at, 'DD/MM/YYYY HH24:MI') as updated_at FROM tickets WHERE id = $1`, [id]);
    if(res.length>0){

      if(Boolean(res[0].messages)) {
        for(let i=0; i<res[0].messages.length;i++)
        {
          let user = await pg.executeQuery(`SELECT CONCAT(first_name, ' ', last_name) as name, profile_id FROM users WHERE id = $1`,[res[0].messages[i].uid])
          if(user.length>0)
          {
            res[0].messages[i].username = user[0].name || '';
            res[0].messages[i].is_client = (user[0].profile_id == 'CLIENTE');
          }
        }
      }

      return res[0];
    }
      
    return {}
  }

  
  static async addMessage(params){
    let date = await pg.executeQuery(`SELECT NOW()`, []);
    let ticket = await pg.executeQuery(`UPDATE tickets
                            SET messages = messages || ARRAY['{"created_at": "${date[0].now}", "uid": "${params.uid}", "message": "${params.message}"}'::json]
                            WHERE id = ${params.ticket_id} RETURNING *;`, []);
    if(ticket.length>0){

      let status = await pg.executeQuery(`SELECT UPPER(name) AS name FROM status WHERE id = $1`, [ticket[0].status_id]);
      let projects = await pg.executeQuery(`SELECT * FROM projects WHERE id = $1`, [ticket[0].project_id]);
      let to;
      let client_first_name = 'equipo';
      if(ticket[0].creator_id == params.uid){
        // Mensaje enviado por el cliente
        to = await pg.executeQuery(`SELECT STRING_AGG(email, ',') AS email
                                            FROM users
                                            WHERE enabled AND project_id IS NULL;`, []);
                                            
      }
      else
      {
        // Mensaje enviado por soporte
        to = await pg.executeQuery(`SELECT * FROM users WHERE id = $1`, [ticket[0].creator_id]);
        client_first_name = to[0].first_name;
      }
   
      

      await emails.getContent('new_message', { 
        from: 'helpdesk@trazzart.com', 
        to: to[0].email, 
        message: params.message,
        client_first_name, 
        project_name: projects[0].name,
        project_logo: projects[0].logo, 
        ticket_status: status[0].name, 
        ticket_number: ticket[0].id, 
        ticket_type: ticket[0].type,
        title: 'Nuevo mensaje'})
      .then((htmlContent) => {
        mailer.send({"email": to[0].email, "subject": `Nuevo mensaje (#${ticket[0].id}) de ${projects[0].name}`, "text": 'Nuevo mensaje', "html": htmlContent });
      });


      return {success:true, res: 'Mensaje guardado correctamente'} ;
    }
    else
      return {success:false, res: 'No se pudo guardar el mensaje'} ;
  }

  // Update Ticket
  static async updateTicket(params){
   
    let data = params;
    delete data.creator_id;
    delete data.uid;

    let res = await pg.update('tickets', data, {_ts:true});
    if(res.length>0){
     
      return {'err': false, 'res': res[0]};
    }
    else 
      return {'err': true, 'res': 'Error al actualizar el ticket'};
    
  }



  // Update Ticket Status
  static async updateTicketStatus(id, status_id){
   
    let res = await pg.update('tickets', {id, status_id}, {_ts:true});
    if(res.length>0){
      
      let status = await pg.executeQuery(`SELECT UPPER(name) AS name FROM status WHERE id = $1`, [status_id]);
      let ticket = await pg.executeQuery(`SELECT * FROM tickets WHERE id = $1`, [id]);
      let projects = await pg.executeQuery(`SELECT * FROM projects WHERE id = $1`, [ticket[0].project_id]);
      let user = await pg.executeQuery(`SELECT * FROM users WHERE id = $1`, [ticket[0].creator_id]);this.addMessage      

      await emails.getContent('status_changed', { 
                              from: 'helpdesk@trazzart.com', 
                              to: user[0].email, 
                              recipient_email: user[0].email,
                              project_name: projects[0].name,
                              project_logo: projects[0].logo, 
                              message: 'Cambio de estado', 
                              ticket_status: status[0].name, 
                              ticket_number: id, 
                              client_first_name: user[0].first_name, 
                              title: 'Cambio de estado'})
      .then((htmlContent) => {
        mailer.send({"email": user[0].email, "subject": `Cambio de estado Ticket Nro. ${id}`, "text": 'Cambio de estado', "html": htmlContent });
      });

      return {'err': false, 'res': res[0]};
    }
    else 
      return {'err': true, 'res': 'Error al actualizar el estado del ticket'};
    
  }




}
module.exports = Tickets;
