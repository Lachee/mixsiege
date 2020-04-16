import EventEmitter from 'eventemitter3';

export class Mixer extends EventEmitter {
    constructor(host) {
        super();
        this.secure = true;
        this.protocol = 'wss:';
        this.port = 80;
        this.host = host;

        if (!this.host) {
            this.secure     = location.protocol == 'https:';
            this.protocol   = this.secure ? 'wss:' : 'ws:';
            this.port       = location.port || 80;
            this.host       = `${this.protocol}//${location.hostname}:${this.port}/`;
        }

        this.ws = new WebSocket(this.host);
        this.ws.addEventListener('open', (e) => {
            this.emit('open', e);
        });
        this.ws.addEventListener('close', (e) => {
            this.emit('close', e);
        });
    }
}