window.openOAuthWindow = function(path, options = {})
{
    options.windowName = options.windowName ||  'ConnectWithOAuth'; // should not include space for IE
    options.windowOptions = options.windowOptions || {
        width: 400,
        height: 500,
        left: 250,
        top: 50
    };

    if (options.windowOptions.center){

        const dualScreenLeft = window.screenLeft !==  undefined ? window.screenLeft : window.screenX;
        const dualScreenTop = window.screenTop !==  undefined   ? window.screenTop  : window.screenY;
    
        const width = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
        const height = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;
    
        const w = options.windowOptions.width || 400;
        const h = options.windowOptions.height || 500;
        const systemZoom = width / window.screen.availWidth;
        options.windowOptions.left =  (width - w) / 2 / systemZoom + dualScreenLeft;
        options.windowOptions.top =  (height - h) / 2 / systemZoom + dualScreenTop;        
    }

    options.callback = options.callback || function(){ };
    
    if (!(typeof options.windowOptions === 'string' || options.windowOptions instanceof String)) {
        if (!Array.isArray(options.windowOptions)) {
            let spec = [];
            for(let key in options.windowOptions) {
                let val = options.windowOptions[key];
                spec.push(key + "=" + (val === false ? 0 : (val === true ? 1 : val)));
            }
            options.windowOptions = spec;
        }

        options.windowOptions = options.windowOptions.join(',');
    }

    var that = this;
    console.log('open window', path, options.windowName, options.windowOptions)
    that.oauthWindow = window.open(path, options.windowName, options.windowOptions);
    that.oauthInterval = window.setInterval(function(){
        if (that.oauthWindow.closed) {
            window.clearInterval(that.oauthInterval);
            options.callback();
            that.oauthWindow = null;
        }
    }, 1000);
    return that.oauthWindow;
};