const SCRAPER_WINDOW_WIDTH = 1280;
const SCRAPER_WINDOW_HEIGHT = 1024;

let BrowserWindow = undefined;
let ipc = undefined;

let nextId = 0;
let allWindows = { };

const closeWindow = function(id) {
    var targetWindow = allWindows[id];
    if (targetWindow) {
        try {
            targetWindow.hide();
        } catch(e) {
        }

        delete allWindows[id];
        ipc.scraperClosed(id);
    }
};

module.exports = {

    closeWindow: closeWindow,

    init: function(BrowserWindowRef, session, ipcRef) {
        BrowserWindow = BrowserWindowRef;
        ipc = ipcRef;

        // Spoof User-Agent to look like a regular web browser:
        session.defaultSession.webRequest.onBeforeSendHeaders(function(details, callback) {
            details.requestHeaders['User-Agent'] = details.requestHeaders['User-Agent']
                .replace(/ Electron\/[.0-9]+/, "")
                .replace(/ moneylog\/[.0-9]+/, "");
            callback({ cancel: false, requestHeaders: details.requestHeaders });
        });
    },

    newWindow: function(url) {
        let thisId = nextId++;

        let newWindow = new BrowserWindow({ 
            width: SCRAPER_WINDOW_WIDTH, 
            height: SCRAPER_WINDOW_HEIGHT, 
            webPreferences: { nodeIntegration: false },
        });

        allWindows[thisId] = newWindow;

        newWindow.on("closed", () => {
            closeWindow(thisId);
        });

        newWindow.webContents.on('new-window', function(e, popupUrl) {
            console.log("Prenting popup to", popupUrl, "requested by", url);
            e.preventDefault();
        });

        newWindow.loadURL(url);

        return thisId;
    },

};
