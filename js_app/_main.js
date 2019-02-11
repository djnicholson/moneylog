const path = require("path")
const { app, session, BrowserWindow, ipcMain } = require("electron");
const moneylogapp = require("./_moneylogapp");

app.on("ready", function() {
    let win = new BrowserWindow({ 
        width: 1024, 
        height: 768, 
        x: 50,
        y: 50,
        webPreferences: { 
            nodeIntegration: false, // only preload script can use Node
            contextIsolation: false, // preload needs to share window object with rendered page
            preload: path.join(__dirname, "../js_ipc/ipc.js"),
        },
    });

    win.on("closed", () => {
        win = null;
    });

    moneylogapp.authentication.init(BrowserWindow, session, moneylogapp.ipc);
    moneylogapp.connections.init(moneylogapp.authentication);
    moneylogapp.ipc.init(ipcMain, win, moneylogapp.authentication, moneylogapp.connections, moneylogapp.scraper);
    moneylogapp.scraper.init(BrowserWindow, win, session, moneylogapp.ipc);

    const initialUrl = moneylogapp.authentication.isAuthenticated() ? "../html/home.html" : "../html/index.html";
    win.loadFile(path.join(__dirname, initialUrl));
});

app.on("window-all-closed", app.quit);


