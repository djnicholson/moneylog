//
// Variables:
//   - username
//   - password
//

delay = 10000;
page.goto('https://global.americanexpress.com/login')
    .then(() => page.waitFor(delay))
    .then(() => page.$("#eliloPassword"))
    .then(passwordBox => {
        if (passwordBox) {
            return page.type("#eliloUserID", username)
                .then(() => page.type("#eliloPassword", password))
                .then(() => page.keyboard.press("Tab"))
                .then(() => page.keyboard.press("Tab"))
                .then(() => page.keyboard.press("Tab"))
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

