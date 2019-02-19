//
// Variables:
//   - username
//   - password
//

delay = 10000;
page.goto('https://robinhood.com/login')
    .then(() => page.$("input[type=text]"))
    .then(textBox => {
        if (textBox) {
            return page.type("input[type=text]", username)
                .then(() => page.type("input[type=password]", password))
                .then(() => page.keyboard.press("Enter"))
                .then(() => page.waitFor(delay));
        } else {
            return Promise.resolve();
        }
    })
    .then(() => page.goto('https://robinhood.com/account'))
    .then(() => page.waitFor(delay))
    .then(() => page.$$eval("tspan", function(allTspans) {
        for (var i = 0; i < allTspans.length; i++) {
            if (allTspans[i].textContent.startsWith("$")) {
                return allTspans[i].textContent;
            }
        }
    }))
    .then(balance => {
        if (balance) {
            result = balance.replace(/[$,]/g, "");
        }
    });
