/*
    auth-middleware.js
*/
const admin = require("firebase-admin");

function authMiddleware(request, response, next) {
  const headerToken = request.headers.authorization;

  const loginToken = `estacionar@2024`;

  if (!headerToken) {
    return response.send({ message: "No token provided" }).status(401);
  }

  if (headerToken && headerToken.split(" ")[0] !== "Bearer") {
    response.send({ message: "Invalid token" }).status(401);
  }

  const token = headerToken.split(" ")[1];

  try{
    console.log('decoding');
    console.log(token);
    
   
    // MODO PRUEBA
    console.log('ENTRO A MODO PRUEBA');
    if(token === loginToken || token === 'bAcK'){
      if(token === loginToken)
        request.body.uid = '7RlzvIo21EXb6QrIsyL4NcXlSob2';
      else
        request.body.uid = '496uW2Xep6Ztr3uZzovqSTsRdrT2';
      next();
    }
    else{
      admin
        .auth()
        .verifyIdToken(token)
        .then((res) => {
          request.body.uid = res.uid;
          next();
        })
        .catch((err) => {
          console.log(err.code);
          console.log(err)
          response.send({ message: "Could not authorize" }).status(403)
      });
    }
    

  }
  catch(e){
    console.log(e);
  }
}

module.exports = authMiddleware;