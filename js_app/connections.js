const CONNECTIONS_FOLDER = "connections_v3/";
const DATA_FOLDER = "data_v3/";

let authentication = undefined;

const Connection = function(metadata) {
    this.metadata = metadata;

    this.supplyData = function(timestamp, value) {
        const dataFile = DATA_FOLDER + this.metadata.filename;
        return authentication.getFile(dataFile).then(allDataJson => {
            allDataJson = allDataJson || "{}";
            allData = JSON.parse(allDataJson);
            allData.file = file;
            allData.readings = allData.readings || [];
            allData.readings.push([ Math.round(timestamp / 1000), value ]);
            allData.readings.sort((a, b) => a[0] - b[0]);
            allDataJson = JSON.stringify(allData);
            console.log("Updating", dataFile, allData);
            return authentication.putFile(dataFile, allDataJson);
        });
    };
};

module.exports = {

    init: function(authenticationRef) {
        authentication = authenticationRef;
    },

    /**
     * Calls the provided callback on every saved connection object. Returns a promise that resolves
     * once all callbacks have been invoked. The promise resolves to a number indicating how many 
     * callback invocations took place.
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
                    authentication.getFile(filename).then(filedata => callback(new Connection(JSON.parse(filedata)))));
            }

            return true;
        }).then(() => {
            return Promise.all(allCallbacks).then(() => Promise.resolve(allCallbacks.length));
        });
    },

    save: function(connection) {
        connection.filename = connection.filename.replace(/[^-a-zA-Z0-9.]+/g, "-");
        return authentication.putFile(
            CONNECTIONS_FOLDER + connection.filename,
            JSON.stringify(connection)).then(() => {
                console.log("Saved connection", connection.filename);
            }).catch(() => {
                console.log("Failed to save connection", connection.filename, connection.script);
            });
    },

};
