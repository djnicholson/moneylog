//
// Variables:
//   - username
//   - password
//   - lastFour
//

delay = 10000;
page.goto('https://www.ally.com/')
    .then(() => page.click("#login-btn"))
    .then(() => page.type("#account", "bank"))
    .then(() => page.type("#username", username))
    .then(() => page.type("#password", password))
    .then(() => page.keyboard.press("Enter"))
    .then(() => page.waitFor(delay))
    .then(() => page.$("input[type=radio]"))
    .then(confirmationMethodSelection => {
        if (confirmationMethodSelection) {
            return confirmationMethodSelection.click()
                .then(() => page.keyboard.press("Enter"))
                .then(() => page.waitFor(delay));
        } else {
            return Promise.resolve();
        }
    })
    .then(() => page.$(".verify-code-form"))
    .then(smsCodeEntry => {
        if (smsCodeEntry) {
            return getInput("Enter your Ally one-time security code")
                .then(oneTimeCode => page.type(".verify-code-form input[type=text]", oneTimeCode))
                .then(() => page.keyboard.press("Enter"))
                .then(() => page.waitFor(delay));
        } else {
            return Promise.resolve();
        }
    })
    .then(() => page.$("input[type=radio]"))
    .then(isTrustedSelection => {
        if (isTrustedSelection) {
            return isTrustedSelection.click()
                .then(() => page.keyboard.press("Enter"))
                .then(() => page.waitFor(delay));
        } else {
            return Promise.resolve();
        }
    })
    .then(() => page.$$eval(".card-content", function(allTiles, lastFour) {
        for (var i = 0; i < allTiles.length; i++) {
            if (allTiles[i].textContent.indexOf(lastFour) != -1) {
                return $(allTiles[i]).find("tfoot td")[0].textContent;
            }
        }
    }, lastFour))
    .then(balance => {
        if (balance) {
            result = balance.replace(/[$,]/g, "");
        }
    });

