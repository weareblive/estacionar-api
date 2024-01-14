//
//  Created by Trazzar on 01/01/2017
//  Copyright © 2023 Trazzar. All rights reserved.
//
let debug = require('debug')('clubgaleria:models:emails');
let fs = require('fs');
let path = require('path');

class Emails{

  static getContent(templateName, params){

    return new Promise(
      function (resolve, reject) {

        let filePath = path.join(__dirname, `../../templates/emails/${templateName}.html`);

        fs.readFile(filePath, {encoding: 'utf-8'}, function(err,data){
          if (err) {
            console.log('Template error');
            console.log(err);
            reject(err);
          } else {

            debug('PARAMS');
            debug(params);

            Object.entries(params).forEach(([clave, valor]) => {
              
              data = data.replace(`{{${clave}}}`, valor);
            });

        		resolve(data);
          }
        });
      }
    );
  }



}
module.exports = Emails;
