const path = require("path")
const { app, session, BrowserWindow, ipcMain } = require("electron");
const moneylogapp = require("./_moneylogapp");

app.on("ready", function() {
    const win = new BrowserWindow({ 
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

    // Keep window on top of puppeteer window whilst editing scripts:
    win.webContents.on("will-navigate", (event, url) => win.setAlwaysOnTop(url.endsWith("/editconnection.html")));

    moneylogapp.authentication.init(BrowserWindow, session, app, moneylogapp.ipc, moneylogapp.data, moneylogapp.poller);
    moneylogapp.connections.init(moneylogapp.authentication);
    moneylogapp.data.init(moneylogapp.authentication);
    moneylogapp.ipc.init(ipcMain, win, moneylogapp.authentication, moneylogapp.connections, moneylogapp.runner, moneylogapp.scraper);
    moneylogapp.poller.init(moneylogapp.authentication, moneylogapp.connections, moneylogapp.scraper);
    moneylogapp.runner.init(moneylogapp.ipc);
    moneylogapp.scraper.init(BrowserWindow, win, session, moneylogapp.ipc);

    const initialUrl = moneylogapp.authentication.isAuthenticated() ? "../html/home.html" : "../html/index.html";
    win.loadFile(path.join(__dirname, initialUrl));
});

app.on("window-all-closed", app.quit);
