const crypto = require('crypto');
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const dayjs = require('dayjs');
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

// <?php 
//    $data = "8004";
//    $secretKey = "1iH08C361F";
//          // Computes the timestamp
//           date_default_timezone_set('UTC');
//           $tStamp = strval(time()-strtotime('1970-01-01 00:00:00'));
//            // Computes the signature by hashing the salt with the secret key as the key
//    $signature = hash_hmac('sha256', $data."&".$tStamp, $secretKey, true);

//    // base64 encode…
//    $encodedSignature = base64_encode($signature);

//    // urlencode…
//    // $encodedSignature = urlencode($encodedSignature);

//    echo "X-cons-id: " .$data ." ";
//    echo "X-timestamp:" .$tStamp ." ";
//    echo "X-signature: " .$encodedSignature;
// ?>

app.get('/api/vclaim', (req, res) => {
   let data = 8004;
   let secretKey = '1iH08C361F';
   let timeStamp = Math.floor(new Date().getTime()/1000)
   var hash = crypto.createHmac('SHA256', secretKey).update(data + '&' + timeStamp).digest('base64');
   // return res.status(200).send({ 'X-cons-id': data, 'X-timestamp': timeStamp, 'X-signature': hash })
   return res.status(200).send({ 'd1': timeStamp, 'd2': hash })
})

// token : eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImhlY2JwanMiLCJwYXNzd29yZCI6InN1cGVycGFzc3dvcmQiLCJpYXQiOjE1ODE3MjA1MjB9.buwD9uBjATjGKSnAHtBc34oORIyFvkhspKMvCQoB8W0
app.post('/api/token', (req, res) => {
   try {
      var username = req.body.username;
      var password = req.body.password;
      // console.log(req.headers.username, password)
      if (username !== 'hecbpjs' || password !== 'superpassword' || !username || !password) {
         // return res.status(500).send('login not valid') 
         return res.status(500).send({ response: { message: 'Login not valid.', code: 401 } });
      }

      jwt.sign({ username, password }, 'secret', function (err, token) {
         try {
            var response = { token: token };
            var metadata = { message: 'OK', code: 200 }
            return res.status(200).send({ response, metadata });
            // console.log('token', token);
         } catch (err) {
            return res.status(500).send({ response: { message: err, code: 400 } });
            // console.log(err);
         }
      });
   }
   catch (error) {
      return res.status(500).send({ response: { message: err, code: 400 } });
   }
});


