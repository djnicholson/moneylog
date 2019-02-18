delay = 10000;
page.goto('https://www.chase.com/')
    .then(() => page.$eval(".side-menu .signInBtn", _ => _.href))
    .then(loginUrl => page.goto(loginUrl, { waitUntil: "networkidle0" }))
    .then(() => page.$("#logonbox"))
    .then(logonDialog => {
        if (logonDialog) {
            return page.mainFrame().childFrames()[0].type("input[type=text]", username)
                .then(() => page.mainFrame().childFrames()[0].type("input[type=password]", password))
                .then(() => page.keyboard.press("Enter"))
                .then(() => page.waitFor(delay))
                .then(() => page.mainFrame().childFrames()[0] && page.mainFrame().childFrames()[0].$("#requestDeliveryDevices-sm"))
                .then(challengeButton => {
                    if (challengeButton) {
                        return challengeButton.click()
                            .then(() => page.waitFor(delay))
                            .then(() => page.mainFrame().childFrames()[0].click("input[type=radio]"))
                            .then(() => page.mainFrame().childFrames()[0].click("#requestIdentificationCode-sm"))
                            .then(() => page.waitFor(delay))
                            .then(() => page.mainFrame().childFrames()[0].type("input[type=password]", password))
                            .then(() => getInput("Enter the temporary identification code that you received from Chase"))
                            .then(tempCode => page.mainFrame().childFrames()[0].type("input[type=text]", tempCode))
                            .then(() => page.mainFrame().childFrames()[0].click("#log_on_to_landing_page-sm"))
                            .then(() => page.waitFor(delay));
                    } else {
                        return Promise.resolve();
                    }
                });
        } else {
            return Promise.resolve();
        }
    })
    .then(() => page.$$eval(".main-tile", function(allTiles, lastFour) {
        for (var i = 0; i < allTiles.length; i++) {
            if (allTiles[i].textContent.indexOf(lastFour) != -1) {
                return $(allTiles[i]).find(".balance").text();
            }
        }
    }, lastFour))
    .then(balance => {
        result = balance.replace(/[$,]/g, "");
        if (isCredit) {
            result *= -1;
        }
    });

