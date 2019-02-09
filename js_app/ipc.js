let authentication = undefined;
let ipcMain = undefined;
let mainWindow = undefined;

module.exports = {

    init: function(ipcMainRef, mainWindowRef, authenticationRef) {
        ipcMain = ipcMainRef;
        mainWindow = mainWindowRef;
        authentication = authenticationRef;

        ipcMain.on("authentication-start", authentication.startAuthentication);
        ipcMain.on("query-authentication-state", authentication.queryAuthenticationState);
    },

    setAuthenticationStatus: function(status) {
        mainWindow.webContents.send("set-authentication-state", status)
    },

};
