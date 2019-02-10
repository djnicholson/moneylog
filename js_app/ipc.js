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
        ipcMain.on("scraper-recipe", (_, params) => scraper.runRecipe(params.id, params.recipe));
    },

    scraperClosed: function(id) { mainWindow.webContents.send("scraper-closed", id); },

    scraperData: function(id, data) { mainWindow.webContents.send("scraper-data", { id: id, data: data }); },

    scraperResult: function(id, result) { mainWindow.webContents.send("scraper-result", { id: id, result: result }); },

    setAuthenticationStatus: function(status) { mainWindow.webContents.send("authentication-set", status); },

};
