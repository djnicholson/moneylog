(window.moneylog = window.moneylog || {}).authentication = (function(){
    
    var authState = undefined;

    moneylog.ipc.on("set-authentication-state", function(_, state) {
        authState = state;
    });

    return {
        
        isAuthenticated: function() {
            return authState !== undefined;
        },

        startAuthentication: function() {
            moneylog.ipc.startAuthentication();
        },

    };

})();
