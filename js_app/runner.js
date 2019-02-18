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
    this.browser = puppeteer.launch({headless: headless, args: ['--disable-infobars'], defaultViewport: null });
    
    this.dispose = function() {
        return this.browser.then(browser => browser.close());
    };

    this.evaluate = function(model) {
        return this.browser
            .then(browser => browser.newPage())
            .then(page => {
                const variables = {...model.variables};
                variables.page = page;
                variables.result = undefined;
                variables.getInput = getInput;
                vm.createContext(variables);
                const p = vm.runInContext(model.script, variables);
                if (p && p.then) {
                    return p.then(() => variables.result);
                } else {
                    return variables.result;
                }
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

    test: function(model, newSession) {
        console.log("Testing", model, newSession ? "in a new session" : "");
        
        if (newSession || !testRunner) {
            testRunner && testRunner.dispose();
            testRunner = new Runner(/*headless*/ false);
        }

        return testRunner.evaluate(model).then(result => ipc.runnerResult(result));
    },

};
