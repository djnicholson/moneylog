const CONNECTIONS_FOLDER = "connections/";

let authentication = undefined;

module.exports = {

    init: function(authenticationRef) {
        authentication = authenticationRef;
    },

    /**
     * Calls the provided  callback on every saved connection object. Returns a promise that resolves
     * once all callbacks have been invoked. The promise resolves to a number indicating how many 
     * callback invocatons took place.
     */
    listConnections: function(callback) {
        if (!authentication.isAuthenticated()) {
            console.log("Attempted to list connections when unauthenticated");
            return Promise.resolve(0);
        }

        let allCallbacks = [];
        return authentication.listFiles(filename => {
            if (filename.startsWith(CONNECTIONS_FOLDER)) {
                allCallbacks.push(
                    authentication.getFile(filename).then(filedata => callback(JSON.parse(filedata))));
            }

            return true;
        }).then(() => {
            return Promise.all(allCallbacks).then(() => Promise.resolve(allCallbacks.length));
        });
    },

    save: function(connection) {
        connection.file = connection.file.replace(/[^-a-zA-Z0-9.]/, "-");
        return authentication.putFile(
            CONNECTIONS_FOLDER + connection.file,
            JSON.stringify(connection)).then(() => {
                console.log("Saved connection", connection);
            }).catch(() => {
                console.log("Failed to save connection", connection);
            });
    },

};
