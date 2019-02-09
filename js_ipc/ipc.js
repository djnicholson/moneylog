//
// This JavaScript runs as a preload script for a BrowserWindow. It can 
// still use Node and also access the window object in a rendered page.
//

const { ipcRenderer } = require('electron');

(window.moneylog = window.moneylog || {}).ipc = (function(){

    var send = ipcRenderer.send;

    return {

        on: function(eventName, handler) {
            ipcRenderer.on(eventName, handler);
        },

        queryAuthenticationState: function() { send("query-authentication-state", ""); },

        startAuthentication: function() { send("authentication-start", ""); },

    };

})();
