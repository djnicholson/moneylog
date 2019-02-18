const CONNECTION_POLLING_INTERVAL_MINUTES = 10; // Look for new connections once every 10 minutes
const CONNECTION_POLLING_INTERVAL_MS = 1000 * 60 * CONNECTION_POLLING_INTERVAL_MINUTES;
const QUEUE_EVALUATION_INTERVAL_MS = 5000;
const POLL_INTERVAL_MINUTES = 180; // Poll each connection once per 3 hours
const POLL_INTERVAL_MS = 1000 * 60 * POLL_INTERVAL_MINUTES;
const RUN_NOW = 0;
const POLLER_FOLDER = "poller_v3/";
const MAX_CONSECUTIVE_FAILS = 3; // Repeat failed scrapes 3 times in a row (delaying CONNECTION_POLLING_INTERVAL in-between attempts)

let authentication = undefined;
let connections = undefined;
let ipc = undefined;
let runner = undefined;

const Poller = function() {
    let lastState = undefined;
    let lastSnapshot = undefined;
    let nextSnapshot = undefined;
    let pollQueue = [];
    let enumerateConnectionsTimer = undefined;
    let workQueueTimer = undefined;

    const enumerateConnections = function() {
        enumerateConnectionsInner().then(() => {
            ipc.pollerConnections(this.connections());
            enumerateConnectionsTimer = setTimeout(enumerateConnections.bind(this), CONNECTION_POLLING_INTERVAL_MS);
        });
    };

    const enumerateConnectionsInner = function() {
        nextSnapshot = [];
        return connections.listConnections(connection => {
            nextSnapshot.push(connection);
            pollQueue.push(connection);
        }).then(count => {
            lastSnapshot = nextSnapshot;
            nextSnapshot = undefined;
        }).catch(e => {
            console.log("Error while enumerating connections", e);
            nextSnapshot = undefined;
        });
    };

    const operateOnState = function(callback) {
        const stateFile = POLLER_FOLDER + "state.json";
        return authentication.getFile(stateFile).then(initialStateJson => {
            initialStateJson = initialStateJson || "{}";
            const state = JSON.parse(initialStateJson);
            lastState = state;
            return callback.bind(this)(state).then(() => {
                const newStateJson = JSON.stringify(state);
                if (newStateJson != initialStateJson) {
                    console.log("Upading poller state", state);
                    return authentication.putFile(stateFile, newStateJson).then(() => {
                        lastState = state;
                    });
                } else {
                    return Promise.resolve();
                }
            });
        });
    };

    const pollFromQueue = function() {
        pollFromQueueInner().then(() => {
            workQueueTimer = setTimeout(pollFromQueue.bind(this), QUEUE_EVALUATION_INTERVAL_MS);
        });
    };

    const pollFromQueueInner = function() {
        if (pollQueue.length > 0) {
            const connection = pollQueue.pop();
            const filename = connection.metadata.filename;
            return operateOnState(state => {
                state[filename] = state[filename] || { lastSuccess: 0, lastFail: 0, result: undefined, failCount: 0 };
                if (shouldPoll(state[filename])) {
                    return runner.evaluate(connection.metadata).then(result => {
                        if (typeof result != "number") {
                            throw Error("Invalid result extracted by runner: " + result);
                        }

                        const timestamp = (new Date).getTime();
                        return connection.supplyData(timestamp, result).then(() => {
                            state[filename].lastSuccess = timestamp;
                            state[filename].result = result;
                            state[filename].failCount = 0;
                        });
                    }).catch(e => {
                        console.log("Error polling", filename, e);
                        state[filename].lastFail = (new Date).getTime();
                        state[filename].failCount++;
                        return Promise.resolve();
                    });
                } else {
                    console.log("Skipping poll of", filename);
                    return Promise.resolve();
                }
            });
        } else {
            return Promise.resolve();
        }
    };

    this.connections = function() {
        let toBroadcast = null;
        if (lastSnapshot && lastState) {
            toBroadcast = {};
            for (var i = 0; i < lastSnapshot.length; i++) {
                var filename = lastSnapshot[i].metadata.filename;
                var stateEntry = lastState[filename] || {};
                toBroadcast[filename] = {
                    model: { ...lastSnapshot[i].metadata },
                    state: { ...stateEntry },
                };
            }
        }

        return toBroadcast;
    };

    this.stop = function() {
        this.enumerateConnectionsTimer && clearTimeout(this.enumerateConnectionsTimer);
        this.workQueueTimer && clearTimeout(this.workQueueTimer);
    };

    enumerateConnectionsTimer = setTimeout(enumerateConnections.bind(this), RUN_NOW);
    workQueueTimer = setTimeout(pollFromQueue.bind(this), RUN_NOW);
};

const shouldPoll = function(state) {
    const currentTime = (new Date).getTime();
    if ((state.lastFail > state.lastSuccess) && (state.failCount < MAX_CONSECUTIVE_FAILS)) {
        return true;
    } else {
        return (Math.max(state.lastSuccess, state.lastFail) + POLL_INTERVAL_MS) < currentTime;
    }
};

module.exports = {

    Poller: Poller,

    init: function(authenticationRef, connectionsRef, ipcRef, runnerRef) {
        authentication = authenticationRef;
        connections = connectionsRef;
        ipc = ipcRef;
        runner = runnerRef;
    },

};
