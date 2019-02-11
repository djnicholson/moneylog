(window.moneylog = window.moneylog || {}).authentication = (function(){
    
    var afterAuthentication = undefined;
    var authState = undefined;

    var isAuthenticated = function() {
        return authState != undefined;
    };

    var updateAuthenticationState = function(state) {
        authState = state;
        if (isAuthenticated()) {
            afterAuthentication && afterAuthentication();
        }
    };

    moneylog.ipc.on("authentication-set", function(_, state) { updateAuthenticationState(state); });

    updateAuthenticationState(moneylog.ipc.queryAuthenticationState());

    return {
        
        afterAuthentication: function(fn) {
            afterAuthentication = fn;
            if (isAuthenticated()) {
                afterAuthentication();
            }
        },

        getUsername: function() {
            return authState && authState.username;
        },

        isAuthenticated: isAuthenticated,

        signOut: function() {
            moneylog.ipc.signOut();
        },

        startAuthentication: function() {
            moneylog.ipc.startAuthentication();
        },

    };

})();
