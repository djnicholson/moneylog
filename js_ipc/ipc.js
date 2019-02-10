//
// This JavaScript runs as a preload script for a BrowserWindow. It can 
// still use Node and also access the window object in a rendered page.
//

const { ipcRenderer } = require('electron');

(window.moneylog = window.moneylog || {}).ipc = (function(){

    var send = ipcRenderer.send;
    var sendSync = ipcRenderer.sendSync;

    return {

        closeScraper: function(scraperId) { send("scraper-close", scraperId); },

        on: function(eventName, handler) {
            ipcRenderer.on(eventName, handler);
        },

        openScraper: function(url) { return sendSync("scraper-open", url); },

        queryAuthenticationState: function() { send("authentication-query", ""); },

        scraperExtractNumbers: function(scraperId) { return sendSync("scraper-extract-numbers", scraperId); },

        signOut: function() { send("authentication-signout", ""); },

        startAuthentication: function() { send("authentication-start", ""); },

    };

})();
