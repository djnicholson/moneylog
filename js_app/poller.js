const CONNECTION_POLLING_INTERVAL_MINUTES = 10; // Look for new connections once every 10 minutes
const CONNECTION_POLLING_INTERVAL_MS = 1000 * 60 * CONNECTION_POLLING_INTERVAL_MINUTES;
const QUEUE_EVALUATION_INTERVAL_MS = 5000;
const POLL_INTERVAL_MINUTES = 180; // Poll each connection once per 3 hours
const POLL_INTERVAL_MS = 1000 * 60 * POLL_INTERVAL_MINUTES;
const RUN_NOW = 0;
const POLLER_FOLDER = "poller/";
const MAX_CONSECUTIVE_FAILS = 3; // Repeat failed scrapes 3 times in a row (delaying CONNECTION_POLLING_INTERVAL in-between attempts)

let authentication = undefined;
let connections = undefined;
let scraper = undefined;

const Poller = function() {
    this.lastSnapshot = undefined;
    this.nextSnapshot = undefined;
    this.pollQueue = [];
    this.enumerateConnectionsTimer = undefined;
    this.workQueueTimer = undefined;

    this.enumerateConnections = function() {
        this.enumerateConnectionsInner().then(() => {
            this.enumerateConnectionsTimer = setTimeout(
                this.enumerateConnections.bind(this),
                CONNECTION_POLLING_INTERVAL_MS);
        });
    };

    this.enumerateConnectionsInner = function() {
        this.nextSnapshot = [];
        return connections.listConnections(connection => {
            this.nextSnapshot.push(connection);
            this.pollQueue.push(connection);
        }).then(count => {
            this.lastSnapshot = this.nextSnapshot;
            this.nextSnapshot = undefined;
        }).catch(e => {
            console.log("Error while enumerating connections", e);
            this.nextSnapshot = undefined;
        });
    };

    this.getConnections = function() {
        return this.lastSnapshot;
    };

    this.operateOnState = function(callback) {
        const stateFile = POLLER_FOLDER + "state.json";
        return authentication.getFile(stateFile).then(initialStateJson => {
            initialStateJson = initialStateJson || "{}";
            const state = JSON.parse(initialStateJson);
            return callback.bind(this)(state).then(() => {
                const newStateJson = JSON.stringify(state);
                if (newStateJson != initialStateJson) {
                    console.log("Upading poller state", state);
                    return authentication.putFile(stateFile, newStateJson);
                } else {
                    return Promise.resolve();
                }
            });
        });
    };

    this.pollFromQueue = function() {
        this.pollFromQueueInner().then(() => {
            this.workQueueTimer = setTimeout(
                this.pollFromQueue.bind(this),
                QUEUE_EVALUATION_INTERVAL_MS);
        });
    };

    this.pollFromQueueInner = function() {
        if (this.pollQueue.length > 0) {
            const connection = this.pollQueue.pop();
            return this.operateOnState(state => {
                state[connection.file] = state[connection.file] || { lastSuccess: 0, lastFail: 0, result: undefined, failCount: 0 };
                if (shouldPoll(state[connection.file], connection)) {
                    return pollConnection(connection, /*hidden*/ true).then(result => {
                        if (!result) {
                            throw Error("No result extracted by scraper");
                        }

                        state[connection.file].lastSuccess = (new Date).getTime();
                        state[connection.file].result = result;
                        state[connection.file].failCount = 0;
                    }).catch(e => {
                        console.log("Error polling", connection.file, connection.accountName, e);
                        state[connection.file].lastFail = (new Date).getTime();
                        state[connection.file].failCount++;
                    });
                } else {
                    console.log("Skipping poll of", connection.file);
                    return Promise.resolve();
                }
            });
        } else {
            return Promise.resolve();
        }
    };

    this.stop = function() {
        this.enumerateConnectionsTimer && clearTimeout(this.enumerateConnectionsTimer);
        this.workQueueTimer && clearTimeout(this.workQueueTimer);
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
        return result;
    });
};

const shouldPoll = function(state, connection) {
    const currentTime = (new Date).getTime();
    if ((state.lastFail > state.lastSuccess) && (state.failCount < MAX_CONSECUTIVE_FAILS)) {
        return true;
    } else {
        return (Math.max(state.lastSuccess, state.lastFail) + POLL_INTERVAL_MS) < currentTime;
    }
};

module.exports = {

    Poller: Poller,

    init: function(authenticationRef, connectionsRef, scraperRef) {
        authentication = authenticationRef;
        connections = connectionsRef;
        scraper = scraperRef;
    },

};
