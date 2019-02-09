(window.moneylog = window.moneylog || {}).ui = (function(){
    
    $(".-sign-out-link").click(function(){ 
        moneylog.authentication.signOut();
        window.location.href = "index.html";
    });

    return {
        
    };

})();
