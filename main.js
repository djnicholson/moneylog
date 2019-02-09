const path = require('path')
const { app, session, BrowserWindow, ipcMain, shell, protocol } = require('electron');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;

var createWindow = function() {
    
    win = new BrowserWindow({ 
        width: 1024, 
        height: 768, 
        webPreferences: { 
            nodeIntegration: false, // only preload script can use Node
            contextIsolation: false, // preload needs to share window object with rendered page
            preload: path.join(__dirname, "ipc.js"),
        },
    });

    win.loadFile('index.html');

    win.on('closed', () => {
        win = null;
    });
};

app.on('ready', createWindow);

app.on('ready', () => {
    protocol.registerFileProtocol("moneylog", (req, cb) => {
        console.log(req);
    });
});

app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
        createWindow();
    }
});

ipcMain.on('open-browser', (_, url) => {
   shell.openExternal(url);
   win.webContents.send('pong', 'hi');
});


