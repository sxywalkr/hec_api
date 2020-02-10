const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const app = express();
var jwt = require('jsonwebtoken');
var serviceAccount = require("./permissions.json");
app.use(cors({ origin: true }));

admin.initializeApp({
   credential: admin.credential.cert(serviceAccount),
   databaseURL: "https://fbhecc.firebaseio.com"
});

const db = admin.database();

// app.get('/api/token', (req, res) => {
//     db.ref('usersgo').once('value')
//         .then((snapshot) => {
//             // console.log(snapshot)
//             return res.status(200).send(snapshot.val());
//         });
//     jwt.sign({ foo: 'bar' }, 'secret', function (err, token) {
//         console.log('token', token);
//         console.log(err);
//     });
// });

app.post('/api/token', (req, res) => {
   try {
      var username = req.headers.username;
      var password = req.headers.password;
      // console.log(req.headers.username, password)
      if (!username || !password ) { return res.status(500).send('not valid')}

      jwt.sign({ username, password }, 'secret', function (err, token) {
         try {
            var response = { token: token };
            var metadata = {
               message: 'OK',
               code: 200
            }
            return res.status(200).send({ response, metadata });
            // console.log('token', token);
         } catch (err) {
            return res.status(500).send(err);
            // console.log(err);
         }
      });
   }
   catch (error) {
      return res.status(500).send(error);
   }

});

app.post('/api/create', (req, res) => {
   (async () => {
      try {
         const paramHeader1 = req.headers.x - token;
         console.log(paramHeader1);
         const paramBody1 = req.body.nomorkartu;
         await db.ref('/usersgo').push({ item: paramBody1 });
         return res.status(200).send();
      } catch (error) {
         console.log(error);
         return res.status(500).send(error);
      }
   })();
});

exports.app = functions.https.onRequest(app);
