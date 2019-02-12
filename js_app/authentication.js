const blockstack = require('blockstack');
const { LocalStorage } = require('node-localstorage');

const REQUIRED_PERMISSIONS = ["store_write", "publish_data"];
const LOGIN_WINDOW_WIDTH = 700;
const LOGIN_WINDOW_HEIGHT = 800;
const APP_DOMAIN = "https://moneylog.app";
const MANIFEST_URL = APP_DOMAIN + "/manifest.json"; // Hosted from: https://github.com/djnicholson/moneylog.app/blob/master/manifest.json
const CALLBACK_URL = APP_DOMAIN + "/auth-intercept";

let BrowserWindow = undefined;
let app = undefined;
let ipc = undefined;
let loginWindow = undefined;
let data = undefined;
let poller = undefined;

let userState = {};

// Hack to allow Blockstack code to directly use global references to localStorage:
const localStorage = new LocalStorage("./localstorage_authentication");
const location = { origin: "https://moneylog.app" };
global.window = { 
    localStorage: localStorage, 
    location: location, 
};
global.localStorage = localStorage;
global.location = location;

const currentAuthenticationStatus = function() {
    return blockstack.isUserSignedIn() ? blockstack.loadUserData() : undefined;
};

const isAuthenticated = function() {
    return blockstack.isUserSignedIn();
};

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
    ipc.setAuthenticationStatus(currentAuthenticationStatus());

    if (userState && userState.poller) {
        userState.poller.stop();
        userState = undefined;
    }

    if (isAuthenticated()) {
        const dataAccessor = new data.DataAccessor();
        userState = {
            dataAccessor: dataAccessor,
            poller: new poller.Poller(dataAccessor),
        };
    }
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

    getFile: blockstack.getFile,

    getDataAccessor: function() {
        return userState && userState.dataAccessor;
    },

    getPoller: function() {
        return userState && userState.poller;
    },

    init: function(BrowserWindowRef, session, appRef, ipcRef, dataRef, pollerRef) {
        BrowserWindow = BrowserWindowRef;
        app = appRef;
        ipc = ipcRef;
        data = dataRef;
        poller = pollerRef;
        
        session.defaultSession.webRequest.onBeforeRequest({ urls: [ CALLBACK_URL + '*' ] }, function(details, callback) {
            var authResponseToken = details.url.split("authResponse=")[1].split("&")[0];
            callback({ cancel: true });
            processAuthenticationResponse(authResponseToken);
            loginWindow && loginWindow.hide();
            loginWindow = undefined;
        });

        setAuthenticationStatus();
    },

    isAuthenticated: isAuthenticated,

    listFiles: blockstack.listFiles,

    putFile: blockstack.putFile,

    queryAuthenticationState: function() {
        return currentAuthenticationStatus();
    },

    signOut: function() {
        blockstack.signUserOut();
        
        // Exit the app after a user signs out. This is an easy way of making sure that state doesn't
        // leak between users GAIA storage when one user signs out and a different user signs in.
        app.quit();
    },

    startAuthentication: function() {
        console.log("Authentication requested");
        const transitKey = blockstack.generateAndStoreTransitKey();
        const authRequest = blockstack.makeAuthRequest(transitKey, CALLBACK_URL, MANIFEST_URL, REQUIRED_PERMISSIONS, APP_DOMAIN);
        const authUrl = "https://browser.blockstack.org/auth?authRequest=" + encodeURIComponent(authRequest);
        showLoginWindow(authUrl);
    },

};
