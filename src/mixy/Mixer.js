import EventEmitter from 'eventemitter3';

export class Mixer extends EventEmitter {

    constructor(host = null) {
        super();
        this.secure = true;
        this.protocol = 'wss:';
        this.port = 80;
        this.host = host;
        this.shortCode = null;

        if (!this.host) {
            this.secure     = location.protocol == 'https:';
            this.protocol   = this.secure ? 'wss:' : 'ws:';
            this.port       = location.port || 80;
            this.host       = `${this.protocol}//${location.hostname}:${this.port}/`;
        }

        setTimeout(() => { this._setupWebsocket(); }, 1000);       
    }
    
    _setupWebsocket() {
        this.log('initializing websocket...');
        this.ws = new WebSocket(this.host);
        this.ws.addEventListener('open', (e) => { this.emit('open', e); });
        this.ws.addEventListener('close', (e) => { this.emit('close', e); });
        this.ws.addEventListener('message', (e) => {
            let data = JSON.parse(e.data);            
            let event = data.e;
            let payload = data.p;
            let nonce = data.n;

            //Emit the event right back
            this.log("event", nonce, event, payload);
            this.emit(event, payload, nonce);

            //Special cases
            switch(event) {
                case 'MIXER_CODE_ACCEPT':
                    this.shortCode = payload;
                    this.emit('codeAccepted', payload);
                    break;

                case 'MIXER_CODE_EXPIRE':
                    this.shortCode = null;
                    this.emit('codeExpired');
                    break;

                case 'MIXER_CODE_WAIT':
                    this.shortCode = payload;
                    this.emit('codePending', payload);
                    break;

                case 'MIXER_OPEN':
                    this.emit('mixerReady');
                    break;

                case 'ERROR':
                    console.error(e);
                    this.emit('error', e);
                    break;

                case 'MC_PREREADY':
                    this.emit('preReady');
                    break;

                case 'MC_READY':
                    this.emit('ready');
                    break;

                default:
                    if (event.startsWith('MC_')) {
                        let name = this._stc(event.substring(3));
                        this.log("controller event", name);
                        this.emit(name, payload, nonce);
                    }
                    break;

            }
        });
    }

    log(msg, ...args) {
        console.log("[mixer]", msg, args);
    }

    _stc(str) {
        return str.replace(
            /([-_][a-z])/g,
            (group) => group.toUpperCase()
                        .replace('-', '')
                        .replace('_', '')
        );
    }
}