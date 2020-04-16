/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/server/index.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/server/Consumer.js":
/*!********************************!*\
  !*** ./src/server/Consumer.js ***!
  \********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

eval("const { ShortCodeExpireError } = __webpack_require__(/*! @mixer/shortcode-oauth */ \"@mixer/shortcode-oauth\");\r\nconst interactive = __webpack_require__(/*! @mixer/interactive-node */ \"@mixer/interactive-node\");\r\nconst BasicController = __webpack_require__(/*! ./controllers/BasicController */ \"./src/server/controllers/BasicController.js\");\r\nconst fetch = __webpack_require__(/*! node-fetch */ \"node-fetch\");\r\n\r\nconst MIXER_API = 'https://mixer.com/api/v1';\r\ninteractive.setWebSocket(__webpack_require__(/*! ws */ \"ws\"));\r\n\r\nmodule.exports = class Consumer {\r\n    constructor(uuid, shortCode, gameVersion) {\r\n\r\n        this.uuid           = uuid;\r\n        this.shortCode      = shortCode;\r\n        this.ws             = null;\r\n        this.tokens         = null;\r\n        this.nonce          = 0;\r\n        this.gameVersion    = gameVersion;\r\n        this.mixer          = null;\r\n        this.onClose        = function() {};\r\n        this.controller     = new BasicController(this, this.mixer);\r\n        this.isMixerReady   = false;\r\n        this.keepAlive      = false;    //Keeps the mixer alive\r\n        this.user           = null;\r\n    }\r\n\r\n    /** Closes any connections we have and cleans up the code.\r\n     * Called to cleanup stuff, like when the WS closes.\r\n     * @param hard determines if the mixer should be aborted too.\r\n     */\r\n    close(reason, hard = false) {     \r\n        //Close current\r\n        console.log('consumer closed', this.uuid, reason, hard);\r\n        if (this.ws) {\r\n            this.ws.close();\r\n            this.ws = null;\r\n        }\r\n\r\n        if (this.controller) {\r\n            this.controller.onClose(reason, hard);\r\n        }\r\n\r\n        if (hard === true || !this.keepAlive) {\r\n            console.log(\"mixer hard close\", \"hard:\", hard, \"keepAlive:\", this.keepAlive);\r\n\r\n            //We dont want regular WS closures to cleanup\r\n            if (this.mixer) {\r\n                this.mixer.close();\r\n                this.mixer = null;\r\n            }\r\n        }\r\n\r\n        this.onClose();\r\n    }\r\n\r\n    /** Sets the current connection */\r\n    async setConnection(ws) {        \r\n        const that = this;\r\n        console.log('consumer connected', this.uuid);\r\n\r\n        //Detatch previous websockets\r\n        if (this.ws != null) {\r\n            let pws = this.ws;\r\n            this.ws = null;\r\n            pws.removeEventListener();\r\n            pws.close();\r\n        }\r\n\r\n        //Connect to the new one\r\n        this.ws = ws;\r\n        this.ws.on('close', (message) => {\r\n            //Close previous\r\n            if (ws != that.ws) {\r\n                console.log('consumer previous connection closed', this.uuid, message);\r\n                return;\r\n            }\r\n\r\n            //Run through the cleanup, but dont clean up mixer if we are to be remembered\r\n            console.log('consumer WS closed', message);\r\n            that.close(message, ws);\r\n        });      \r\n        this.ws.on('message', (message) => {\r\n            //Close previous\r\n            if (ws != that.ws) {\r\n                console.log('consumer previous connection message', this.uuid, message);\r\n                return;\r\n            }\r\n            \r\n            //we got a message, so lets pass it on\r\n            console.log(this.uuid, message);\r\n            let blob = JSON.parse(message);\r\n            this.controller.onMessage(blob);\r\n        });\r\n\r\n        //Say hello!        \r\n        this.send('HELLO');\r\n\r\n        try \r\n        {\r\n            //Only wait for tokens if we need too\r\n            if (!this.tokens) \r\n            {\r\n                console.log('MIXER_CODE_WAIT', this.shortCode);\r\n                this.send('MIXER_CODE_WAIT', this.shortCode);\r\n                let tokenData = await this.shortCode.waitForAccept();\r\n                this.tokens = tokenData.data;\r\n            }\r\n        }   \r\n        catch(err) \r\n        {\r\n            //Catch token errors\r\n            if (err instanceof ShortCodeExpireError) {\r\n                if (!this.isMixerReady) {\r\n                    console.warn('MIXER_CODE_EXPIRE', this.shortCode.code);\r\n                    this.send('MIXER_CODE_EXPIRE', this.shortCode.code);\r\n                    this.close('short code expired', true);\r\n                    return;\r\n                }\r\n            }\r\n        }\r\n        \r\n        //We are ready\r\n        console.log('MIXER_CODE_ACCEPT', this.shortCode.code);\r\n        this.send('MIXER_CODE_ACCEPT', this.shortCode.code);\r\n\r\n        //Get the user. Dont care how long this takes. Eventually consistent\r\n        this.mixerResource('GET', '/users/current').then((user) => {\r\n            this.user = user;\r\n            console.log(\"MIXER_IDENTIFY\", this.user);\r\n            this.send('MIXER_IDENTIFY', this.user)\r\n        });\r\n\r\n        //We havn't gotten a client yet, so set it up\r\n        if (this.mixer == null) {\r\n            console.log(\"consumer creating mixer\", this.uuid);\r\n            this.mixer = new interactive.GameClient();\r\n            this.controller.setMixer(this.mixer);\r\n        }\r\n\r\n        //Close the mixer\r\n        if (this.isMixerReady) {\r\n            console.log(\"Already have mixer, saying hello!\", this.uuid);\r\n            this.send('MIXER_OPEN');\r\n            this.controller.onReady();\r\n            return;\r\n        }\r\n\r\n\r\n        //Register errors\r\n        this.mixer.on('error', (e) => {\r\n            console.error(\"An error has occured in mixplay\", this.uuid, e);\r\n            that.close('Mixplay has returned an error');\r\n        });\r\n\r\n        //Register close\r\n        this.mixer.on('close', () => {\r\n            console.warn(\"consumer's mixer closed\");\r\n            that.isMixerReady = false;\r\n        });\r\n\r\n        //Open mixplay\r\n        this.mixer.open({ \r\n            authToken: this.tokens.accessToken,\r\n            versionId: this.gameVersion\r\n        }).then(() => {\r\n\r\n            console.log('consumer opened', this.uuid);\r\n            that.send('MIXER_OPEN');\r\n            that.isMixerReady = true;\r\n            that.controller.onReady();\r\n            return that.mixer.ready(true);\r\n\r\n        }).catch(e => {\r\n            console.error(\"consumer failed to open mixer\", e);\r\n            that.remembered = false;\r\n            that.send('ERROR', e);\r\n            that.close('open exception', true);\r\n        });\r\n    }\r\n\r\n    /** Sends an event */\r\n    send(event, payload = null) {\r\n        //TODO: Queue Events\r\n        if (!this.ws) return false;\r\n        return this.ws.send(JSON.stringify({ \r\n            e: event, \r\n            p: payload, \r\n            n: this.nonce++ \r\n        }));\r\n    }\r\n\r\n    /** fetches a mixer endpoint */\r\n    async mixerResource(verb, endpoint, payload = null) {\r\n        let response = await fetch(`${MIXER_API}${endpoint}`, {\r\n            method: verb,\r\n            body: payload ? JSON.stringify(payload) : null,\r\n            headers: {\r\n                'Content-Type': 'application/json',\r\n                'Authorization': `Bearer ${this.tokens.accessToken}`\r\n            }\r\n        });\r\n\r\n        return await response.json();\r\n    }\r\n}\n\n//# sourceURL=webpack:///./src/server/Consumer.js?");