// start api get-antrian
app.post('/api/get-antrian', (req, res) => {
   try {
      var xtoken = req.headers['x-token'];
      var nomorkartu = req.body.nomorkartu;
      if (!nomorkartu || nomorkartu.length !== 13) {
         // return res.status(500).send('nomorkartu not valid') 
         return res.status(500).send({ response: { message: 'nomorkartu tidak valid.', code: 402 } });
      }
      var nik = req.body.nik;
      if (!nik || nik.length !== 16) {
         // return res.status(500).send('nik not valid') 
         return res.status(500).send({ response: { message: 'nik not valid.', code: 403 } });
      }
      var tanggalperiksa = req.body.tanggalperiksa;
      if (!validate(tanggalperiksa, 'YYYY-MM-DD')) {
         // return res.status(500).send('format tanggalperiksa not valid') 
         return res.status(500).send({ response: { message: 'Format tanggalperiksa not valid.', code: 404 } });
      }
      // console.log(dayjs())
      if (dayjs(tanggalperiksa).isBefore(dayjs()) === true) {
         // return res.status(500).send('tanggalperiksa harus H+1') 
         return res.status(500).send({ response: { message: 'tanggalperiksa harus H+1.', code: 405 } });
      }
      if (dayjs(tanggalperiksa).day() === 0) {
         // return res.status(500).send('tanggalperiksa tidak boleh minggu')
         return res.status(500).send({ response: { message: 'tanggalperiksa tidak boleh hari minggu.', code: 406 } });
      }
      if (dayjs(tanggalperiksa).diff(dayjs(), 'day') >= 90) {
         // return res.status(500).send('tanggalperiksa <90 hari tanggalkunjungan') 
         return res.status(500).send({ response: { message: 'tanggalperiksa harus sebelum 90 hari tanggal kunjungan.', code: 407 } });
      }
      var kodepoli = req.body.kodepoli;
      if (kodepoli !== 'MAT') {
         // return res.status(500).send('kodepoli not valid') 
         return res.status(500).send({ response: { message: 'kodepoli not valide', code: 408 } });
      }
      var nomorreferensi = req.body.nomorreferensi;
      if (!nomorreferensi) {
         // return res.status(500).send('nomorreferensi not valid') 
         return res.status(500).send({ response: { message: 'nomorreferensi not valid', code: 409 } });
      }
      var jenisreferensi = req.body.jenisreferensi;
      // console.log(jenisreferensi)
      if (jenisreferensi > 2 || jenisreferensi < 1) {
         // return res.status(500).send('jenisreferensi not valid') 
         return res.status(500).send({ response: { message: 'jenisreferensi not valid', code: 410 } });
      }
      var jenisrequest = req.body.jenisrequest;
      if (jenisrequest > 2 || jenisrequest < 1) {
         // return res.status(500).send('jenisrequest not valid') 
         return res.status(500).send({ response: { message: 'jenisrequest not valid', code: 411 } });
      }
      var polieksekutif = req.body.polieksekutif;
      if (polieksekutif !== 0) {
         // return res.status(500).send('polieksekutif not valid') 
         return res.status(500).send({ response: { message: 'polieksekutif not valid', code: 412 } });
      }

      var response = {};
      // var userTanggalBooking2 = 9999
      var objUserUid = 9999
      var baseTimeAntrian = new Date(tanggalperiksa)
      if (baseTimeAntrian.getDay !== 5) {
         baseTimeAntrian = new Date(`${tanggalperiksa} 09:00:00`).getTime()
      } else {
         baseTimeAntrian = new Date(`${tanggalperiksa} 13:00:00`).getTime()
      }

      jwt.verify(xtoken, 'secret', function (err, decoded) {
         // console.log(decoded.username, decoded.password) // bar
         if (err) {
            // return res.status(500).send(err); 
            return res.status(500).send({ response: { message: err, code: 400 } });
         }
         try {
            username = decoded.username;
            password = decoded.password;
            if (username === 'hecbpjs' && password === 'superpassword') {
               // cek nomor kartu bpjs di system
               admin.database().ref('usersDev').orderByChild('userNoBpjs').equalTo(nomorkartu).once('value')
                  .then((snapshot) => {
                     if (snapshot.exists()) {
                        // console.log('/////// user ada di db')
                        // var metadata = { message: 'OK', code: 200 }
                        admin.database().ref('userBpjsDev').orderByChild('userBpjsNomorReferensi').equalTo(nomorreferensi).once('value')
                           .then((snapshot1) => {
                              // start nomorreferensi
                              // var metadata = { message: 'OK', code: 200 }
                              if (snapshot1.exists()) {
                                 // console.log('/////// user nomorreferensi ada di db')
                                 // console.log(snapshot1.val())
                                 Object.keys(snapshot.val()).map((key) => {
                                    objUserUid = snapshot.val()[key].userUid
                                 })
                                 Object.keys(snapshot1.val()).map((key) => {
                                    userTanggalBooking9 = snapshot1.val()[key].userBpjsTanggalBooking9
                                 })
                                 if (userTanggalBooking9 !== '') {
                                    // console.log('/////// user ada di db dan ambil nomor antrian')
                                    // console.log(snapshot1.val())
                                    // var metadata = { message: 'OK', code: 200 }
                                    Object.keys(snapshot1.val()).map((key) => {
                                       var metadata = { message: 'Anda sudah terdaftar', code: 204 }
                                       // response.nomorantrean = snapshot1.val()[key].userBpjsNomorAntrean
                                       // response.kodebooking = snapshot1.val()[key].userBpjsNomorAntrean
                                       // response.estimasidilayani = parseInt(baseTimeAntrian) + parseInt(snapshot1.val()[key].userBpjsNomorAntrean, 10) * 15 * 60000
                                       // response.jenisantrean = jenisrequest
                                       // response.namapoli = 'MATA'
                                       // response.namadokter = 'Dokter 1'
                                       return res.status(200).send({
                                          // response, 
                                          metadata
                                       })
                                    })
                                 } else {
                                    // console.log('/////// user ada di db dan belum ada tanggal antrian')
                                    var ref1 = admin.database().ref('hecAntrianDev/indexes/' + tanggalperiksa).once('value');
                                    ref1.then((result1) => {
                                       if (result1.exists()) {
                                          // console.log('/////// user ada di db sudah belum antrian')
                                          // console.log('antrian online - next')
                                          var latestOnlineQueue = result1.val().latestOnlineQueue + 1
                                          var antrianTotal = result1.val().antrianTotal + 1
                                          const ruleAntrian = [4, 5, 9, 10, 14, 15, 19, 20, 24, 25, 29, 30, 34, 35, 39, 40]
                                          if (ruleAntrian.includes(latestOnlineQueue)) {
                                             latestOnlineQueue = latestOnlineQueue + 0
                                          } else {
                                             latestOnlineQueue = latestOnlineQueue + 3
                                          }
                                          admin.database().ref(`hecAntrianDev/indexes/${tanggalperiksa}`).update({
                                             latestOnlineQueue: latestOnlineQueue,
                                             antrianTotal: antrianTotal
                                          })
                                          admin.database().ref(`hecAntrianDev/indexes/${tanggalperiksa}/detail/${latestOnlineQueue}`).update({
                                             antrianNomor: latestOnlineQueue,
                                             antrianUserUid: objUserUid,
                                             antrianUserNama: nomorkartu,
                                             antrianUserNoBpjs: nomorkartu,
                                             antrianUserBpjsNomorReferensi: nomorreferensi,
                                             antrianTanggalBooking2: tanggalperiksa,
                                          })
                                          admin.database().ref(`userBpjsDev`).push({
                                             userBpjsUid: objUserUid,
                                             userBpjsNomorReferensi: nomorreferensi,
                                             userBpjsTanggalBooking9: tanggalperiksa,
                                             userBpjsNomorAntrean: latestOnlineQueue
                                          })
                                          admin.database().ref(`usersDev/${objUserUid}`).update({
                                             userTanggalBooking2: tanggalperiksa,
                                             userNomorAntrian: latestOnlineQueue,
                                             userFlagActivity: 'Booking Antrian',
                                          });
                                          var metadata = { message: 'OK', code: 200 }
                                          response.nomorantrean = latestOnlineQueue
                                          response.kodebooking = latestOnlineQueue
                                          response.estimasidilayani = parseInt(baseTimeAntrian) + parseInt(latestOnlineQueue, 10) * 15 * 60000
                                          response.jenisantrean = jenisrequest
                                          response.namapoli = 'MATA'
                                          response.namadokter = 'Dokter 1'
                                          return res.status(200).send({ response, metadata })
                                       } else {
                                          // console.log('antrian online - 4')
                                          // console.log('/////// user ada di db tp belum antrian')
                                          admin.database().ref('hecAntrianDev/indexes/' + tanggalperiksa).update({
                                             latestOnlineQueue: 4,
                                             antrianTotal: 1
                                          })
                                          admin.database().ref('hecAntrianDev/indexes/' + tanggalperiksa + '/detail/4').update({
                                             antrianNomor: 4,
                                             antrianUserUid: objUserUid,
                                             antrianUserNama: nomorkartu,
                                             antrianUserNoBpjs: nomorkartu,
                                             antrianUserBpjsNomorReferensi: nomorreferensi,
                                             antrianTanggalBooking2: tanggalperiksa,
                                          })
                                          admin.database().ref(`userBpjsDev`).push({
                                             userBpjsUid: objUserUid,
                                             userBpjsNomorReferensi: nomorreferensi,
                                             userBpjsTanggalBooking9: tanggalperiksa,
                                             userBpjsNomorAntrean: 4
                                          })
                                          admin.database().ref('usersDev/' + objUserUid).update({
                                             userTanggalBooking2: tanggalperiksa,
                                             userNomorAntrian: 4,
                                             userFlagActivity: 'Booking Antrian',
                                             userStatusPasien: 'BPJS',
                                          });
                                          var metadata = { message: 'OK', code: 200 }
                                          response.nomorantrean = 4
                                          response.kodebooking = 4
                                          response.estimasidilayani = parseInt(baseTimeAntrian) + parseInt(4, 10) * 15 * 60000
                                          response.jenisantrean = jenisrequest
                                          response.namapoli = 'MATA'
                                          response.namadokter = 'Dokter 1'
                                          return res.status(200).send({ response, metadata })
                                       }
                                    })
                                 }
                              } else {
                                 // userBpjsNomorReferensi tidak sesuai dengan nomorreferensi
                                 // console.log('/////// nomorreferensi belum ada di db')
                                 // var metadata = { message: 'OK', code: 200 }
                                 Object.keys(snapshot.val()).map((key) => {
                                    objUserUid = snapshot.val()[key].userUid
                                 })

                                 var ref1 = admin.database().ref('hecAntrianDev/indexes/' + tanggalperiksa).once('value');
                                 ref1.then((result1) => {
                                    // console.log('user ada di db tp belum antrian 2')
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
                                       admin.database().ref(`hecAntrianDev/indexes/${tanggalperiksa}`).update({
                                          latestOnlineQueue: latestOnlineQueue,
                                          antrianTotal: antrianTotal
                                       })
                                       admin.database().ref(`hecAntrianDev/indexes/${tanggalperiksa}/detail/${latestOnlineQueue}`).update({
                                          antrianNomor: latestOnlineQueue,
                                          antrianUserUid: objUserUid,
                                          antrianUserNama: nomorkartu,
                                          antrianUserNoBpjs: nomorkartu,
                                          antrianUserBpjsNomorReferensi: nomorreferensi,
                                          antrianTanggalBooking9: tanggalperiksa,
                                       })
                                       admin.database().ref(`userBpjsDev`).push({
                                          userBpjsUid: objUserUid,
                                          userBpjsNomorReferensi: nomorreferensi,
                                          userBpjsTanggalBooking9: tanggalperiksa,
                                          userBpjsNomorAntrean: latestOnlineQueue
                                       })
                                       admin.database().ref(`usersDev/${objUserUid}`).update({
                                          userTanggalBooking9: tanggalperiksa,
                                          userNomorAntrian: latestOnlineQueue,
                                          userFlagActivity: 'Booking Antrian',
                                       });
                                       var metadata = { message: 'OK', code: 200 }
                                       response.nomorantrean = latestOnlineQueue
                                       response.kodebooking = latestOnlineQueue
                                       response.estimasidilayani = parseInt(baseTimeAntrian) + parseInt(latestOnlineQueue, 10) * 15 * 60000
                                       response.jenisantrean = 1
                                       response.namapoli = 'MATA'
                                       response.namadokter = 'Dokter 1'
                                       return res.status(200).send({ response, metadata })
                                    } else {
                                       // console.log('antrian online - 4')
                                       admin.database().ref('hecAntrianDev/indexes/' + tanggalperiksa).update({
                                          latestOnlineQueue: 4,
                                          antrianTotal: 1
                                       })
                                       admin.database().ref('hecAntrianDev/indexes/' + tanggalperiksa + '/detail/4').update({
                                          antrianNomor: 4,
                                          antrianUserUid: objUserUid,
                                          antrianUserNama: nomorkartu,
                                          antrianUserNoBpjs: nomorkartu,
                                          antrianUserBpjsNomorReferensi: nomorreferensi,
                                          antrianTanggalBooking9: tanggalperiksa,
                                       })
                                       admin.database().ref(`userBpjsDev`).push({
                                          userBpjsUid: objUserUid,
                                          userBpjsNomorReferensi: nomorreferensi,
                                          userBpjsTanggalBooking9: tanggalperiksa,
                                          userBpjsNomorAntrean: 4
                                       })
                                       admin.database().ref('usersDev/' + objUserUid).update({
                                          userTanggalBooking9: tanggalperiksa,
                                          userNomorAntrian: 4,
                                          userFlagActivity: 'Booking Antrian',
                                          userStatusPasien: 'BPJS',
                                       });
                                       var metadata = { message: 'OK', code: 200 }
                                       response.nomorantrean = 4
                                       response.kodebooking = 4
                                       response.estimasidilayani = parseInt(baseTimeAntrian) + parseInt(4, 10) * 15 * 60000
                                       response.jenisantrean = jenisrequest
                                       response.namapoli = 'MATA'
                                       response.namadokter = 'Dokter 1'
                                       return res.status(200).send({ response, metadata })
                                    }
                                 })

                              }
                              // end nomorreferensi
                           })

                     } else {
                        // console.log('user ny registered on db')
                        // user baru
                        admin.auth().createUser({
                           email: nomorkartu + '@hec.com',
                           emailVerified: false,
                           // phoneNumber: '+11234567890',
                           password: 'password',
                           displayName: nomorkartu,
                           disabled: false
                        })
                           .then((userRecord) => {
                              // console.log('user cek')
                              objUserUid = userRecord.uid;
                              var ref1 = admin.database().ref('hecAntrianDev/indexes/' + tanggalperiksa).once('value');
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
                                    admin.database().ref(`hecAntrianDev/indexes/${tanggalperiksa}`).update({
                                       latestOnlineQueue: latestOnlineQueue,
                                       antrianTotal: antrianTotal
                                    })
                                    admin.database().ref(`userBpjsDev`).push({
                                       userBpjsUid: objUserUid,
                                       userBpjsNomorReferensi: nomorreferensi,
                                       userBpjsTanggalBooking9: tanggalperiksa,
                                       userBpjsNomorAntrean: latestOnlineQueue
                                    })
                                    admin.database().ref(`hecAntrianDev/indexes/${tanggalperiksa}/detail/${latestOnlineQueue}`).update({
                                       antrianNomor: latestOnlineQueue,
                                       antrianUserUid: objUserUid,
                                       antrianUserNama: nomorkartu,
                                       antrianUserNoBpjs: nomorkartu,
                                       antrianTanggalBooking9: tanggalperiksa,
                                    })
                                    admin.database().ref(`usersDev/${objUserUid}`).update({
                                       userTanggalBooking9: tanggalperiksa,
                                       userTanggalBooking2: '',
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
                                    var metadata = { message: 'OK', code: 200 }
                                    response.nomorantrean = latestOnlineQueue
                                    response.kodebooking = latestOnlineQueue
                                    response.estimasidilayani = parseInt(baseTimeAntrian) + parseInt(latestOnlineQueue, 10) * 15 * 60000
                                    response.jenisantrean = jenisrequest
                                    response.namapoli = 'MATA'
                                    response.namadokter = 'Dokter 1'
                                    return res.status(200).send({ response, metadata })
                                 } else {
                                    // console.log('antrian online - 4')
                                    admin.database().ref('hecAntrianDev/indexes/' + tanggalperiksa).update({
                                       latestOnlineQueue: 4,
                                       antrianTotal: 1
                                    })
                                    admin.database().ref('hecAntrianDev/indexes/' + tanggalperiksa + '/detail/4').update({
                                       antrianNomor: 4,
                                       antrianUserUid: objUserUid,
                                       antrianUserNama: nomorkartu,
                                       antrianUserNoBpjs: nomorkartu,
                                       antrianTanggalBooking2: tanggalperiksa,
                                    })
                                    admin.database().ref(`userBpjsDev`).push({
                                       userBpjsUid: objUserUid,
                                       userBpjsNomorReferensi: nomorreferensi,
                                       userBpjsTanggalBooking9: tanggalperiksa,
                                       userBpjsNomorAntrean: 4
                                    })
                                    admin.database().ref('usersDev/' + objUserUid).update({
                                       userTanggalBooking9: tanggalperiksa,
                                       userBpjsTanggalBooking2: '',
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
                                    var metadata = { message: 'OK', code: 200 }
                                    response.nomorantrean = 4
                                    response.kodebooking = 4
                                    response.estimasidilayani = parseInt(baseTimeAntrian) + parseInt(4, 10) * 15 * 60000
                                    response.jenisantrean = jenisrequest
                                    response.namapoli = 'MATA'
                                    response.namadokter = 'Dokter 1'
                                    return res.status(200).send({ response, metadata })
                                 }
                              })
                           })
                     }
                  })
            } else {
               // return res.status(500).send('unregistered login');
               return res.status(500).send({ response: { message: 'Login not valid.', code: 401 } });
            }
         } catch (err) {
            return res.status(500).send({ response: { message: err, code: 400 } });
         }
      });
   }
   catch (error) {
      return res.status(500).send({ response: { message: err, code: 400 } });
   }
});

