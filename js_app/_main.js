const path = require("path")
const { app, session, BrowserWindow, ipcMain } = require("electron");
const moneylogapp = require("./_moneylogapp");

app.on("ready", function() {
    let win = new BrowserWindow({ 
        width: 1024, 
        height: 768, 
        webPreferences: { 
            nodeIntegration: false, // only preload script can use Node
            contextIsolation: false, // preload needs to share window object with rendered page
            preload: path.join(__dirname, "../js_ipc/ipc.js"),
        },
    });

    win.loadFile(path.join(__dirname, "../html/index.html"));

    win.on("closed", () => {
        win = null;
    });

    moneylogapp.ipc.init(ipcMain, win, moneylogapp.authentication);
    moneylogapp.authentication.init(BrowserWindow, session, moneylogapp.ipc);
});

app.on("window-all-closed", app.quit);


