const { v1: Uuid, v5: Uuidv5 } = require('uuid');

const FS = require('fs');
const Consumer = require('./Consumer.js');
const NodeCache = require('node-cache');
const Redis = require('redis');
const redis = Redis.createClient();

//init: express
const EXPRESS_PORT = 3000;
const session = require('express-session');
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const app = express();
const RedisStore = require('connect-redis')(session);
const sessionParser = session({
    saveUninitialized: false,
    store: new RedisStore({ client: redis }),
    secret: '$hgjfdsaa7y8',
    resave: false
});

  
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(sessionParser);

//init: oauth
const { OAuthClient } = require('@mixer/shortcode-oauth');

const MIXER_GAME_VERSION = 461588;
const MIXER_CLIENT_ID = '8f1f2333d089d0098efb4c1b2599b54e1a696ffc5850f121';
const MIXER_API = 'https://mixer.com/api/v1';
const mixerOAuthClient = new OAuthClient({
    clientId: MIXER_CLIENT_ID,
    scopes: [
        'interactive:robot:self'
    ],
});

//init carnia
const Carina  = require('carina').Carina;
Carina.WebSocket = WebSocket;
const carnia = new Carina({
    isBOt: true,
    queryString: { 'Client-ID': MIXER_CLIENT_ID }
}).open();

//https://github.com/websockets/ws/blob/master/examples/express-session-parse/index.js
const server = http.createServer(app);
const wss = new WebSocket.Server({
    clientTracking: false,
    noServer: true
});

/*
const attempt = () =>
  client
    .getCode()
    .then(code => {
      console.log(`Go to mixer.com/go and enter ${code.code}`);
      return code.waitForAccept();
    })
    .catch(err => {
      if (err instanceof ShortCodeExpireError) {
        return attempt(); // loop!
      }

      throw err;
    });
*/

const TTL_PENDING       = 60 * 2;
const TTL_ACTIVE        = 60 * 60 * 24;
const TTL_REMEMBER      = 60 * 60 * 1;
const TTL_ACTIVE_CHECK  = 60 * 10;
const TTL_PENDING_CHECK = TTL_PENDING / 4;

//Pending Connections are a node cache
let pendingConsumers = new NodeCache({ stdTTL: TTL_PENDING, checkperiod: TTL_PENDING_CHECK, useClones: false, deleteOnExpire: true });
pendingConsumers.on('expired', (key, value) => { value.close('Exceeded maximum pending time'); console.log("Pending Expired", value.uuid); });

//Existing connections are just a really long node cache
let activeConsumers = new NodeCache({stdTTL: TTL_ACTIVE, checkperiod: TTL_ACTIVE_CHECK, useClones: false, deleteOnExpire: true });
activeConsumers.on('expired', (key, value) => { value.close('Exceeded maxium active time'); console.log("Consumer Expired", value.uuid); })

/** Gets a new UUID to identify the connection */
function getNewIdentifier(req, version = 'v5') {
    if (version == 'v1') return Uuid();
    let uuid = Uuidv5(req.connection.remoteAddress, Uuidv5.DNS);
    console.log(req.connection.remoteAddress, uuid);
    return uuid;
}

// GET /go
app.get('*', async (req, res) => {
    //Prepare the UUID scheme
    let uuidv = req.query.uuid || 'v5';

    //Fetch existing uuid. If we have remember me, then we will just use the V5 scheme
    let existingUuid = req.session.uuid;    
    if (req.query.remember) {
        console.log('Remembered Connection (manual IP based uuidv5)');
        uuidv = 'v5';
        existingUuid = getNewIdentifier(req, uuidv);
    }

    //Get the existing customer
    let existingConsumer = activeConsumers.get(existingUuid || '');
    let consumer = null;

    if (existingUuid && existingConsumer != null) {
        console.log("Connection Returned", existingUuid);
        consumer = existingConsumer;
    } else {

        //New identifier
        let uuid = getNewIdentifier(req, uuidv);
        let oauth = await mixerOAuthClient.getCode();
        console.log("Connection Created", uuid);
        
        //Prepare the consumer
        consumer = new Consumer(uuid, oauth, { MIXER_API, MIXER_CLIENT_ID, MIXER_GAME_VERSION, mixerOAuthClient, carnia });
        consumer.keepAlive = req.query.keepAlive !== undefined;
        consumer.onClose = () => { 
            pendingConsumers.del(uuid);

            if (!consumer.keepAlive) {
                console.log("Connection Forgotten", uuid);
                activeConsumers.del(uuid); 
            } else {
                //Set the uuid as remembering.
                console.log("Connection Remembered", uuid, TTL_REMEMBER);
                activeConsumers.ttl(uuid, TTL_REMEMBER);
            }
        };

        //Add to the pending connections
        pendingConsumers.set(uuid, consumer);
        req.session.uuid = uuid;
    }

    //Update the keep alive state
    consumer.keepAlive = req.query.keepAlive !== undefined;
    console.log(consumer.uuid, 'keep alive:' + consumer.keepAlive, req.query.keepAlive);

    res.render('base', { 
        consumer: consumer, 
        port: EXPRESS_PORT,
    });
});

// Websocket Connection
wss.on('connection', async function connection(ws, request) {

    console.log('Connection...');  

    //Get the consumer
    const uuid = request.session.uuid;
    const consumer = pendingConsumers.get(uuid);
    const existing = activeConsumers.get(uuid);

    //Validate the consumer
    if (consumer == null) {
        if (existing == null) {

            //Invalid connection
            console.warn("Invalid connection, no consumer found.");
            ws.send("please fuck off");

            //request.session.destroy(function() {
            //    if (ws) ws.close();
            //});

            return;
        } else {

            //Regular connection
            console.warn("Returning consumer, hijacking previous WS");
            existing.setConnection(ws).then(() => {});
            return;
        }
    }

    //Set the connection & upgrade
    console.log("New Connection", uuid);
    consumer.setConnection(ws).then(() => {});
    pendingConsumers.del(uuid);
    activeConsumers.set(uuid, consumer);
    activeConsumers.ttl(uuid, TTL_ACTIVE);
});


// Backend Server Upgrade
server.on('upgrade', function(request, socket, head) {
    console.log('Parsing session from request...');  
    sessionParser(request, {}, () => {
        if (!request.session.uuid) {
            console.log('Destroying Session');  
            socket.destroy();
            return;
        }
        console.log('Session is parsed!');
        wss.handleUpgrade(request, socket, head, function(ws) {
            wss.emit('connection', ws, request);
        });
    });
});
server.listen(EXPRESS_PORT, () => {
    console.log('Listening for example app: http://localhost:' + EXPRESS_PORT + '/go');
});