function validate(date, format) {
   return dayjs(date, format).format(format) === date;
}

app.post('/api/get-rekap-antrian', (req, res) => {
   try {
      var xtoken = req.headers['x-token'];
      var tanggalperiksa = req.body.tanggalperiksa;
      if (!validate(tanggalperiksa, 'YYYY-MM-DD')) {
         // return res.status(500).send('tanggalperiksa not valid') 
         return res.status(500).send({ response: { message: 'Format tanggalperiksa not valid.', code: 404 } });
      }
      var kodepoli = req.body.kodepoli;
      if (kodepoli !== 'MAT') {
         // return res.status(500).send('kodepoli not valid') 
         return res.status(500).send({ response: { message: 'kodepoli not valide', code: 408 } });
      }
      var polieksekutif = req.body.polieksekutif;
      if (polieksekutif !== 0) {
         // return res.status(500).send('polieksekutif not valid') 
         return res.status(500).send({ response: { message: 'polieksekutif not valid', code: 412 } });
      }
      var response = {};
      response.namapoli = 'Poli Mata';

      jwt.verify(xtoken, 'secret', function (err, decoded) {
         if (err) {
            // return res.status(500).send(err); 
            return res.status(500).send({ response: { message: err, code: 400 } });
         }
         try {
            username = decoded.username;
            password = decoded.password;
            var metadata = { message: 'OK', code: 200 }
            if (username === 'hecbpjs' && password === 'superpassword') {
               if (kodepoli === 'MAT' && polieksekutif === 0) {
                  admin.database().ref(`hecAntrianDev/indexes/${tanggalperiksa}`).once('value')
                     .then((result) => {
                        if (result.exists()) {
                           // var aa = result.val().latestOnlineQueue ? result.val().latestOnlineQueue : 0;
                           // var bb = result.val().latestOfflineQueue ? result.val().latestOfflineQueue : 0;
                           var cc = result.val().antrianTotal ? result.val().antrianTotal : 0;
                           // console.log(cc)
                           response.totalantrean = cc
                           response.jumlahterlayani = result.val().antrianTerlayani ? result.val().antrianTerlayani : 0;
                           response.lastupdate = new Date().getTime();
                           return res.status(200).send({ response, metadata })
                        } else {
                           // return res.status(500).send('no data');
                           return res.status(500).send({ response: { message: 'Data tidak ditemukan.', code: 413 } });
                        }
                     })
               }
            } else {
               // return res.status(500).send('unregistered login');
               return res.status(500).send({ response: { message: 'Login not valid.', code: 401 } });
            }
         } catch (err) {
            // return res.status(500).send(err);
            return res.status(500).send({ response: { message: err, code: 400 } });
            // console.log(err);
         }
      });
   }
   catch (error) {
      // return res.status(500).send(error);
      return res.status(500).send({ response: { message: error, code: 400 } });
   }
});

