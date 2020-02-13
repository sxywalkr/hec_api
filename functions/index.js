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

// const db = admin.database();

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


function IntTwoChars(i) {
   return (`0${i}`).slice(-2);
}

app.get('/api/tes', (req, res) => {
   let date_ob = new Date();
   let date = IntTwoChars(date_ob.getDate());
   let month = IntTwoChars(date_ob.getMonth() + 1);
   let year = date_ob.getFullYear();
   // var qwe1 = new Date(`${year}-${month}-${date} 13:00:00`);
   var aa = '2020-02-12'
   var qwe1 = new Date(`${aa} 13:00:00`)
   if (qwe1.getDay() !== 0) {
      var qwe2 = qwe1.getTime()
      return res.status(200).send(qwe2.toString())
   }
})

app.post('/api/token', (req, res) => {
   try {
      var username = req.body.username;
      var password = req.body.password;
      // console.log(req.headers.username, password)
      if (!username || !password) { return res.status(500).send('not valid') }

      jwt.sign({ username, password }, 'secret', function (err, token) {
         try {
            var response = { token: token };
            var metadata = { message: 'OK', code: 200 }
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

app.post('/api/get-antrian', (req, res) => {
   try {
      var xtoken = req.headers['x-token'];
      var nomorkartu = req.body.nomorkartu;
      var tanggalperiksa = req.body.tanggalperiksa;
      var response = {};
      var userTanggalBooking2 = 9999
      var objUserUid = 9999
      var baseTimeAntrian = new Date(tanggalperiksa)
      if (baseTimeAntrian.getDay !== 5) {
         baseTimeAntrian = new Date(`${tanggalperiksa} 09:00:00`).getTime()
      } else {
         baseTimeAntrian = new Date(`${tanggalperiksa} 13:00:00`).getTime()
      }

      jwt.verify(xtoken, 'secret', function (err, decoded) {
         // console.log(decoded.username, decoded.password) // bar
         if (err) { return res.status(500).send(err); }
         try {
            username = decoded.username;
            password = decoded.password;
            if (username === '"hecbpjs"' && password === '"superpassword"') {
               // cek nomor kartu bpjs di system
               admin.database().ref('users').orderByChild('userNoBpjs').equalTo(nomorkartu).once('value')
                  .then((snapshot) => {
                     if (snapshot.exists()) {
                        // console.log('user ada di db')
                        // var response = {};
                        var metadata = { message: 'OK', code: 200 }
                        // var userTanggalBooking2 = 9999
                        // var objUserUid = 9999
                        Object.keys(snapshot.val()).map((key) => {
                           objUserUid = snapshot.val()[key].userUid
                           userTanggalBooking2 = snapshot.val()[key].userTanggalBooking2
                        })
                        if (userTanggalBooking2 !== '') {
                           // console.log('user ada di db dan ambil nomor antrian')
                           Object.keys(snapshot.val()).map((key) => {
                              response.nomorantrean = snapshot.val()[key].userNomorAntrian
                              response.kodebooking = snapshot.val()[key].userNomorAntrian
                              response.estimasidilayani = parseInt(baseTimeAntrian) + parseInt(snapshot.val()[key].userNomorAntrian, 10) * 15 * 60000
                              response.jenisantrean = 1
                              response.namapoli = 'Poli 1'
                              response.namadokter = 'Dokter 1'
                              return res.status(200).send({ response, metadata })
                           })
                        } else {
                           var ref1 = admin.database().ref('hecAntrian/indexes/' + tanggalperiksa).once('value');
                           ref1.then((result1) => {
                              console.log('user ada di db tp belum antrian')
                              if (result1.exists()) {
                                 // console.log('antrian online - next')
                                 var latestOnlineQueue = result1.val().latestOnlineQueue + 1
                                 var antrianTotal = result1.val().antrianTotal + 1
                                 const ruleAntrian = [4, 5, 9, 10, 14, 15, 19, 20, 24, 25, 29, 30, 34, 35, 39, 40]
                                 if (ruleAntrian.includes(latestOnlineQueue)) {
                                    latestOnlineQueue = latestOnlineQueue + 0
                                 } else {
                                    latestOnlineQueue = latestOnlineQueue + 3
                                 }
                                 admin.database().ref(`hecAntrian/indexes/${tanggalperiksa}`).update({
                                    latestOnlineQueue: latestOnlineQueue,
                                    antrianTotal: antrianTotal
                                 })
                                 admin.database().ref(`hecAntrian/indexes/${tanggalperiksa}/detail/${latestOnlineQueue}`).update({
                                    antrianNomor: latestOnlineQueue,
                                    antrianUserUid: objUserUid,
                                    antrianUserNama: nomorkartu,
                                    antrianUserNoBpjs: nomorkartu,
                                    antrianTanggalBooking2: tanggalperiksa,
                                 })
                                 admin.database().ref(`users/${objUserUid}`).update({
                                    userTanggalBooking2: tanggalperiksa,
                                    userNomorAntrian: latestOnlineQueue,
                                    userFlagActivity: 'Booking Antrian',
                                 });
                                 response.nomorantrean = latestOnlineQueue
                                 response.kodebooking = latestOnlineQueue
                                 response.estimasidilayani = parseInt(baseTimeAntrian) + parseInt(latestOnlineQueue, 10) * 15 * 60000
                                 response.jenisantrean = 1
                                 response.namapoli = 'Poli 1'
                                 response.namadokter = 'Dokter 1'
                                 return res.status(200).send({ response, metadata })
                              } else {
                                 // console.log('antrian online - 4')
                                 admin.database().ref('hecAntrian/indexes/' + tanggalperiksa).update({
                                    latestOnlineQueue: 4,
                                    antrianTotal: 1
                                 })
                                 admin.database().ref('hecAntrian/indexes/' + tanggalperiksa + '/detail/4').update({
                                    antrianNomor: 4,
                                    antrianUserUid: objUserUid,
                                    antrianUserNama: nomorkartu,
                                    antrianUserNoBpjs: nomorkartu,
                                    antrianTanggalBooking2: tanggalperiksa,
                                 })
                                 admin.database().ref('users/' + objUserUid).update({
                                    userTanggalBooking2: tanggalperiksa,
                                    userNomorAntrian: 4,
                                    userFlagActivity: 'Booking Antrian',
                                    userStatusPasien: 'BPJS',
                                 });
                                 response.nomorantrean = 4
                                 response.kodebooking = 4
                                 response.estimasidilayani = parseInt(baseTimeAntrian) + parseInt(4, 10) * 15 * 60000
                                 response.jenisantrean = 1
                                 response.namapoli = 'Poli 1'
                                 response.namadokter = 'Dokter 1'
                                 return res.status(200).send({ response, metadata })
                              }
                           })

                        }
                     } else {
                        console.log('user ny registered on db')
                        // admin.auth
                        admin.auth().createUser({
                           email: nomorkartu + '@hec.com',
                           emailVerified: false,
                           // phoneNumber: '+11234567890',
                           password: 'password',
                           displayName: nomorkartu,
                           disabled: false
                        })
                           .then((userRecord) => {
                              objUserUid = userRecord.uid;
                              var ref1 = admin.database().ref('hecAntrian/indexes/' + tanggalperiksa).once('value');
                              ref1.then((result1) => {
                                 // console.log('user belum antrian')
                                 if (result1.exists()) {
                                    // console.log('antrian online - next')
                                    var latestOnlineQueue = result1.val().latestOnlineQueue + 1
                                    var antrianTotal = result1.val().antrianTotal + 1
                                    const ruleAntrian = [4, 5, 9, 10, 14, 15, 19, 20, 24, 25, 29, 30, 34, 35, 39, 40]
                                    if (ruleAntrian.includes(latestOnlineQueue)) {
                                       latestOnlineQueue = latestOnlineQueue + 0
                                    } else {
                                       latestOnlineQueue = latestOnlineQueue + 3
                                    }
                                    admin.database().ref(`hecAntrian/indexes/${tanggalperiksa}`).update({
                                       latestOnlineQueue: latestOnlineQueue,
                                       antrianTotal: antrianTotal
                                    })
                                    admin.database().ref(`hecAntrian/indexes/${tanggalperiksa}/detail/${latestOnlineQueue}`).update({
                                       antrianNomor: latestOnlineQueue,
                                       antrianUserUid: objUserUid,
                                       antrianUserNama: nomorkartu,
                                       antrianUserNoBpjs: nomorkartu,
                                       antrianTanggalBooking2: tanggalperiksa,
                                    })
                                    admin.database().ref(`users/${objUserUid}`).update({
                                       userTanggalBooking2: tanggalperiksa,
                                       userNomorAntrian: latestOnlineQueue,
                                       userFlagActivity: 'Booking Antrian',
                                       userStatusPasien: 'BPJS',
                                       userUid: objUserUid,
                                       userName: nomorkartu,
                                       userNoBpjs: nomorkartu,
                                       userRole: 'Pasien',
                                       userAlamat: '',
                                       userHandphone: '',
                                       userTanggalBooking: '',
                                    });
                                    response.nomorantrean = latestOnlineQueue
                                    response.kodebooking = latestOnlineQueue
                                    response.estimasidilayani = parseInt(baseTimeAntrian) + parseInt(latestOnlineQueue, 10) * 15 * 60000
                                    response.jenisantrean = 1
                                    response.namapoli = 'Poli 1'
                                    response.namadokter = 'Dokter 1'
                                    return res.status(200).send({ response, metadata })
                                 } else {
                                    // console.log('antrian online - 4')
                                    admin.database().ref('hecAntrian/indexes/' + tanggalperiksa).update({
                                       latestOnlineQueue: 4,
                                       antrianTotal: 1
                                    })
                                    admin.database().ref('hecAntrian/indexes/' + tanggalperiksa + '/detail/4').update({
                                       antrianNomor: 4,
                                       antrianUserUid: objUserUid,
                                       antrianUserNama: nomorkartu,
                                       antrianUserNoBpjs: nomorkartu,
                                       antrianTanggalBooking2: tanggalperiksa,
                                    })
                                    admin.database().ref('users/' + objUserUid).update({
                                       userTanggalBooking2: tanggalperiksa,
                                       userNomorAntrian: 4,
                                       userFlagActivity: 'Booking Antrian',
                                       userStatusPasien: 'BPJS',
                                       userUid: objUserUid,
                                       userName: nomorkartu,
                                       userNoBpjs: nomorkartu,
                                       userRole: 'Pasien',
                                       userAlamat: '',
                                       userHandphone: '',
                                       userTanggalBooking: '',
                                       // userSex: pasienSex,
                                       // userTanggalLahir: dayjs(pasienTanggalLahir).format('YYYY-MM-DD'),
                                    });
                                    response.nomorantrean = 4
                                    response.kodebooking = 4
                                    response.estimasidilayani = parseInt(baseTimeAntrian) + parseInt(4, 10) * 15 * 60000
                                    response.jenisantrean = 1
                                    response.namapoli = 'Poli 1'
                                    response.namadokter = 'Dokter 1'
                                    return res.status(200).send({ response, metadata })
                                 }
                              })
                           })
                     }
                  })
            } else {
               return res.status(500).send('unregistered login');
            }
         } catch (err) {
            console.log(err)
         }
      });
   }
   catch (error) {
      return res.status(500).send(error);
   }
});

app.post('/api/get-rekap-antrian', (req, res) => {
   try {
      var xtoken = req.headers['x-token'];
      var tanggalperiksa = req.body.tanggalperiksa;
      var kodepoli = req.body.kodepoli;
      var polieksekutif = req.body.polieksekutif;
      var response = {};
      response.namapoli = 'Poli Mata';

      jwt.verify(xtoken, 'secret', function (err, decoded) {
         if (err) { return res.status(500).send(err); }
         try {
            username = decoded.username;
            password = decoded.password;
            var metadata = { message: 'OK', code: 200 }
            if (username === '"hecbpjs"' && password === '"superpassword"') {
               if (kodepoli === '001' && polieksekutif === '0') {
                  admin.database().ref(`hecAntrian/indexes/${tanggalperiksa}`).once('value')
                     .then((result) => {
                        if (result.exists()) {
                           var aa = result.val().latestOnlineQueue ? result.val().latestOnlineQueue : 0;
                           var bb = result.val().latestOfflineQueue ? result.val().latestOfflineQueue : 0;
                           var cc = result.val().antrianTotal ? result.val().antrianTotal : 0;
                           console.log(cc)
                           response.totalantrean = aa > bb ? aa : bb;
                           response.jumlahterlayani = result.val().antrianTerlayani ? result.val().antrianTerlayani : 0;
                           response.lastupdate = new Date().getTime();
                           return res.status(200).send({ response, metadata })
                        } else {
                           return res.status(500).send('no data');
                        }
                     })
               } else {
                  return res.status(500).send('unregistered data');
               }
            } else {
               return res.status(500).send('unregistered login');
            }
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

// app.post('/api/create', (req, res) => {
//    (async () => {
//       try {
//          const paramHeader1 = req.headers.x - token;
//          console.log(paramHeader1);
//          const paramBody1 = req.body.nomorkartu;
//          await db.ref('/usersgo').push({ item: paramBody1 });
//          return res.status(200).send();
//       } catch (error) {
//          console.log(error);
//          return res.status(500).send(error);
//       }
//    })();
// });

exports.app = functions.https.onRequest(app);
