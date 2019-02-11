const CONNECTIONS_FOLDER = "connections/";

let authentication = undefined;

module.exports = {

    init: function(authenticationRef) {
        authentication = authenticationRef;
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
