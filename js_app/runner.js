const vm = require('vm');
const puppeteer = require('puppeteer');
const prompt = require('electron-prompt');

let ipc = undefined;

let testRunner = undefined;

const getInput = function(promptText) {
    return prompt({
        title: "User input required",
        label: promptText,
    });
};

const Runner = function(headless) {
    this.browser = puppeteer.launch({
        headless: headless, 
        args: ['--disable-infobars'], 
        defaultViewport: { width: 1280, height: 1024 }, 
    }).then(browser => {
        return browser.userAgent().then(defaultUserAgent => {
            this.defaultUserAgent = defaultUserAgent;
            return browser;
        });
    });
    
    this.dispose = function() {
        return this.browser.then(browser => browser.close());
    };

    this.evaluate = function(model) {
        var screenshotOnFailure = function(page, result) {
            if (!result) {
                const screenshotPath = "/tmp/moneylog-failure.png";
                console.log("Screenshotting runner failure in", screenshotPath);
                return page.screenshot({ path: screenshotPath }).then(() => result);
            } else {
                return result;
            }
        };

        return this.browser
            .then(browser => browser.newPage())
            .then(page => {
                return page.setUserAgent(this.defaultUserAgent.replace("Headless", "")).then(() => {
                    const variables = {...model.variables};
                    variables.page = page;
                    variables.result = undefined;
                    variables.getInput = getInput;
                    vm.createContext(variables);
                    const p = vm.runInContext(model.script, variables);
                    if (p && p.then) {
                        return p.then(() => screenshotOnFailure(page, variables.result));
                    } else {
                        return screenshotOnFailure(page, variables.result)
                    }
                });
            })
            .then(result => {
                console.log("result", result);
                return result;
            })
            .catch(e => {
                console.log("error", e);
                return null;
            });
    };
};

module.exports = {

    init: function(ipcRef) {
        ipc = ipcRef;
    },

    evaluate: function(model) {
        console.log("Running", model.filename);
        const runner = new Runner(/*headless*/ true);
        return runner.evaluate(model).then(result => {
            runner.dispose();
            return result;
        });
    },

    test: function(model, newSession) {
        console.log("Testing", model.filename, newSession ? "in a new session" : "");
        
        if (newSession || !testRunner) {
            testRunner && testRunner.dispose();
            testRunner = new Runner(/*headless*/ false);
        }

        return testRunner.evaluate(model).then(result => ipc.runnerResult(result));
    },

};
