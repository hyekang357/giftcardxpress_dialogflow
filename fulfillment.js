'use strict';

const https = require('https');
const functions = require('firebase-functions');
const {WebhookClient} = require('dialogflow-fulfillment');
const {Card, Suggestion} = require('dialogflow-fulfillment');

process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements

exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });
  var apiGateway_url = '';
  // console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  // console.log('Dialogflow Request body: ' + JSON.stringify(request.body));
   function checkBalance(agent) {
      var store = request.body.queryResult.parameters.store;
      return new Promise((resolve1, reject1) => {
        let userid = 'example_user';
        let url = `${apiGateway_url}/users/${userid}/cards`;
        return https.get(url, (res) => {
            let str_data = "";
            res.on('data', function (data) {
                str_data += data.toString('utf8');
            });

            res.on('end', function() {
               let obj_data = JSON.parse(str_data);
               // console.log(obj_data);
               let num_cards = obj_data.res.length;

               obj_data.res.forEach((card) => {
                 if(card.name.S.toLowerCase() == store.toLowerCase()) {
                   return resolve1(card);
                 }
               });
               return resolve1(null);
            });
         }).on("error", (err) => {
           // console.log("Error: " + err.message);
           return reject1(err);
         });
     }).then((card) => {
         return new Promise((resolve2, reject2) => {
           if (card === null) {
             // no card associated with given store card
             agent.add(`You have no gift card from ${store}`);
             resolve2();
           } else {
             let url = '';
             let apikey = '';
             let options = {
               "method": "GET",
               "hostname": `${url}`,
               "path": `/api/accounts/${card.account_id.S}`,
               "headers": {
                 "X-API-Key": `${apikey}`
               }
             };

             return https.request(options, function (res1) {
               let chunks = [];

               res1.on("data", function (chunk) {
                 chunks.push(chunk);
               });

               res1.on("end", function () {
                 let body = Buffer.concat(chunks);
                 let str_body = body.toString('utf8');
                 let obj_body = JSON.parse(str_body);
                 let dollars_str = `${Math.trunc(obj_body.balance/100)} dollars`;
                 let cents_str = ""
                 if (cents > 0){
                   cents_str = `${obj_body.balance % 100} cents.`;
                 }
                 agent.add(`Your gift card to ${card.name.S} has balance of ${dollars_str} ${cents_str}`);
                 return resolve2(str_body);
               });
             }).on("error", function(err) {
                 return reject2(err);
             }).end();
           }
         });
     }).catch((err) => {
         console.log("Error: " + err.message);
         return Promise.reject(err);
     });
   }

   function listCardNames(agent) {
      return new Promise((resolve1, reject1) => {
        let userid = 'qwer';
        let url = `${apiGateway_url}/users/${userid}/cards`;
        return https.get(url, (res) => {
            let str_data = "";
            res.on('data', function (data) {
                str_data += data.toString('utf8');
            });

            res.on('end', function() {
               let obj_data = JSON.parse(str_data);
               console.log(obj_data);
               let num_cards = obj_data.res.length;

               if (num_cards === 0) {
                   agent.add(`You have no gift cards.`);
               } else {
                   agent.add(`You have ${num_cards} gift cards.`);
               }
               return resolve1(obj_data.res);
            });
         }).on("error", (err) => {
           console.log("Error: " + err.message);
           return reject1(err);
         });
     }).then((cards) => {
         let name_of_all_cards = ""
         let promises = cards.map((card) => {
           return new Promise((resolve2, reject2) => {
             if (card.name.S) {
                 console.log(card.name.S);
                 name_of_all_cards += card.name.S + ", ";
                 return resolve2(card.name.S);
             } else {
                 return reject2();
             }
           });
         });

         return Promise.all(promises).then((d)=> {
           let name_of_all_cards_1 = name_of_all_cards.substr(0, name_of_all_cards.length - 2) + "."
           agent.add(`You have gift cards from ${name_of_all_cards_1}`)
           console.log(d);
           return Promise.resolve(d);
         }).catch((err) => {
             return Promise.reject(err);
         });
     }).catch((err) => {
         console.log("Error: " + err.message);
         return Promise.reject(err);
     });
   }

  let intentMap = new Map();
  intentMap.set('list', listCardNames);
  intentMap.set('check', checkBalance);

  agent.handleRequest(intentMap);
});
