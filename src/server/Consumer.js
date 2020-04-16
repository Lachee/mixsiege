const { ShortCodeExpireError } = require('@mixer/shortcode-oauth');
const interactive = require('@mixer/interactive-node');
const BasicController = require('./controllers/BasicController');
const fetch = require('node-fetch');

const MIXER_API = 'https://mixer.com/api/v1';
interactive.setWebSocket(require('ws'));

module.exports = class Consumer {
    constructor(uuid, shortCode, gameVersion) {

        this.uuid           = uuid;
        this.shortCode      = shortCode;
        this.ws             = null;
        this.tokens         = null;
        this.nonce          = 0;
        this.gameVersion    = gameVersion;
        this.mixer          = null;
        this.onClose        = function() {};
        this.controller     = new BasicController(this, this.mixer);
        this.isMixerReady   = false;
        this.keepAlive      = false;    //Keeps the mixer alive
        this.user           = null;
    }

    /** Closes any connections we have and cleans up the code.
     * Called to cleanup stuff, like when the WS closes.
     * @param hard determines if the mixer should be aborted too.
     */
    close(reason, hard = false) {     
        //Close current
        console.log('consumer closed', this.uuid, reason, hard);
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }

        if (this.controller) {
            this.controller.onClose(reason, hard);
        }

        if (hard === true || !this.keepAlive) {
            console.log("mixer hard close", "hard:", hard, "keepAlive:", this.keepAlive);

            //We dont want regular WS closures to cleanup
            if (this.mixer) {
                this.mixer.close();
                this.mixer = null;
            }
        }

        this.onClose();
    }

    /** Sets the current connection */
    async setConnection(ws) {        
        const that = this;
        console.log('consumer connected', this.uuid);

        //Detatch previous websockets
        if (this.ws != null) {
            let pws = this.ws;
            this.ws = null;
            pws.removeEventListener();
            pws.close();
        }

        //Connect to the new one
        this.ws = ws;
        this.ws.on('close', (message) => {
            //Close previous
            if (ws != that.ws) {
                console.log('consumer previous connection closed', this.uuid, message);
                return;
            }

            //Run through the cleanup, but dont clean up mixer if we are to be remembered
            console.log('consumer WS closed', message);
            that.close(message, ws);
        });      
        this.ws.on('message', (message) => {
            //Close previous
            if (ws != that.ws) {
                console.log('consumer previous connection message', this.uuid, message);
                return;
            }
            
            //we got a message, so lets pass it on
            console.log(this.uuid, message);
            let blob = JSON.parse(message);
            this.controller.onMessage(blob);
        });

        //Say hello!        
        this.send('HELLO');

        try 
        {
            //Only wait for tokens if we need too
            if (!this.tokens) 
            {
                console.log('MIXER_CODE_WAIT', this.shortCode);
                this.send('MIXER_CODE_WAIT', this.shortCode);
                let tokenData = await this.shortCode.waitForAccept();
                this.tokens = tokenData.data;
            }
        }   
        catch(err) 
        {
            //Catch token errors
            if (err instanceof ShortCodeExpireError) {
                if (!this.isMixerReady) {
                    console.warn('MIXER_CODE_EXPIRE', this.shortCode.code);
                    this.send('MIXER_CODE_EXPIRE', this.shortCode.code);
                    this.close('short code expired', true);
                    return;
                }
            }
        }
        
        //We are ready
        console.log('MIXER_CODE_ACCEPT', this.shortCode.code);
        this.send('MIXER_CODE_ACCEPT', this.shortCode.code);

        //Get the user. Dont care how long this takes. Eventually consistent
        this.mixerResource('GET', '/users/current').then((user) => {
            this.user = user;
            console.log("MIXER_IDENTIFY", this.user);
            this.send('MIXER_IDENTIFY', this.user)
        });

        //We havn't gotten a client yet, so set it up
        if (this.mixer == null) {
            console.log("consumer creating mixer", this.uuid);
            this.mixer = new interactive.GameClient();
            this.controller.setMixer(this.mixer);
        }

        //Close the mixer
        if (this.isMixerReady) {
            console.log("Already have mixer, saying hello!", this.uuid);
            this.send('MIXER_OPEN');
            this.controller.onReady();
            return;
        }


        //Register errors
        this.mixer.on('error', (e) => {
            console.error("An error has occured in mixplay", this.uuid, e);
            that.close('Mixplay has returned an error');
        });

        //Register close
        this.mixer.on('close', () => {
            console.warn("consumer's mixer closed");
            that.isMixerReady = false;
        });

        //Open mixplay
        this.mixer.open({ 
            authToken: this.tokens.accessToken,
            versionId: this.gameVersion
        }).then(() => {

            console.log('consumer opened', this.uuid);
            that.send('MIXER_OPEN');
            that.isMixerReady = true;
            that.controller.onReady();
            return that.mixer.ready(true);

        }).catch(e => {
            console.error("consumer failed to open mixer", e);
            that.remembered = false;
            that.send('ERROR', e);
            that.close('open exception', true);
        });
    }

    /** Sends an event */
    send(event, payload = null) {
        //TODO: Queue Events
        if (!this.ws) return false;
        return this.ws.send(JSON.stringify({ 
            e: event, 
            p: payload, 
            n: this.nonce++ 
        }));
    }

    /** fetches a mixer endpoint */
    async mixerResource(verb, endpoint, payload = null) {
        let response = await fetch(`${MIXER_API}${endpoint}`, {
            method: verb,
            body: payload ? JSON.stringify(payload) : null,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.tokens.accessToken}`
            }
        });

        return await response.json();
    }
}