const SCRAPER_WINDOW_WIDTH = 800;
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
    }
};

module.exports = {

    closeWindow: closeWindow,

    init: function(BrowserWindowRef, ipcRef) {
        BrowserWindow = BrowserWindowRef;
        ipc = ipcRef;
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

        newWindow.loadURL(url);

        return thisId;
    },

};