///// ***** start - api get list kode booking operasi ***** /////
app.post('/api/get-list-kode-booking-operasi', (req, res) => {
   try {
      var xtoken = req.headers['x-token'];
      var nopeserta = req.body.nopeserta;
      if (!nopeserta || nopeserta.length !== 13) {
         // return res.status(500).send('nopeserta not valid') 
         return res.status(500).send({ response: { message: 'nomorkartu tidak valid.', code: 402 } });
      }
      var response = {};

      jwt.verify(xtoken, 'secret', function (err, decoded) {
         if (err) {
            // return res.status(500).send(err); 
            return res.status(500).send({ response: { message: err, code: 400 } });
         }
         try {
            username = decoded.username;
            password = decoded.password;
            if (username === 'hecbpjs' && password === 'superpassword') {
               // console.log(username, password)
               admin.database().ref('users').orderByChild('userNoBpjs').equalTo(nopeserta).once('value')
                  .then((snapshot) => {
                     if (snapshot.exists()) {
                        // console.log('////////// user ada di db')
                        admin.database().ref('hecKamarOperasiDev').orderByChild('hecKoUserNoBpjs').equalTo(nopeserta).once('value')
                           .then((snapshot1) => {
                              if (snapshot1.exists()) {
                                 // console.log('////////// jadwal operasi ada', nopeserta)
                                 // if (snapshot1.val().hecKoTerlaksana === 0) {
                                 var metadata = { message: 'OK', code: 200 }
                                 // console.log(snapshot1.val())
                                 var list1 = []
                                 snapshot1.forEach((el) => {
                                    if (el.val().hecKoTerlaksana === 0) {
                                       list1.push({
                                          kodebooking: el.val().hecKoKodeBooking,
                                          tanggaloperasi: el.val().hecKoTanggalOperasi,
                                          jenistindakan: el.val().hecKoJenisTindakan,
                                          kodepoli: el.val().hecKoKodePoli,
                                          namapoli: el.val().hecKoNamaPoli,
                                          terlaksana: el.val().hecKoTerlaksana
                                       })
                                    }
                                    response.list = list1
                                 })
                                 res.status(200).send({ response, metadata });

                              } else {
                                 // console.log('////////// jadwal operasi belum ada')
                                 var metadata = { message: 'OK', code: 200 }
                                 var list1 = []
                                 response.list = list1
                                 return res.status(200).send({ response, metadata });
                              }
                           })
                     } else {
                        // console.log('('////////// user ny registered on db')
                        // admin.database().ref('hecKamarOperasi').once('value')
                        // .then((snapshot1) => {
                        //    if (snapshot1.exists()) {
                        //       // console.log('////////// jadwal operasi ada')
                        //    } else {
                        //       // console.log('////////// jadwal operasi belum ada')
                        //       var metadata = { message: 'OK', code: 200 }
                        //       response.list = ''
                        //       return res.status(200).send({response, metadata});
                        //    }
                        // })
                        // return res.status(500).send('data tidak di temukan');
                        return res.status(500).send({ response: { message: 'Data tidak ditemukan', code: 413 } });
                     }
                  })
            } else {
               // return res.status(500).send('unregistered login');
               return res.status(500).send({ response: { message: 'Login not valid.', code: 401 } });
            }
         } catch (err) {
            // console.log(err)
            return res.status(500).send({ response: { message: err, code: 400 } });
         }
      });
   }
   catch (error) {
      // return res.status(500).send(error);
      return res.status(500).send({ response: { message: error, code: 400 } });
   }
});
///// ***** end - api get list kode booking operasi ***** /////

