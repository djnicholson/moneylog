//
// This JavaScript runs as a preload script for a BrowserWindow. It can 
// still use Node and also access the window object in a rendered page.
//

const { ipcRenderer } = require('electron');

(window.moneylog = window.moneylog || {}).ipc = (function(){

    var send = ipcRenderer.send;
    var sendSync = ipcRenderer.sendSync;

    return {

        on: function(eventName, handler) {
            ipcRenderer.on(eventName, handler);
        },

        authenticationQueryConnections: function() { return sendSync("authentication-query-connections", ""); },

        authenticationRefreshConnections: function() { send("authentication-refresh-connections", ""); },

        queryAuthenticationState: function() { return sendSync("authentication-query", ""); },

        runnerTest: function(model, newSession) { send("runner-test", { model: model, newSession: newSession }) },

        saveConnection: function(connection) { send("connections-save", connection); },

        signOut: function() { send("authentication-signout", ""); },

        startAuthentication: function() { send("authentication-start", ""); },

    };

})();