/***/ }),

/***/ "./src/server/controllers/BasicController.js":
/*!***************************************************!*\
  !*** ./src/server/controllers/BasicController.js ***!
  \***************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

eval("const MixController = __webpack_require__(/*! ./MixController */ \"./src/server/controllers/MixController.js\");\r\nmodule.exports = class BasicController extends MixController {\r\n    async ready() {\r\n        const self = this;\r\n        let scene = this.scenes[0];\r\n        let controls = scene.getControls();\r\n        for(let index in controls) {\r\n\r\n            //Get the control and the base emit\r\n            let control = controls[index];\r\n            let base = control.emit;\r\n            if (base != null) {\r\n\r\n                //Hook into the emit\r\n                control.emit = function(event, ...args) { \r\n                    self.send('EVENT_CONTROL', {\r\n                        event: event,\r\n                        args: args,\r\n                        control: {\r\n                            controlID:  control.controlID,\r\n                            disabled:   control.disabled,\r\n                            kind:       control.kind,\r\n                            meta:       control.meta,\r\n                            position:   control.position,\r\n                            cost:       control.cost,\r\n                            text:       control.text,\r\n                        },\r\n                    }); \r\n                };\r\n            }\r\n        }\r\n    }\r\n}\n\n//# sourceURL=webpack:///./src/server/controllers/BasicController.js?");

