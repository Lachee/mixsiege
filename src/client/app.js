import './app.scss'
import { Mixer } from './Mixer.js';

export const mixer = new Mixer(null);
mixer.on('open', (e) => {
    console.log('Opened');
});