///// ***** start - api get list jadwal operasi ***** /////
app.post('/api/get-list-jadwal-operasi', (req, res) => {
   try {
      var xtoken = req.headers['x-token'];
      var tanggalawal = req.body.tanggalawal;
      if (!validate(tanggalawal, 'YYYY-MM-DD')) {
         // return res.status(500).send('format tanggalawal not valid') 
         return res.status(500).send({ response: { message: 'Format tannggalawal not valid.', code: 414 } });
      }
      // if (dayjs(tanggalawal).isBefore(dayjs()) === true) { return res.status(500).send('tanggalawal harus H+1') }
      var tanggalakhir = req.body.tanggalakhir;
      if (!validate(tanggalakhir, 'YYYY-MM-DD')) {
         // return res.status(500).send('format tanggalakhir not valid') 
         return res.status(500).send({ response: { message: 'Format tanggalakhir not valid.', code: 415 } });
      }
      if (dayjs(tanggalakhir).isBefore(dayjs(tanggalawal)) === true) {
         // return res.status(500).send('tanggalakhir harus lebih besar dari tanggalawal') 
         return res.status(500).send({ response: { message: 'tanggalakhir harus lebih besar tanggalawal.', code: 416 } });
      }
      var response = {};
      // var nopeserta = req.body.nopeserta;
      // if (!nopeserta || nopeserta.length !== 13) { return res.status(500).send('nopeserta not valid') }

      jwt.verify(xtoken, 'secret', function (err, decoded) {
         if (err) {
            // return res.status(500).send(err); 
            return res.status(500).send({ response: { message: err, code: 400 } });
         }
         try {
            username = decoded.username;
            password = decoded.password;
            if (username === 'hecbpjs' && password === 'superpassword') {
               // admin.database().ref('users').orderByChild('userNoBpjs').equalTo(nopeserta).once('value')
               //    .then((snapshot) => {
               //       if (snapshot.exists()) {
               // console.log('////////// user ada di db')
               admin.database().ref('hecKamarOperasiDev').orderByChild('hecKoTanggalOperasi').startAt(tanggalawal).endAt(tanggalakhir).once('value')
                  .then((snapshot1) => {
                     if (snapshot1.exists()) {
                        // admin.database().ref('hecKamarOperasi').once('value')
                        //    .then((snapshot1) => {
                        //       if (snapshot1.exists()) {
                        //          // console.log('////////// jadwal operasi ada')
                        var metadata = { message: 'OK', code: 200 }
                        // console.log(snapshot1.val())
                        var list1 = []
                        snapshot1.forEach((el) => {
                           list1.push({
                              kodebooking: el.val().hecKoKodeBooking,
                              tanggaloperasi: el.val().hecKoTanggalOperasi,
                              jenistindakan: el.val().hecKoJenisTindakan,
                              kodepoli: el.val().hecKoKodePoli,
                              namapoli: el.val().hecKoNamaPoli,
                              terlaksana: el.val().hecKoTerlaksana,
                              nopeserta: el.val().hecKoUserNoBpjs,
                              lastupdate: new Date().getTime()
                           })
                           response.list = list1
                        })
                        res.status(200).send({ response, metadata });
                        //    } else {
                        //       // console.log('////////// jadwal operasi belum ada')
                        //       var metadata = { message: 'OK', code: 200 }
                        //       response.list = ''
                        //       return res.status(200).send({ response, metadata });
                        //    }
                        // })
                     } else {
                        // console.log('////////// jadwal operasi belum ada')
                        var metadata = { message: 'OK', code: 200 }
                        var list1 = []
                        response.list = list1
                        return res.status(200).send({ response, metadata });
                     }
                  })

               // } else {
               //    // console.log('('////////// user ny registered on db')
               //    //    admin.database().ref('hecKamarOperasi').once('value')
               //    //    .then((snapshot1) => {
               //    //       if (snapshot1.exists()) {
               //    //          // console.log('////////// jadwal operasi ada')
               //    //       } else {
               //    //          // console.log('////////// jadwal operasi belum ada')
               //    //          return res.status(500).send({ message: 'Jadwal operasi belum ada', code: 204 });
               //    //       }
               //    //    })
               //    return res.status(500).send('unregistered login');
               // }
               // })
            } else {
               return res.status(500).send({ response: { message: 'Login not valid.', code: 401 } });
            }
         } catch (err) {
            return res.status(500).send({ response: { message: err, code: 400 } });
         }
      });
   }
   catch (error) {
      return res.status(500).send({ response: { message: error, code: 400 } });
   }
});
///// ***** end - api get list jadwal operasi ***** /////


///// ***** start - api add dummy jadwal operasi ***** /////
app.post('/api/add-dummy-jadwal-operasi', (req, res) => {
   try {
      admin.database().ref('hecKamarOperasiDev').push({
         hecKoKodeBooking: 'MAT100002',
         hecKoTanggalOperasi: '2020-03-22',
         hecKoJenisTindakan: 'operasi mata',
         hecKoKodePoli: 'MAT',
         hecKoNamaPoli: 'MATA',
         hecKoTerlaksana: 1,
         hecKoUserUid: 'K23DFp9kNYgU2wbqvVvzxqHPsry1',
         hecKoUserNoBpjs: '0002054566157'
      })
      return res.status(200).send({ response: { message: 'OK', code: 200 } });
   }
   catch (error) {
      // return res.status(500).send(error);
      return res.status(500).send({ response: { message: error, code: 400 } });
   }
});
///// ***** end - api add dummy jadwal operasi ***** /////


///// ################################################################# start production ################################################################# /////

///// ***** start - get token ***** /////
app.post('/api/prod/token', (req, res) => {
   try {
      var username = req.body.username;
      var password = req.body.password;
      if (username !== 'hecbpjs-keren' || password !== 'superpassword-keren' || !username || !password) {
         // return res.status(500).send('login not valid') 
         return res.status(500).send({ response: { message: 'Login not valid.', code: 401 } });
      }

      jwt.sign({ username, password }, 'secret', function (err, token) {
         try {
            var response = { token: token };
            var metadata = { message: 'OK', code: 200 }
            return res.status(200).send({ response, metadata });
         } catch (err) {
            // return res.status(500).send(err);
            return res.status(500).send({ response: { message: err, code: 400 } });
         }
      });
   }
   catch (error) {
      // return res.status(500).send(error);
      return res.status(500).send({ response: { message: err, code: 400 } });
   }
});
///// ***** end - get token ***** /////

// token prod : eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImhlY2JwanMta2VyZW4iLCJwYXNzd29yZCI6InN1cGVycGFzc3dvcmQta2VyZW4iLCJpYXQiOjE1ODMyODIyNTN9.4UEVCiRql7LnX19jQjrITJjPavGwSbDf3KcxjAqvJII


