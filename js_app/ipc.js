let authentication = undefined;
let scraper = undefined;
let ipcMain = undefined;
let mainWindow = undefined;

module.exports = {

    init: function(ipcMainRef, mainWindowRef, authenticationRef, scraperRef) {
        ipcMain = ipcMainRef;
        mainWindow = mainWindowRef;
        authentication = authenticationRef;
        scraper = scraperRef;

        ipcMain.on("authentication-start", authentication.startAuthentication);
        ipcMain.on("authentication-query", authentication.queryAuthenticationState);
        ipcMain.on("authentication-signout", authentication.signOut);

        ipcMain.on("scraper-close", (_, id) => scraper.closeWindow(id));
        ipcMain.on("scraper-open", (event, url) => { event.returnValue = scraper.newWindow(url); });
    },

    scraperClosed: function(id) { mainWindow.webContents.send("scraper-closed", id); },

    scraperData: function(id, data) { mainWindow.webContents.send("scraper-data", { id: id, data: data }); },

    setAuthenticationStatus: function(status) { mainWindow.webContents.send("authentication-set", status); },

};
