//
//  Created by Trazzar on 03/01/2017.
//  Copyright © 2023 Trazzar. All rights reserved.
//
const nodemailer = require('nodemailer');
let debug = require('debug')('estacionart:lib:mailer');
const AWS = require('aws-sdk');

let transporter = null;

module.exports = {
  send: async ( options ) => {

    if(options.email && options.subject && options.text) {

      transporter = transporter || nodemailer.createTransport({
        service: process.env.COMPANY,
        host: process.env.EMAIL_HOST,
        port: 465,
        secure: true,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });


      let mailOptions = {
        from: process.env.EMAIL_USER,
        to: options.email,
        subject: options.subject,
        text: options.text
      };

      if(options.html)
      {
        mailOptions.html = options.html;
      }


      if(options.email) {

        transporter.sendMail(mailOptions, function(error, info){
          if (error) {
            console.log('ERROR');
            console.error(error);
          } else {
            console.log('Correo electrónico enviado: ' + info.response);
            console.log(info);
          }
        });
      }
      else {
        return {err: true, res: `El cliente no tiene email asociado` };
      }
      
    }
  },


  sendAwsSES: async(options) => {

    // Configura las credenciales de AWS
    AWS.config.update({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET,
      region: 'us-east-1' // Reemplaza con tu región de AWS
    });

    // Crea un objeto SES
    const ses = new AWS.SES({ apiVersion: '2010-12-01' });

    
    // Configura los detalles del correo electrónico
    const params = {
      Destination: {
        ToAddresses: [ options.email ] // Reemplaza con la dirección del destinatario
      },
      Message: {
        Body: {
          Text: {
            Data: options.text,
          },
          Html: {
            Data: options.html
          }
        },
        Subject: {
          Data: options.subject
        }
      },
      Source: process.env.EMAIL_USER, // Reemplaza con tu dirección de correo electrónico verificada en SES
    };

    // Envía el correo electrónico
    ses.sendEmail(params, function(err, data) {
      if (err) {
        console.error(err, err.stack);
      } else {
        console.log('Correo electrónico enviado:', data);
      }
    });
  }

};
