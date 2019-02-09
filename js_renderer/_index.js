document.body.onload = function() {

    $("#loginLink").click(moneylog.authentication.startAuthentication);

    moneylog.authentication.afterAuthentication(function() {
        window.location.href = "home.html";
    });

};
