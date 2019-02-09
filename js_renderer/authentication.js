(window.moneylog = window.moneylog || {}).authentication = (function(){
    
    var authState = undefined;

    moneylog.ipc.on("authentication-set", function(_, state) {
        authState = state;
    });

    moneylog.ipc.queryAuthenticationState();

    return {
        
        getUsername: function() {
            return authState && authState.username;
        },

        isAuthenticated: function() {
            return authState != undefined;
        },

        signOut: function() {
            moneylog.ipc.signOut();
        },

        startAuthentication: function() {
            moneylog.ipc.startAuthentication();
        },

    };

})();
