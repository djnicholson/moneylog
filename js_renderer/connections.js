(window.moneylog = window.moneylog || {}).connections = (function(){
    
    var connections = null;

    var onUpdate = undefined;

    var updateConnections = function(newConnections) {
        console.log("Connections", newConnections);
        connections = newConnections;
        onUpdate && onUpdate(connections);
    };

    moneylog.ipc.on("poller-connections", function(_, connections) { updateConnections(connections); });

    updateConnections(moneylog.ipc.authenticationQueryConnections());

    return {
        
        getConnections: function() {
            return connections;
        },

        onUpdate: function(callback) {
            onUpdate = callback;
        },

    };

})();