/***/ }),

/***/ "./src/server/controllers/MixController.js":
/*!*************************************************!*\
  !*** ./src/server/controllers/MixController.js ***!
  \*************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("\r\nmodule.exports = class MixController {\r\n    constructor(consumer) {\r\n        this.consumer = consumer;\r\n        this.uuid = consumer.uuid;\r\n        this.mixer = consumer.mixer;\r\n        this.scenes = null;\r\n        this.time = 0;\r\n    }\r\n\r\n    /** Sets the mixer instance */\r\n    setMixer(mixer) { \r\n        this.mixer = mixer;\r\n    }\r\n\r\n    /** Ready to actually do mix stuff */\r\n    async onReady() {\r\n        this.scenes = await this.mixer.synchronizeScenes();\r\n        this.time   = await this.mixer.getTime();\r\n        \r\n        console.log(this.uuid, \"scenes\", this.scenes);\r\n        console.log(this.uuid, \"time\", this.time);\r\n\r\n        //Execute regular ready\r\n        this.send('PREREADY');\r\n        this.ready();\r\n        \r\n        //We are fully ready\r\n        this.send('READY', {});\r\n    }\r\n\r\n    /** Executed once everything is setup */\r\n    ready() {}\r\n\r\n    /** Called when closed */\r\n    onClose(reason, hard) { }\r\n\r\n    /** Called when there is a message from the client  */\r\n    onMessage(message) {  }\r\n\r\n    /** Sends a payload */\r\n    send(event, payload = null) {\r\n        this.consumer.send(\"MC_\" + event, payload);\r\n    }\r\n}\n\n//# sourceURL=webpack:///./src/server/controllers/MixController.js?");

/***/ }),

