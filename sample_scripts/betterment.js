//
// Variables:
//   - username
//   - password
//

delay = 10000;
page.goto('https://wwws.betterment.com/app/login')
    .then(() => page.waitFor(delay))
    .then(() => page.$("#web_authentication_password"))
    .then(passwordBox => {
        if (passwordBox) {
            return page.type("#web_authentication_email", username)
                .then(() => page.type("#web_authentication_password", password))
                .then(() => page.keyboard.press("Enter"))
                .then(() => page.waitFor(delay));
        } else {
            return Promise.resolve();
        }
    })
    .then(() => page.$(".summary-info ul li:nth-child(2) .data-value"))
    .then(element => page.evaluate(e => e.textContent, element))
    .then(balance => {
        if (balance) {
            result = -1.0 * balance.replace(/[$,]/g, "");
        }
    });

