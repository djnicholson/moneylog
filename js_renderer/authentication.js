(window.moneylog = window.moneylog || {}).authentication = (function(){
    
    var authState = undefined;

    moneylog.ipc.on("set-authentication-state", function(_, state) {
        authState = state;
    });

    moneylog.ipc.queryAuthenticationState();

    return {
        
        getUsername: function() {
            return authState && authState.username;
        },

        isAuthenticated: function() {
            return authState !== undefined;
        },

        startAuthentication: function() {
            moneylog.ipc.startAuthentication();
        },

    };

})();