///// ***** start - get antrian ***** /////
app.post('/api/prod/get-antrian', (req, res) => {
   try {
      var xtoken = req.headers['x-token'];
      var nomorkartu = req.body.nomorkartu;
      if (!nomorkartu || nomorkartu.length !== 13) {
         // return res.status(500).send('nomorkartu not valid') 
         return res.status(500).send({ response: { message: 'nomorkartu tidak valid.', code: 402 } });
      }
      var nik = req.body.nik;
      if (!nik || nik.length !== 16) {
         // return res.status(500).send('nik not valid') 
         return res.status(500).send({ response: { message: 'nik not valid.', code: 403 } });
      }
      var tanggalperiksa = req.body.tanggalperiksa;
      if (!validate(tanggalperiksa, 'YYYY-MM-DD')) {
         // return res.status(500).send('format tanggalperiksa not valid') 
         return res.status(500).send({ response: { message: 'Format tanggalperiksa not valid.', code: 404 } });
      }
      if (dayjs(tanggalperiksa).isBefore(dayjs()) === true) {
         // return res.status(500).send('tanggalperiksa harus H+1') 
         return res.status(500).send({ response: { message: 'tanggalperiksa harus H+1.', code: 405 } });
      }
      if (dayjs(tanggalperiksa).day() === 0) {
         // return res.status(500).send('tanggalperiksa tidak boleh minggu') 
         return res.status(500).send({ response: { message: 'tanggalperiksa tidak boleh hari minggu.', code: 406 } });
      }
      if (dayjs(tanggalperiksa).diff(dayjs(), 'day') >= 90) {
         // return res.status(500).send('tanggalperiksa <90 hari tanggalkunjungan') 
         return res.status(500).send({ response: { message: 'tanggalperiksa harus sebelum 90 hari tanggal kunjungan.', code: 407 } });
      }
      var kodepoli = req.body.kodepoli;
      if (kodepoli !== 'MAT') {
         // return res.status(500).send('kodepoli not valid') 
         return res.status(500).send({ response: { message: 'kodepoli not valide', code: 408 } });
      }
      var nomorreferensi = req.body.nomorreferensi;
      if (!nomorreferensi) {
         // return res.status(500).send('nomorreferensi not valid') 
         return res.status(500).send({ response: { message: 'nomorreferensi not valid', code: 409 } });
      }
      var jenisreferensi = req.body.jenisreferensi;
      if (jenisreferensi > 2 || jenisreferensi < 1) {
         // return res.status(500).send('jenisreferensi not valid') 
         return res.status(500).send({ response: { message: 'jenisreferensi not valid', code: 410 } });
      }
      var jenisrequest = req.body.jenisrequest;
      if (jenisrequest > 2 || jenisrequest < 1) {
         // return res.status(500).send('jenisrequest not valid') 
         return res.status(500).send({ response: { message: 'jenisrequest not valid', code: 411 } });
      }
      var polieksekutif = req.body.polieksekutif;
      if (polieksekutif !== 0) {
         // return res.status(500).send('polieksekutif not valid') 
         return res.status(500).send({ response: { message: 'polieksekutif not valid', code: 412 } });
      }

      var response = {};
      var objUserUid = 9999
      var baseTimeAntrian = new Date(tanggalperiksa)
      if (baseTimeAntrian.getDay !== 5) {
         baseTimeAntrian = new Date(`${tanggalperiksa} 09:00:00`).getTime()
      } else {
         baseTimeAntrian = new Date(`${tanggalperiksa} 13:00:00`).getTime()
      }

      jwt.verify(xtoken, 'secret', function (err, decoded) {
         if (err) {
            // return res.status(500).send(err); 
            return res.status(500).send({ response: { message: err, code: 400 } });
         }
         try {
            username = decoded.username;
            password = decoded.password;
            if (username === 'hecbpjs-keren' && password === 'superpassword-keren') {
               // cek nomor kartu bpjs di system
               admin.database().ref('users').orderByChild('userNoBpjs').equalTo(nomorkartu).once('value')
                  .then((snapshot) => {
                     if (snapshot.exists()) {
                        // console.log('/////// user ada di db')
                        // var metadata = { message: 'OK', code: 200 }
                        admin.database().ref('userBpjs').orderByChild('userBpjsNomorReferensi').equalTo(nomorreferensi).once('value')
                           .then((snapshot1) => {
                              // start nomorreferensi
                              // var metadata = { message: 'OK', code: 200 }
                              if (snapshot1.exists()) {
                                 // console.log('/////// user nomorreferensi ada di db')
                                 // console.log(snapshot1.val())
                                 Object.keys(snapshot.val()).map((key) => {
                                    objUserUid = snapshot.val()[key].userUid
                                 })
                                 Object.keys(snapshot1.val()).map((key) => {
                                    userTanggalBooking9 = snapshot1.val()[key].userBpjsTanggalBooking9
                                 })
                                 if (userTanggalBooking9 !== '') {
                                    // console.log('/////// user ada di db dan ambil nomor antrian')
                                    // console.log(snapshot1.val())
                                    // var metadata = { message: 'OK', code: 200 }
                                    Object.keys(snapshot1.val()).map((key) => {
                                       var metadata = { message: 'Anda sudah terdaftar', code: 204 }
                                       // response.nomorantrean = snapshot1.val()[key].userBpjsNomorAntrean
                                       // response.kodebooking = snapshot1.val()[key].userBpjsNomorAntrean
                                       // response.estimasidilayani = parseInt(baseTimeAntrian) + parseInt(snapshot1.val()[key].userBpjsNomorAntrean, 10) * 15 * 60000
                                       // response.jenisantrean = jenisrequest
                                       // response.namapoli = 'MATA'
                                       // response.namadokter = 'Dokter 1'
                                       return res.status(200).send({
                                          // response, 
                                          metadata
                                       })
                                    })
                                 } else {
                                    // console.log('/////// user ada di db dan belum ada tanggal antrian')
                                    var ref1 = admin.database().ref('hecAntrian/indexes/' + tanggalperiksa).once('value');
                                    ref1.then((result1) => {
                                       if (result1.exists()) {
                                          // console.log('/////// user ada di db sudah belum antrian')
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
                                             antrianUserBpjsNomorReferensi: nomorreferensi,
                                             antrianTanggalBooking2: tanggalperiksa,
                                          })
                                          admin.database().ref(`userBpjs`).push({
                                             userBpjsUid: objUserUid,
                                             userBpjsNomorReferensi: nomorreferensi,
                                             userBpjsTanggalBooking9: tanggalperiksa,
                                             userBpjsNomorAntrean: latestOnlineQueue
                                          })
                                          admin.database().ref(`users/${objUserUid}`).update({
                                             userTanggalBooking2: tanggalperiksa,
                                             userNomorAntrian: latestOnlineQueue,
                                             userFlagActivity: 'Booking Antrian',
                                          });
                                          var metadata = { message: 'OK', code: 200 }
                                          response.nomorantrean = latestOnlineQueue
                                          response.kodebooking = latestOnlineQueue
                                          response.estimasidilayani = parseInt(baseTimeAntrian) + parseInt(latestOnlineQueue, 10) * 15 * 60000
                                          response.jenisantrean = jenisrequest
                                          response.namapoli = 'MATA'
                                          response.namadokter = 'Dokter 1'
                                          return res.status(200).send({ response, metadata })
                                       } else {
                                          // console.log('antrian online - 4')
                                          // console.log('/////// user ada di db tp belum antrian')
                                          admin.database().ref('hecAntrian/indexes/' + tanggalperiksa).update({
                                             latestOnlineQueue: 4,
                                             antrianTotal: 1
                                          })
                                          admin.database().ref('hecAntrian/indexes/' + tanggalperiksa + '/detail/4').update({
                                             antrianNomor: 4,
                                             antrianUserUid: objUserUid,
                                             antrianUserNama: nomorkartu,
                                             antrianUserNoBpjs: nomorkartu,
                                             antrianUserBpjsNomorReferensi: nomorreferensi,
                                             antrianTanggalBooking2: tanggalperiksa,
                                          })
                                          admin.database().ref(`userBpjs`).push({
                                             userBpjsUid: objUserUid,
                                             userBpjsNomorReferensi: nomorreferensi,
                                             userBpjsTanggalBooking9: tanggalperiksa,
                                             userBpjsNomorAntrean: 4
                                          })
                                          admin.database().ref('users/' + objUserUid).update({
                                             userTanggalBooking2: tanggalperiksa,
                                             userNomorAntrian: 4,
                                             userFlagActivity: 'Booking Antrian',
                                             userStatusPasien: 'BPJS',
                                          });
                                          var metadata = { message: 'OK', code: 200 }
                                          response.nomorantrean = 4
                                          response.kodebooking = 4
                                          response.estimasidilayani = parseInt(baseTimeAntrian) + parseInt(4, 10) * 15 * 60000
                                          response.jenisantrean = jenisrequest
                                          response.namapoli = 'MATA'
                                          response.namadokter = 'Dokter 1'
                                          return res.status(200).send({ response, metadata })
                                       }
                                    })
                                 }
                              } else {
                                 // userBpjsNomorReferensi tidak sesuai dengan nomorreferensi
                                 // console.log('/////// nomorreferensi belum ada di db')
                                 // var metadata = { message: 'OK', code: 200 }
                                 Object.keys(snapshot.val()).map((key) => {
                                    objUserUid = snapshot.val()[key].userUid
                                 })

                                 var ref1 = admin.database().ref('hecAntrian/indexes/' + tanggalperiksa).once('value');
                                 ref1.then((result1) => {
                                    // console.log('user ada di db tp belum antrian 2')
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
                                          antrianUserBpjsNomorReferensi: nomorreferensi,
                                          antrianTanggalBooking9: tanggalperiksa,
                                       })
                                       admin.database().ref(`userBpjs`).push({
                                          userBpjsUid: objUserUid,
                                          userBpjsNomorReferensi: nomorreferensi,
                                          userBpjsTanggalBooking9: tanggalperiksa,
                                          userBpjsNomorAntrean: latestOnlineQueue
                                       })
                                       admin.database().ref(`users/${objUserUid}`).update({
                                          userTanggalBooking9: tanggalperiksa,
                                          userNomorAntrian: latestOnlineQueue,
                                          userFlagActivity: 'Booking Antrian',
                                       });
                                       var metadata = { message: 'OK', code: 200 }
                                       response.nomorantrean = latestOnlineQueue
                                       response.kodebooking = latestOnlineQueue
                                       response.estimasidilayani = parseInt(baseTimeAntrian) + parseInt(latestOnlineQueue, 10) * 15 * 60000
                                       response.jenisantrean = 1
                                       response.namapoli = 'MATA'
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
                                          antrianUserBpjsNomorReferensi: nomorreferensi,
                                          antrianTanggalBooking9: tanggalperiksa,
                                       })
                                       admin.database().ref(`userBpjs`).push({
                                          userBpjsUid: objUserUid,
                                          userBpjsNomorReferensi: nomorreferensi,
                                          userBpjsTanggalBooking9: tanggalperiksa,
                                          userBpjsNomorAntrean: 4
                                       })
                                       admin.database().ref('users/' + objUserUid).update({
                                          userTanggalBooking9: tanggalperiksa,
                                          userNomorAntrian: 4,
                                          userFlagActivity: 'Booking Antrian',
                                          userStatusPasien: 'BPJS',
                                       });
                                       var metadata = { message: 'OK', code: 200 }
                                       response.nomorantrean = 4
                                       response.kodebooking = 4
                                       response.estimasidilayani = parseInt(baseTimeAntrian) + parseInt(4, 10) * 15 * 60000
                                       response.jenisantrean = jenisrequest
                                       response.namapoli = 'MATA'
                                       response.namadokter = 'Dokter 1'
                                       return res.status(200).send({ response, metadata })
                                    }
                                 })

                              }
                              // end nomorreferensi
                           })

                     } else {
                        // console.log('user ny registered on db')
                        // user baru
                        admin.auth().createUser({
                           email: nomorkartu + '@hec.com',
                           emailVerified: false,
                           // phoneNumber: '+11234567890',
                           password: 'password',
                           displayName: nomorkartu,
                           disabled: false
                        })
                           .then((userRecord) => {
                              // console.log('user cek')
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
                                    admin.database().ref(`userBpjs`).push({
                                       userBpjsUid: objUserUid,
                                       userBpjsNomorReferensi: nomorreferensi,
                                       userBpjsTanggalBooking9: tanggalperiksa,
                                       userBpjsNomorAntrean: latestOnlineQueue
                                    })
                                    admin.database().ref(`hecAntrian/indexes/${tanggalperiksa}/detail/${latestOnlineQueue}`).update({
                                       antrianNomor: latestOnlineQueue,
                                       antrianUserUid: objUserUid,
                                       antrianUserNama: nomorkartu,
                                       antrianUserNoBpjs: nomorkartu,
                                       antrianTanggalBooking9: tanggalperiksa,
                                    })
                                    admin.database().ref(`users/${objUserUid}`).update({
                                       userTanggalBooking9: tanggalperiksa,
                                       userTanggalBooking2: '',
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
                                    var metadata = { message: 'OK', code: 200 }
                                    response.nomorantrean = latestOnlineQueue
                                    response.kodebooking = latestOnlineQueue
                                    response.estimasidilayani = parseInt(baseTimeAntrian) + parseInt(latestOnlineQueue, 10) * 15 * 60000
                                    response.jenisantrean = jenisrequest
                                    response.namapoli = 'MATA'
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
                                    admin.database().ref(`userBpjs`).push({
                                       userBpjsUid: objUserUid,
                                       userBpjsNomorReferensi: nomorreferensi,
                                       userBpjsTanggalBooking9: tanggalperiksa,
                                       userBpjsNomorAntrean: 4
                                    })
                                    admin.database().ref('users/' + objUserUid).update({
                                       userTanggalBooking9: tanggalperiksa,
                                       userBpjsTanggalBooking2: '',
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
                                    var metadata = { message: 'OK', code: 200 }
                                    response.nomorantrean = 4
                                    response.kodebooking = 4
                                    response.estimasidilayani = parseInt(baseTimeAntrian) + parseInt(4, 10) * 15 * 60000
                                    response.jenisantrean = jenisrequest
                                    response.namapoli = 'MATA'
                                    response.namadokter = 'Dokter 1'
                                    return res.status(200).send({ response, metadata })
                                 }
                              })
                           })
                     }
                  })
            } else {
               // return res.status(500).send('unregistered login');
               return res.status(500).send({ response: { message: 'Login not valid.', code: 401 } });
            }
         } catch (err) {
            // console.log(err)
            return res.status(500).send({ response: { message: err, code: 400 } });
         }
      });
   }
   catch (error) {
      return res.status(500).send({ response: { message: error, code: 400 } });
   }
});
///// ***** end - get antrian ***** /////



