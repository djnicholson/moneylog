const CONNECTION_POLLING_INTERVAL_MINUTES = 10;
const CONNECTION_POLLING_INTERVAL_MS = 1000 * 60 * CONNECTION_POLLING_INTERVAL_MINUTES;
const QUEUE_EVALUATION_INTERVAL_MS = 5000;
const RUN_NOW = 0;

let connections = undefined;
let scraper = undefined;

let lastSnapshot = undefined;
let nextSnapshot = undefined;

let pollQueue = [];

const pollConnection = function(connection, hidden) {
    console.log("Polling", connection.file, connection.accountName);
    const scraperId = scraper.newWindow(connection.url, hidden);
    return scraper.runRecipe(scraperId, connection.recipe, /*closeAfterSuccess*/ true).then(result => {
        console.log("Polling", connection.file, connection.accountName, "result", result);
    });
}

const pollFromQueue = function() {
    if (pollQueue.length > 0) {
        const connection = pollQueue.pop();
        pollConnection(connection, /*hidden*/ true).then(() => {
            setTimeout(pollFromQueue, QUEUE_EVALUATION_INTERVAL_MS);    
        }).catch(e => {
            console.log("Error polling", connection.file, connection.accountName, e);
            setTimeout(pollFromQueue, QUEUE_EVALUATION_INTERVAL_MS);    
        });
    } else {
        setTimeout(pollFromQueue, QUEUE_EVALUATION_INTERVAL_MS);
    }
};

const shouldPoll = function(connection) {
    //
    // TODO
    //

    return true;
};

const startSnapshot = function() {
    console.log("Poller is starting a new connection snapshot");
    nextSnapshot = [];
    connections.listConnections(connection => {
        console.log("Poller connection snapshot received: ", connection.file, connection.accountName);
        nextSnapshot.push(connection);
        if (shouldPoll(connection)) {
            pollQueue.push(connection);
        }
    }).then(count => {
        console.log("Poller connection snapshot complete, connections: ", count);
        lastSnapshot = nextSnapshot;
        nextSnapshot = undefined;
        setTimeout(startSnapshot, CONNECTION_POLLING_INTERVAL_MS);
    }).catch(e => {
        console.log("Error while enumerating connections", e);
        nextSnapshot = undefined;
        setTimeout(startSnapshot, CONNECTION_POLLING_INTERVAL_MS);
    });
};

module.exports = {

    getConnections: function() {
        return lastSnapshot;
    },

    init: function(connectionsRef, scraperRef) {
        connections = connectionsRef;
        scraper = scraperRef;
        setTimeout(startSnapshot, RUN_NOW);
        setTimeout(pollFromQueue, RUN_NOW);
    },

};
