const crypto = require('crypto');

const SCRAPER_WINDOW_WIDTH = 1280;
const SCRAPER_WINDOW_HEIGHT = 1024;
const POLL_INTERVAL_MS = 1000;
const WAIT_FOR_ITEM_TIMEOUT_S = 30;
const CODE_EXTRACT_DATA = 
    "result = { numbers: [ ], clickables: [ ], typables: [ ] };\n" +
    "document.querySelectorAll('*').forEach(function(element) {\n" +
    "    if (element.id) {\n" +
    "        var text = element.textContent;\n" +
    "        if (text.match(/^.?[,.0-9]+.?$/)) {\n" +
    "            result.numbers.push({ id: '#' + element.id, value: element.textContent });\n" +
    "        }\n" +
    "        \n" +
    "        var text = element.textContent.replace(/\\s+/g, ' ').trim();\n" +
    "        if ((element.tagName === 'A' || element.tagName === 'BUTTON') && text) {\n" +
    "            result.clickables.push({ id: '#' + element.id, value: text });\n" +
    "        }\n" +
    "        \n" +
    "        if (element.tagName === 'INPUT' && (element.type === 'text' || element.type === 'password')) {\n" +
    "            result.typables.push({ id: '#' + element.id, value: element.placeholder });\n" +
    "        }\n" +
    "    }\n" +
    "});\n" +
    "result;\n";
const CODE_CLICK_ITEM = elementId => "document.querySelectorAll('" + jsEncode(elementId)  + "')[0].click();";
const CODE_GET_TEXT = elementId => "document.querySelectorAll('" + jsEncode(elementId)  + "')[0].textContent;";
const CODE_SET_TEXT = (elementId, text) => 
    "document.querySelectorAll('" + jsEncode(elementId)  + "')[0].value = '" + jsEncode(text) + "';\n" +
    "document.querySelectorAll('" + jsEncode(elementId)  + "')[0].focus();\n";
const CODE_WAIT_FOR_ITEM = elementId => "!!document.querySelectorAll('" + jsEncode(elementId)  + "')[0];";

let BrowserWindow = undefined;
let ipc = undefined;
let mainWindow = undefined;

let nextId = 0;
let allWindows = { };

const closeWindow = function(id) {
    var targetWindow = allWindows[id];
    if (targetWindow) {
        if (targetWindow.win) {
            try {
                targetWindow.win.hide();
            } catch(e) {
            }
        }

        if (targetWindow.timeout) {
            clearTimeout(targetWindow.timeout);
        }

        delete allWindows[id];
        ipc.scraperClosed(id);
    }
};

const jsEncode = function(str) {
    //
    // TODO
    // 

    return str;
};

const parseNumber = function(numberStr) {
    return Number.parseFloat(numberStr.replace(/[^.0-9]/g, ""));
};

const runRecipe = function(id, recipe, startIndex) {
    if (startIndex >= recipe.length) {
        return Promise.resolve(true);
    }

    var scraper = allWindows[id];
    if (scraper) {
        console.log("Running recipe step", startIndex, "on", scraper.url, recipe[startIndex]);
        runRecipeItem(scraper, recipe[startIndex]).then(success => {
            if (success) {
                return runRecipe(id, recipe, startIndex + 1);
            } else {
                console.log("Recipe failed at step", startIndex, "url:", scraper.url);
                return Promise.resolve(false);
            }
        });
    }
};

const runRecipeItem = function(scraper, recipeItem) {
    return runRecipeWaitForItem(scraper.win, recipeItem.id, WAIT_FOR_ITEM_TIMEOUT_S).then(elementExists => {
        if (!elementExists) {
            return false;
        }

        if (recipeItem.action === "click") {
            scraper.win.webContents.executeJavaScript(CODE_CLICK_ITEM(recipeItem.id));
            return true;
        } else if (recipeItem.action === "type") {
            return scraper.win.webContents.executeJavaScript(CODE_SET_TEXT(recipeItem.id, recipeItem.text)).then(() => {
                if (recipeItem.pressEnter) {
                    scraper.win.webContents.sendInputEvent({ type: "char", keyCode: String.fromCharCode(0x0D) });
                }

                return true;    
            });
        } else if (recipeItem.action === "number") {
            return scraper.win.webContents.executeJavaScript(CODE_GET_TEXT(recipeItem.id)).then(textContent => {
                return parseNumber(textContent);
            });
        } else {
            console.log("Unexpected recipe action", recipeItem.action);
        }
    });
};

const runRecipeWaitForItem = function(win, itemId, remainingAttempts) {
    console.log("Waiting for DOM element", itemId, "remainingAttempts:", remainingAttempts);
    return new Promise(function(resolve, reject) {
        if (remainingAttempts <= 0) {
            console.log("DOM element", itemId, "not found");
            resolve(false);
        } else {
            win.webContents.executeJavaScript(CODE_WAIT_FOR_ITEM(itemId)).then(currentResult => {
                if (currentResult) {
                    resolve(true);
                } else {
                    setTimeout(() => {
                        runRecipeWaitForItem(win, itemId, remainingAttempts - 1).then(result => resolve(result));
                    }, POLL_INTERVAL_MS);
                }
            });
        }
    });
};

module.exports = {

    closeWindow: closeWindow,

    init: function(BrowserWindowRef, mainWindowRef, session, ipcRef) {
        BrowserWindow = BrowserWindowRef;
        mainWindow = mainWindowRef;
        ipc = ipcRef;

        // Spoof User-Agent to look like a regular web browser:
        session.defaultSession.webRequest.onBeforeSendHeaders(function(details, callback) {
            details.requestHeaders['User-Agent'] = details.requestHeaders['User-Agent']
                .replace(/ Electron\/[.0-9]+/, "")
                .replace(/ moneylog\/[.0-9]+/, "");
            callback({ cancel: false, requestHeaders: details.requestHeaders });
        });
    },

    newWindow: function(url) {
        const thisId = nextId++;

        const mainWindowBounds = mainWindow.getNormalBounds();
        const newWindow = new BrowserWindow({ 
            width: SCRAPER_WINDOW_WIDTH, 
            height: SCRAPER_WINDOW_HEIGHT, 
            x: mainWindowBounds.x + mainWindowBounds.width,
            y: mainWindowBounds.y,
            webPreferences: { nodeIntegration: false },
        });

        allWindows[thisId] = { id: thisId, win: newWindow, url: url };

        newWindow.on("closed", () => {
            closeWindow(thisId);
        });

        newWindow.webContents.on('new-window', function(e, popupUrl) {
            console.log("Prenting popup to", popupUrl, "requested by", url);
            e.preventDefault();
        });

        const extractData = function() {
            newWindow.webContents.executeJavaScript(CODE_EXTRACT_DATA).then((extractedData) => {
                if (allWindows[thisId]) {
                    const numbers = extractedData.numbers;
                    numbers.forEach(result => { result.value = parseNumber(result.value); });
                    allWindows[thisId].extractedData = extractedData;
                    allWindows[thisId].timeout = setTimeout(extractData, POLL_INTERVAL_MS); 
                    const oldHash = allWindows[thisId].extractedDataHash;
                    allWindows[thisId].extractedDataHash = crypto.createHash('sha256').update(JSON.stringify(extractedData)).digest('hex');
                    if (oldHash != allWindows[thisId].extractedDataHash) {
                        ipc.scraperData(thisId, allWindows[thisId].extractedData);
                    }
                }
            });
        };

        extractData();

        newWindow.loadURL(url);

        return thisId;
    },

    runRecipe: function(id, recipeItem) {
        return runRecipe(id, recipeItem, 0);
    },

};
