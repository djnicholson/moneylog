document.body.onload = function() {

    moneylog.authentication.afterAuthentication(function() {
        window.location.href = "home.html";
    });

};
