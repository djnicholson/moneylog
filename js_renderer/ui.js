(window.moneylog = window.moneylog || {}).ui = (function(){
    
    $(".-sign-out-link").click(function(){ 
        moneylog.authentication.signOut();
        window.location.href = "index.html";
    });

    $(".-sign-in-link").click(function(){ 
        moneylog.authentication.startAuthentication();
    });

    return {
        
    };

})();