///// ***** start - get rekap antrian ***** /////
app.post('/api/prod/get-rekap-antrian', (req, res) => {
   try {
      var xtoken = req.headers['x-token'];
      var tanggalperiksa = req.body.tanggalperiksa;
      if (!validate(tanggalperiksa, 'YYYY-MM-DD')) {
         // return res.status(500).send('tanggalperiksa not valid') 
         return res.status(500).send({ response: { message: 'Format tanggalperiksa not valid.', code: 404 } });
      }
      var kodepoli = req.body.kodepoli;
      if (kodepoli !== 'MAT') {
         // return res.status(500).send('kodepoli not valid') 
         return res.status(500).send({ response: { message: 'kodepoli not valide', code: 408 } });
      }
      var polieksekutif = req.body.polieksekutif;
      if (polieksekutif !== 0) {
         // return res.status(500).send('polieksekutif not valid') 
         return res.status(500).send({ response: { message: 'polieksekutif not valid', code: 412 } });
      }
      var response = {};
      response.namapoli = 'Poli Mata';

      jwt.verify(xtoken, 'secret', function (err, decoded) {
         if (err) {
            // return res.status(500).send(err); 
            return res.status(500).send({ response: { message: err, code: 400 } });
         }
         try {
            username = decoded.username;
            password = decoded.password;
            var metadata = { message: 'OK', code: 200 }
            if (username === 'hecbpjs-keren' && password === 'superpassword-keren') {
               if (kodepoli === 'MAT' && polieksekutif === 0) {
                  admin.database().ref(`hecAntrian/indexes/${tanggalperiksa}`).once('value')
                     .then((result) => {
                        if (result.exists()) {
                           // var aa = result.val().latestOnlineQueue ? result.val().latestOnlineQueue : 0;
                           // var bb = result.val().latestOfflineQueue ? result.val().latestOfflineQueue : 0;
                           var cc = result.val().antrianTotal ? result.val().antrianTotal : 0;
                           // console.log(cc)
                           response.totalantrean = cc
                           response.jumlahterlayani = result.val().antrianTerlayani ? result.val().antrianTerlayani : 0;
                           response.lastupdate = new Date().getTime();
                           return res.status(200).send({ response, metadata })
                        } else {
                           // return res.status(500).send('no data');
                           return res.status(500).send({ response: { message: 'Data tidak ditemukan', code: 413 } });
                        }
                     })
               }
            } else {
               // return res.status(500).send('unregistered login');
               return res.status(500).send({ response: { message: 'Login not valid.', code: 401 } });
            }
         } catch (err) {
            // return res.status(500).send(err);
            return res.status(500).send({ response: { message: err, code: 400 } });
            // console.log(err);
         }
      });
   }
   catch (error) {
      // return res.status(500).send(error);
      return res.status(500).send({ response: { message: error, code: 400 } });
   }
});

