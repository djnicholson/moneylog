let authentication = undefined;
let connections = undefined;
let scraper = undefined;
let ipcMain = undefined;
let mainWindow = undefined;

const send = function(event, args) {
    if (mainWindow && mainWindow.webContents) {
        mainWindow.webContents.send(event, args);
    }
};

module.exports = {

    init: function(ipcMainRef, mainWindowRef, authenticationRef, connectionsRef, scraperRef) {
        ipcMain = ipcMainRef;
        mainWindow = mainWindowRef;
        authentication = authenticationRef;
        connections = connectionsRef;
        scraper = scraperRef;

        ipcMain.on("authentication-start", authentication.startAuthentication);
        ipcMain.on("authentication-query", event => { event.returnValue = authentication.queryAuthenticationState() });
        ipcMain.on("authentication-signout", authentication.signOut);

        ipcMain.on("connections-save", (_, connection) => connections.save(connection));

        ipcMain.on("scraper-close", (_, id) => scraper.closeWindow(id));
        ipcMain.on("scraper-open", (event, url) => { event.returnValue = scraper.newWindow(url); });
        ipcMain.on("scraper-recipe", (_, params) => scraper.runRecipe(params.id, params.recipe));
    },

    scraperClosed: function(id) { send("scraper-closed", id); },

    scraperData: function(id, data) { send("scraper-data", { id: id, data: data }); },

    scraperResult: function(id, result) { send("scraper-result", { id: id, result: result }); },

    setAuthenticationStatus: function(status) { send("authentication-set", status); },

};
