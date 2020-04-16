
module.exports = class MixController {
    constructor(consumer) {
        this.consumer = consumer;
        this.uuid = consumer.uuid;
        this.mixer = consumer.mixer;
        this.scenes = null;
        this.time = 0;
    }

    /** Sets the mixer instance */
    setMixer(mixer) { 
        this.mixer = mixer;
    }

    /** Ready to actually do mix stuff */
    async onReady() {
        this.scenes = await this.mixer.synchronizeScenes();
        this.time   = await this.mixer.getTime();
        
        console.log(this.uuid, "scenes", this.scenes);
        console.log(this.uuid, "time", this.time);

        //Execute regular ready
        this.send('PREREADY');
        this.ready();
        
        //We are fully ready
        this.send('READY', {});
    }

    /** Executed once everything is setup */
    ready() {}

    /** Called when closed */
    onClose(reason, hard) { }

    /** Called when there is a message from the client  */
    onMessage(message) {  }

    /** Sends a payload */
    send(event, payload = null) {
        this.consumer.send("PLAY_" + event, payload);
    }
}