//
// This JavaScript runs as a preload script for a BrowserWindow. It can 
// still use Node and also access the window object in a rendered page.
//

const { ipcRenderer } = require('electron');

(window.moneylog = window.moneylog || {}).ipc = (function(){

    var send = ipcRenderer.send;

    var handlePong = function(event, message) {
        console.log("IPC message", event, message);
    };

    ipcRenderer.on("pong", handlePong);

    debugger;

    return {

        openBrowser: function(url) {
            send("open-browser", url);
        },

    };

})();
