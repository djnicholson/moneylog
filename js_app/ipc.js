let authentication = undefined;
let ipcMain = undefined;
let mainWindow = undefined;

module.exports = {

    init: function(ipcMainRef, mainWindowRef, authenticationRef) {
        ipcMain = ipcMainRef;
        mainWindow = mainWindowRef;
        authentication = authenticationRef;

        ipcMain.on("authentication-start", authentication.startAuthentication);
        ipcMain.on("authentication-query", authentication.queryAuthenticationState);
        ipcMain.on("authentication-signout", authentication.signOut);
    },

    setAuthenticationStatus: function(status) {
        mainWindow.webContents.send("authentication-set", status)
    },

};
