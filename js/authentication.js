(window.moneylog = window.moneylog || {}).authentication = (function(){
    
    var REQUIRED_PERMISSIONS = ["store_write"];

    return {
        
        login: function() {
            var origin = window.location.origin;
            var manifest = origin + "/manifest.json";
            var authRequest = blockstack.makeAuthRequest(
                blockstack.generateAndStoreTransitKey(),
                origin, 
                manifest, 
                REQUIRED_PERMISSIONS);
            var authUrl = "https://browser.blockstack.org/auth?authRequest=" + encodeURIComponent(authRequest);
            window.open(authUrl);
        },

    };

})();
