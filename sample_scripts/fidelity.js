//
// Variables:
//   - username
//   - password
//

delay = 10000;
page.goto('https://login.fidelity.com/ftgw/Fas/Fidelity/RtlCust/Login/Init')
    .then(() => page.type("#userId-input", username))
    .then(() => page.type("#password", password))
    .then(() => page.keyboard.press("Enter"))
    .then(() => page.waitFor(delay))
    .then(() => page.title())
    .then(title => {
        if (title.indexOf("OTP Challenge") != -1) {
            return page.$eval("input[type=radio]", e => e.click())
                .then(() => page.$eval("form button.submit", e => e.click()))
                .then(() => page.waitFor(delay))
                .then(() => page.$eval("input[type=radio]", e => e.click()))
                .then(() => page.$eval("input[type=radio]", e => e.focus()))
                .then(() => page.keyboard.press("Enter"))
                .then(() => page.waitFor(delay))
                .then(() => getInput("Enter your Fidelity security code"))
                .then(securityCode => page.type("#code", securityCode))
                .then(() => page.$eval("#saveDevice", e => e.click()))
                .then(() => page.keyboard.press("Enter"))
                .then(() => page.waitFor(delay));
        } else {
            return Promise.resolve();
        }
    })
    .then(() => page.$eval(".js-portfolio-balance", e => e.textContent.trim()))
    .then(balance => {
        if (balance) {
            result = balance.replace(/[$,]/g, "");
        }
    });
