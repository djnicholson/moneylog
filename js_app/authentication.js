const blockstack = require('blockstack');
const { BrowserWindow } = require("electron");
const { LocalStorage } = require('node-localstorage');

const REQUIRED_PERMISSIONS = ["store_write", "publish_data"];
const LOGIN_WINDOW_WIDTH = 700;
const LOGIN_WINDOW_HEIGHT = 800;

const localStorage = new LocalStorage("./localstorage_authentication");

let loginWindow = undefined;

const ensureTransitKey = function() {
    let transitKey = localStorage.getItem("TRANSIT_KEY");
    if (!transitKey) {
        transitKey = blockstack.makeECPrivateKey();
        localStorage.setItem("TRANSIT_KEY", transitKey);
    }

    return transitKey;
};

const showLoginWindow = function(authUrl) {
    if (!loginWindow) {
        loginWindow = new BrowserWindow({ 
            width: LOGIN_WINDOW_WIDTH, 
            height: LOGIN_WINDOW_HEIGHT, 
            webPreferences: { nodeIntegration: false },
        });

        loginWindow.on("closed", () => {
            loginWindow = null;
        });
    }

    loginWindow.loadURL(authUrl);
    loginWindow.show();
};

module.exports = {

    startAuthentication: function() {
        console.log("Authentication requested");
        const appDomain = "moneylogauth://ml";
        const origin = appDomain + "/callback";
        const manifest = appDomain + "/manifest.json";
        const transitKey = ensureTransitKey();
        const authRequest = blockstack.makeAuthRequest(transitKey, origin, manifest, REQUIRED_PERMISSIONS, appDomain);
        const authUrl = "https://browser.blockstack.org/auth?authRequest=" + encodeURIComponent(authRequest);
        showLoginWindow(authUrl);
    },

};