///// ***** end - get rekap antrian ***** /////



///// ***** start - api get list kode booking operasi ***** /////
app.post('/api/prod/get-list-kode-booking-operasi', (req, res) => {
   try {
      var xtoken = req.headers['x-token'];
      var nopeserta = req.body.nopeserta;
      if (!nopeserta || nopeserta.length !== 13) {
         // return res.status(500).send('nopeserta not valid') 
         return res.status(500).send({ response: { message: 'nomorkartu tidak valid.', code: 402 } });
      }
      var response = {};

      jwt.verify(xtoken, 'secret', function (err, decoded) {
         if (err) {
            // return res.status(500).send(err); 
            return res.status(500).send({ response: { message: err, code: 400 } });
         }
         try {
            username = decoded.username;
            password = decoded.password;
            if (username === 'hecbpjs-keren' && password === 'superpassword-keren') {
               admin.database().ref('users').orderByChild('userNoBpjs').equalTo(nopeserta).once('value')
                  .then((snapshot) => {
                     if (snapshot.exists()) {
                        // console.log('////////// user ada di db')
                        admin.database().ref('hecKamarOperasi').orderByChild('hecKoUserNoBpjs').equalTo(nopeserta).once('value')
                           .then((snapshot1) => {
                              if (snapshot1.exists()) {
                                 // console.log('////////// jadwal operasi ada')
                                 // if (snapshot1.val().hecKoTerlaksana === 0) {
                                 var metadata = { message: 'OK', code: 200 }
                                 // console.log(snapshot1.val())
                                 var list1 = []
                                 snapshot1.forEach((el) => {
                                    if (el.val().hecKoTerlaksana === 0) {
                                       list1.push({
                                          kodebooking: el.val().hecKoKodeBooking,
                                          tanggaloperasi: el.val().hecKoTanggalOperasi,
                                          jenistindakan: el.val().hecKoJenisTindakan,
                                          kodepoli: el.val().hecKoKodePoli,
                                          namapoli: el.val().hecKoNamaPoli,
                                          terlaksana: el.val().hecKoTerlaksana
                                       })
                                    }
                                    response.list = list1
                                 })
                                 res.status(200).send({ response, metadata });

                              } else {
                                 // console.log('////////// jadwal operasi belum ada')
                                 var metadata = { message: 'OK', code: 200 }
                                 var list1 = []
                                 response.list = list1
                                 return res.status(200).send({ response, metadata });
                              }
                           })
                     } else {
                        // console.log('('////////// user ny registered on db')
                        // admin.database().ref('hecKamarOperasi').once('value')
                        // .then((snapshot1) => {
                        //    if (snapshot1.exists()) {
                        //       // console.log('////////// jadwal operasi ada')
                        //    } else {
                        //       // console.log('////////// jadwal operasi belum ada')
                        //       var metadata = { message: 'OK', code: 200 }
                        //       response.list = ''
                        //       return res.status(200).send({response, metadata});
                        //    }
                        // })
                        // return res.status(500).send('unregistered login');
                        return res.status(500).send({ response: { message: 'Login not valid.', code: 401 } });
                     }
                  })
            } else {
               // return res.status(500).send('unregistered login');
               return res.status(500).send({ response: { message: 'Login not valid.', code: 401 } });
            }
         } catch (err) {
            // console.log(err)
            return res.status(500).send({ response: { message: err, code: 400 } });
         }
      });
   }
   catch (error) {
      // return res.status(500).send(error);
      return res.status(500).send({ response: { message: error, code: 400 } });
   }
});
///// ***** end - api get list kode booking operasi ***** /////

///// ***** start - api get list jadwal operasi ***** /////
app.post('/api/prod/get-list-jadwal-operasi', (req, res) => {
   try {
      var xtoken = req.headers['x-token'];
      var tanggalawal = req.body.tanggalawal;
      if (!validate(tanggalawal, 'YYYY-MM-DD')) {
         // return res.status(500).send('format tanggalawal not valid') 
         return res.status(500).send({ response: { message: 'Format tannggalawal not valid.', code: 414 } });
      }
      // if (dayjs(tanggalawal).isBefore(dayjs()) === true) { return res.status(500).send('tanggalawal harus H+1') }
      var tanggalakhir = req.body.tanggalakhir;
      if (!validate(tanggalakhir, 'YYYY-MM-DD')) {
         // return res.status(500).send('format tanggalakhir not valid') 
         return res.status(500).send({ response: { message: 'Format tanggalakhir not valid.', code: 415 } });
      }
      if (dayjs(tanggalakhir).isBefore(dayjs(tanggalawal)) === true) {
         // return res.status(500).send('tanggalakhir harus lebih besar dari tanggalawal') 
         return res.status(500).send({ response: { message: 'tanggalakhir harus lebih besar tanggalawal.', code: 416 } });
      }
      var response = {};
      // var nopeserta = req.body.nopeserta;
      // if (!nopeserta || nopeserta.length !== 13) { return res.status(500).send('nopeserta not valid') }

      jwt.verify(xtoken, 'secret', function (err, decoded) {
         if (err) {
            // return res.status(500).send(err); 
            return res.status(500).send({ response: { message: err, code: 400 } });
         }
         try {
            username = decoded.username;
            password = decoded.password;
            if (username === 'hecbpjs-keren' && password === 'superpassword-keren') {
               admin.database().ref('hecKamarOperasi').orderByChild('hecKoTanggalOperasi').startAt(tanggalawal).endAt(tanggalakhir).once('value')
                  .then((snapshot1) => {
                     if (snapshot1.exists()) {
                        var metadata = { message: 'OK', code: 200 }
                        var list1 = []
                        snapshot1.forEach((el) => {
                           list1.push({
                              kodebooking: el.val().hecKoKodeBooking,
                              tanggaloperasi: el.val().hecKoTanggalOperasi,
                              jenistindakan: el.val().hecKoJenisTindakan,
                              kodepoli: el.val().hecKoKodePoli,
                              namapoli: el.val().hecKoNamaPoli,
                              terlaksana: el.val().hecKoTerlaksana,
                              nopeserta: el.val().hecKoUserNoBpjs,
                              lastupdate: new Date().getTime()
                           })
                           response.list = list1
                        })
                        res.status(200).send({ response, metadata });
                     } else {
                        // console.log('////////// jadwal operasi belum ada')
                        var metadata = { message: 'OK', code: 200 }
                        var list1 = []
                        response.list = list1
                        return res.status(200).send({ response, metadata });
                     }
                  })
            } else {
               // return res.status(500).send('unregistered login');
               return res.status(500).send({ response: { message: 'Login not valid.', code: 401 } });
            }
         } catch (err) {
            // console.log(err)
            return res.status(500).send({ response: { message: err, code: 400 } });
         }
      });
   }
   catch (error) {
      // return res.status(500).send(error);
      return res.status(500).send({ response: { message: error, code: 400 } });
   }
});
///// ***** end - api get list jadwal operasi ***** /////


///// ##### end production ###### /////

exports.app = functions.https.onRequest(app);
