(window.moneylog = window.moneylog || {}).connections = (function(){
    
    var connections = null;

    var updateConnections = function(newConnections) {
        console.log("Connections", newConnections);
        connections = newConnections;
    };

    moneylog.ipc.on("poller-connections", function(_, connections) { updateConnections(connections); });

    updateConnections(moneylog.ipc.authenticationQueryConnections());

    return {
        
        

    };

})();
