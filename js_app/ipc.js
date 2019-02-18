let authentication = undefined;
let connections = undefined;
let runner = undefined;
let ipcMain = undefined;
let mainWindow = undefined;

const send = function(event, args) {
    if (mainWindow && mainWindow.webContents) {
        mainWindow.webContents.send(event, args);
    }
};

module.exports = {

    init: function(ipcMainRef, mainWindowRef, authenticationRef, connectionsRef, runnerRef) {
        ipcMain = ipcMainRef;
        mainWindow = mainWindowRef;
        authentication = authenticationRef;
        connections = connectionsRef;
        runner = runnerRef;

        ipcMain.on("authentication-start", authentication.startAuthentication);
        ipcMain.on("authentication-query", event => { event.returnValue = authentication.queryAuthenticationState() });
        ipcMain.on("authentication-query-connections", event => { event.returnValue = authentication.queryConnections() });
        ipcMain.on("authentication-signout", authentication.signOut);

        ipcMain.on("connections-save", (_, connection) => connections.save(connection));

        ipcMain.on("runner-test", (_, params) => runner.test(params.model, params.newSession));
    },

    pollerConnections: function(connections) { send("poller-connections", connections); },

    runnerResult: function(result) { send("runner-result", result); },

    setAuthenticationStatus: function(status) { send("authentication-set", status); },

};
