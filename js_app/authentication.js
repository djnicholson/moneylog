const blockstack = require('blockstack');
const { LocalStorage } = require('node-localstorage');

const REQUIRED_PERMISSIONS = ["store_write", "publish_data"];
const LOGIN_WINDOW_WIDTH = 700;
const LOGIN_WINDOW_HEIGHT = 800;
const APP_DOMAIN = "https://moneylog.app";
const MANIFEST_URL = APP_DOMAIN + "/manifest.json"; // Hosted from: https://github.com/djnicholson/moneylog.app/blob/master/manifest.json
const CALLBACK_URL = APP_DOMAIN + "/auth-intercept";

let BrowserWindow = undefined;
let ipc = undefined;
let loginWindow = undefined;

// Hack to allow Blockstack code to directly use global references to localStorage:
const localStorage = new LocalStorage("./localstorage_authentication");
global.window = { localStorage: localStorage };
global.localStorage = localStorage;

const processAuthenticationResponse = function(authResponseToken) {
    blockstack.handlePendingSignIn("", authResponseToken).then(profile => {
        console.log("Logged in", profile.username);
        setAuthenticationStatus();
    }).catch(error => {
        console.error("Error processing authentication", error);
        setAuthenticationStatus();
    });
};

const setAuthenticationStatus = function() {
    ipc.setAuthenticationStatus(blockstack.isUserSignedIn() ? blockstack.loadUserData() : undefined);
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

    init: function(BrowserWindowRef, session, ipcRef) {
        BrowserWindow = BrowserWindowRef;
        ipc = ipcRef;
        
        session.defaultSession.webRequest.onBeforeRequest({ urls: [ CALLBACK_URL + '*' ] }, function(details, callback) {
            var authResponseToken = details.url.split("authResponse=")[1].split("&")[0];
            callback({ cancel: true });
            loginWindow && loginWindow.hide();
            loginWindow = undefined;
            processAuthenticationResponse(authResponseToken);
        });
    },

    queryAuthenticationState: function() {
        setAuthenticationStatus();
    },

    startAuthentication: function() {
        console.log("Authentication requested");
        const transitKey = blockstack.generateAndStoreTransitKey();
        const authRequest = blockstack.makeAuthRequest(transitKey, CALLBACK_URL, MANIFEST_URL, REQUIRED_PERMISSIONS, APP_DOMAIN);
        const authUrl = "https://browser.blockstack.org/auth?authRequest=" + encodeURIComponent(authRequest);
        showLoginWindow(authUrl);
    },

};
