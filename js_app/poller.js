const CONNECTION_POLLING_INTERVAL_MINUTES = 10;
const CONNECTION_POLLING_INTERVAL_MS = 1000 * 60 * CONNECTION_POLLING_INTERVAL_MINUTES;
const QUEUE_EVALUATION_INTERVAL_MS = 5000;
const RUN_NOW = 0;

let connections = undefined;
let scraper = undefined;

const Poller = function() {
    this.lastSnapshot = undefined;
    this.nextSnapshot = undefined;
    this.state = undefined;
    this.pollQueue = [];
    this.enumerateConnectionsTimer = undefined;
    this.workQueueTimer = undefined;
    this.shouldStop = false;

    this.stop = function() {
        this.shouldStop = true;
        this.enumerateConnectionsTimer && clearTimeout(this.enumerateConnectionsTimer);
        this.workQueueTimer && clearTimeout(this.workQueueTimer);
    };

    this.enumerateConnections = function() {
        if (!this.shouldStop) {
            this.nextSnapshot = [];
            connections.listConnections(connection => {
                this.nextSnapshot.push(connection);
                if (shouldPoll(connection)) {
                    this.pollQueue.push(connection);
                }
            }).then(count => {
                this.lastSnapshot = this.nextSnapshot;
                this.nextSnapshot = undefined;
                this.enumerateConnectionsTimer = setTimeout(
                    this.enumerateConnections.bind(this),
                    CONNECTION_POLLING_INTERVAL_MS);
            }).catch(e => {
                console.log("Error while enumerating connections", e);
                this.nextSnapshot = undefined;
                this.enumerateConnectionsTimer = setTimeout(
                    this.enumerateConnections.bind(this),
                    CONNECTION_POLLING_INTERVAL_MS);
            });
        }
    };

    this.pollFromQueue = function() {
        if (!this.shouldStop) {
            if (this.pollQueue.length > 0) {
                const connection = this.pollQueue.pop();
                pollConnection(connection, /*hidden*/ true).then(() => {
                    this.workQueueTimer = setTimeout(
                        this.pollFromQueue.bind(this),
                        QUEUE_EVALUATION_INTERVAL_MS);
                }).catch(e => {
                    console.log("Error polling", connection.file, connection.accountName, e);
                    this.workQueueTimer = setTimeout(
                        this.pollFromQueue.bind(this),
                        QUEUE_EVALUATION_INTERVAL_MS);
                });
            } else {
                this.workQueueTimer = setTimeout(
                    this.pollFromQueue.bind(this),
                    QUEUE_EVALUATION_INTERVAL_MS);
            }
        }
    };

    this.enumerateConnectionsTimer = setTimeout(
        this.enumerateConnections.bind(this),
        RUN_NOW);

    this.workQueueTimer = setTimeout(
        this.pollFromQueue.bind(this),
        RUN_NOW);
};

const pollConnection = function(connection, hidden) {
    console.log("Polling", connection.file, connection.accountName);
    const scraperId = scraper.newWindow(connection.url, hidden);
    return scraper.runRecipe(scraperId, connection.recipe, /*closeAfterSuccess*/ true).then(result => {
        console.log("Polling", connection.file, connection.accountName, "result", result);
    });
};

const shouldPoll = function(connection) {
    //
    // TODO
    //

    return true;
};

module.exports = {

    Poller: Poller,

    init: function(connectionsRef, scraperRef) {
        connections = connectionsRef;
        scraper = scraperRef;
    },

};
