import '@fortawesome/fontawesome-pro/js/all';
import './app.scss'

import '../bulma/modal.js';
import { Mixer } from './Mixer.js';
import './oAuthPopup.js';

export let mixer = null;


$().ready(() => { 
    let shortCodeModal = null;
    let oauthWindow = null;
    
    mixer = new Mixer();
    mixer.on('codePending', (e) => {
        if (shortCodeModal == null) {
            shortCodeModal = document.createModal(`
                <section class="hero is-primary">
                <div class="hero-body">
                    <div class="container">
                    <h1 class="title">Mixer Short Code</h1>
                    <h1 class="title"> <input onClick="this.setSelectionRange(0, this.value.length)" name="shortcode" type="text" class="shortcode  has-background-transparent has-text-white" readonly value=". . ."></h1>
                    <br>
                    <h2 class="subtitle">
                        <a href="#" class="button oauth is-centered is-secondary is-large oauth"><span class="icon is-medium"><i class="fab fa-mixer"></i></span><span>mixer.com / go</span></a>
                    </h2>
                    </div>
                </div>
                
                <div class='row'></div>
                </div>
                `, { boxClass: 'has-text-centered is-centered', showClose: false});
            
            //Hook into the button
            $(shortCodeModal).find('.oauth').click((e) => {
                e.preventDefault();
                oauthWindow = window.openOAuthWindow('https://mixer.com/go', { 
                    windowOptions: {
                        center: true,
                        width: 560,
                        height: 600 
                    }
                });
            });

        }

        shortCodeModal.show();
        $(shortCodeModal).find('input[name=shortcode]').val(e.code);
    });

    mixer.on('codeAccepted', (e) => {
        if (oauthWindow) oauthWindow.close();     
        if (shortCodeModal) shortCodeModal.hide();
    });
});