/***/ "./src/server/index.js":
/*!*****************************!*\
  !*** ./src/server/index.js ***!
  \*****************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

eval("const { v1: Uuid, v5: Uuidv5 } = __webpack_require__(/*! uuid */ \"uuid\");\r\n\r\nconst FS = __webpack_require__(/*! fs */ \"fs\");\r\nconst Consumer = __webpack_require__(/*! ./Consumer.js */ \"./src/server/Consumer.js\");\r\nconst NodeCache = __webpack_require__(/*! node-cache */ \"node-cache\");\r\nconst Redis = __webpack_require__(/*! redis */ \"redis\");\r\nconst redis = Redis.createClient();\r\n\r\n//init: express\r\nconst EXPRESS_PORT = 3000;\r\nconst session = __webpack_require__(/*! express-session */ \"express-session\");\r\nconst express = __webpack_require__(/*! express */ \"express\");\r\nconst http = __webpack_require__(/*! http */ \"http\");\r\nconst WebSocket = __webpack_require__(/*! ws */ \"ws\");\r\nconst app = express();\r\nconst RedisStore = __webpack_require__(/*! connect-redis */ \"connect-redis\")(session);\r\nconst sessionParser = session({\r\n    saveUninitialized: false,\r\n    store: new RedisStore({ client: redis }),\r\n    secret: '$hgjfdsaa7y8',\r\n    resave: false\r\n});\r\n\r\n  \r\napp.set('view engine', 'ejs');\r\napp.use(express.static('public'));\r\napp.use(sessionParser);\r\n\r\n//init: oauth\r\nconst { OAuthClient } = __webpack_require__(/*! @mixer/shortcode-oauth */ \"@mixer/shortcode-oauth\");\r\n\r\nconst MIXER_GAME_VERSION = 461588;\r\nconst MIXER_CLIENT_ID = '8f1f2333d089d0098efb4c1b2599b54e1a696ffc5850f121';\r\nconst mixerOAuthClient = new OAuthClient({\r\n    clientId: MIXER_CLIENT_ID,\r\n    scopes: [\r\n        'interactive:robot:self'\r\n    ],\r\n});\r\n\r\n//https://github.com/websockets/ws/blob/master/examples/express-session-parse/index.js\r\nconst server = http.createServer(app);\r\nconst wss = new WebSocket.Server({\r\n    clientTracking: false,\r\n    noServer: true\r\n});\r\n\r\n/*\r\nconst attempt = () =>\r\n  client\r\n    .getCode()\r\n    .then(code => {\r\n      console.log(`Go to mixer.com/go and enter ${code.code}`);\r\n      return code.waitForAccept();\r\n    })\r\n    .catch(err => {\r\n      if (err instanceof ShortCodeExpireError) {\r\n        return attempt(); // loop!\r\n      }\r\n\r\n      throw err;\r\n    });\r\n*/\r\n\r\nconst TTL_PENDING       = 60 * 2;\r\nconst TTL_ACTIVE        = 60 * 60 * 24;\r\nconst TTL_REMEMBER      = 60 * 60 * 1;\r\nconst TTL_ACTIVE_CHECK  = 60 * 10;\r\nconst TTL_PENDING_CHECK = TTL_PENDING / 4;\r\n\r\n//Pending Connections are a node cache\r\nlet pendingConsumers = new NodeCache({ stdTTL: TTL_PENDING, checkperiod: TTL_PENDING_CHECK, useClones: false, deleteOnExpire: true });\r\npendingConsumers.on('expired', (key, value) => { value.close('Exceeded maximum pending time'); console.log(\"Pending Expired\", value.uuid); });\r\n\r\n//Existing connections are just a really long node cache\r\nlet activeConsumers = new NodeCache({stdTTL: TTL_ACTIVE, checkperiod: TTL_ACTIVE_CHECK, useClones: false, deleteOnExpire: true });\r\nactiveConsumers.on('expired', (key, value) => { value.close('Exceeded maxium active time'); console.log(\"Consumer Expired\", value.uuid); })\r\n\r\n/** Gets a new UUID to identify the connection */\r\nfunction getNewIdentifier(req, version = 'v5') {\r\n    if (version == 'v1') return Uuid();\r\n    let uuid = Uuidv5(req.connection.remoteAddress, Uuidv5.DNS);\r\n    console.log(req.connection.remoteAddress, uuid);\r\n    return uuid;\r\n}\r\n\r\n// GET /go\r\napp.get('*', async (req, res) => {\r\n    //Prepare the UUID scheme\r\n    let uuidv = req.query.uuid || 'v5';\r\n\r\n    //Fetch existing uuid. If we have remember me, then we will just use the V5 scheme\r\n    let existingUuid = req.session.uuid;    \r\n    if (req.query.remember) {\r\n        console.log('Remembered Connection (manual IP based uuidv5)');\r\n        uuidv = 'v5';\r\n        existingUuid = getNewIdentifier(req, uuidv);\r\n    }\r\n\r\n    //Get the existing customer\r\n    let existingConsumer = activeConsumers.get(existingUuid || '');\r\n    let consumer = null;\r\n\r\n    if (existingUuid && existingConsumer != null) {\r\n        console.log(\"Connection Returned\", existingUuid);\r\n        consumer = existingConsumer;\r\n    } else {\r\n\r\n        //New identifier\r\n        let uuid = getNewIdentifier(req, uuidv);\r\n        let oauth = await mixerOAuthClient.getCode();\r\n        console.log(\"Connection Created\", uuid);\r\n        \r\n        //Prepare the consumer\r\n        consumer = new Consumer(uuid, oauth, MIXER_GAME_VERSION);\r\n        consumer.keepAlive = req.query.keepAlive !== undefined;\r\n        consumer.onClose = () => { \r\n            pendingConsumers.del(uuid);\r\n\r\n            if (!consumer.keepAlive) {\r\n                console.log(\"Connection Forgotten\", uuid);\r\n                activeConsumers.del(uuid); \r\n            } else {\r\n                //Set the uuid as remembering.\r\n                console.log(\"Connection Remembered\", uuid, TTL_REMEMBER);\r\n                activeConsumers.ttl(uuid, TTL_REMEMBER);\r\n            }\r\n        };\r\n\r\n        //Add to the pending connections\r\n        pendingConsumers.set(uuid, consumer);\r\n        req.session.uuid = uuid;\r\n    }\r\n\r\n    //Update the keep alive state\r\n    consumer.keepAlive = req.query.keepAlive !== undefined;\r\n    console.log(consumer.uuid, 'keep alive:' + consumer.keepAlive, req.query.keepAlive);\r\n\r\n    res.render('base', { \r\n        consumer: consumer, \r\n        port: EXPRESS_PORT,\r\n    });\r\n});\r\n\r\n// Websocket Connection\r\nwss.on('connection', async function connection(ws, request) {\r\n\r\n    //Get the consumer\r\n    const uuid = request.session.uuid;\r\n    const consumer = pendingConsumers.get(uuid);\r\n    const existing = activeConsumers.get(uuid);\r\n\r\n    //Validate the consumer\r\n    if (consumer == null) {\r\n        if (existing == null) {\r\n\r\n            //Invalid connection\r\n            console.warn(\"Invalid connection, no consumer found.\");\r\n            request.session.destroy(function() {\r\n                if (ws) ws.close();\r\n            });\r\n\r\n            return;\r\n        } else {\r\n\r\n            //Regular connection\r\n            console.warn(\"Returning consumer, hijacking previous WS\");\r\n            existing.setConnection(ws).then(() => {});\r\n            return;\r\n        }\r\n    }\r\n\r\n    //Set the connection & upgrade\r\n    console.log(\"New Connection\", uuid);\r\n    consumer.setConnection(ws).then(() => {});\r\n    pendingConsumers.del(uuid);\r\n    activeConsumers.set(uuid, consumer);\r\n    activeConsumers.ttl(uuid, TTL_ACTIVE);\r\n});\r\n\r\n\r\n// Backend Server Upgrade\r\nserver.on('upgrade', function(request, socket, head) {\r\n    console.log('Parsing session from request...');  \r\n    sessionParser(request, {}, () => {\r\n        if (!request.session.uuid) {\r\n            console.log('Destroying Session');  \r\n            socket.destroy();\r\n            return;\r\n        }\r\n        console.log('Session is parsed!');\r\n        wss.handleUpgrade(request, socket, head, function(ws) {\r\n            wss.emit('connection', ws, request);\r\n        });\r\n    });\r\n});\r\nserver.listen(EXPRESS_PORT, () => {\r\n    console.log('Listening for example app: http://localhost:' + EXPRESS_PORT + '/go');\r\n});\n\n//# sourceURL=webpack:///./src/server/index.js?");

