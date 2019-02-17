const vm = require('vm');
const puppeteer = require('puppeteer');

let ipc = undefined;

let testRunner = undefined;

const Runner = function(headless) {
    this.browser = puppeteer.launch({headless: headless, args: ['--disable-infobars'] });
    
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

        testRunner
            .evaluate(model)
            .then(result => ipc.runnerResult(result))
            .catch(e => ipc.runnerResult(undefined));
    },

};
