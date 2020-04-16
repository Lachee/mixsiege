const MixController = require('./MixController');
module.exports = class BasicController extends MixController {
    async ready() {
        const self = this;
        let scene = this.scenes[0];
        let controls = scene.getControls();
        for(let index in controls) {

            //Get the control and the base emit
            let control = controls[index];
            let base = control.emit;
            if (base != null) {

                //Hook into the emit
                control.emit = function(event, ...args) { 
                    self.send('EVENT_CONTROL', {
                        event: event,
                        args: args,
                        control: {
                            controlID:  control.controlID,
                            disabled:   control.disabled,
                            kind:       control.kind,
                            meta:       control.meta,
                            position:   control.position,
                            cost:       control.cost,
                            text:       control.text,
                        },
                    }); 
                };
            }
        }
    }
}