/***/ }),

/***/ "@mixer/interactive-node":
/*!******************************************!*\
  !*** external "@mixer/interactive-node" ***!
  \******************************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"@mixer/interactive-node\");\n\n//# sourceURL=webpack:///external_%22@mixer/interactive-node%22?");

/***/ }),

/***/ "@mixer/shortcode-oauth":
/*!*****************************************!*\
  !*** external "@mixer/shortcode-oauth" ***!
  \*****************************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"@mixer/shortcode-oauth\");\n\n//# sourceURL=webpack:///external_%22@mixer/shortcode-oauth%22?");

/***/ }),

/***/ "connect-redis":
/*!********************************!*\
  !*** external "connect-redis" ***!
  \********************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"connect-redis\");\n\n//# sourceURL=webpack:///external_%22connect-redis%22?");

/***/ }),

/***/ "express":
/*!**************************!*\
  !*** external "express" ***!
  \**************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"express\");\n\n//# sourceURL=webpack:///external_%22express%22?");

/***/ }),

/***/ "express-session":
/*!**********************************!*\
  !*** external "express-session" ***!
  \**********************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"express-session\");\n\n//# sourceURL=webpack:///external_%22express-session%22?");

/***/ }),

/***/ "fs":
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"fs\");\n\n//# sourceURL=webpack:///external_%22fs%22?");

/***/ }),

/***/ "http":
/*!***********************!*\
  !*** external "http" ***!
  \***********************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"http\");\n\n//# sourceURL=webpack:///external_%22http%22?");

/***/ }),

/***/ "node-cache":
/*!*****************************!*\
  !*** external "node-cache" ***!
  \*****************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"node-cache\");\n\n//# sourceURL=webpack:///external_%22node-cache%22?");

/***/ }),

/***/ "node-fetch":
/*!*****************************!*\
  !*** external "node-fetch" ***!
  \*****************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"node-fetch\");\n\n//# sourceURL=webpack:///external_%22node-fetch%22?");

/***/ }),

/***/ "redis":
/*!************************!*\
  !*** external "redis" ***!
  \************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"redis\");\n\n//# sourceURL=webpack:///external_%22redis%22?");

/***/ }),

/***/ "uuid":
/*!***********************!*\
  !*** external "uuid" ***!
  \***********************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"uuid\");\n\n//# sourceURL=webpack:///external_%22uuid%22?");

/***/ }),

/***/ "ws":
/*!*********************!*\
  !*** external "ws" ***!
  \*********************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"ws\");\n\n//# sourceURL=webpack:///external_%22ws%22?");

/***/ })

/******/ });