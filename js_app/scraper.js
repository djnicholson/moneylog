const crypto = require('crypto');

const SCRAPER_WINDOW_WIDTH = 1280;
const SCRAPER_WINDOW_HEIGHT = 1024;
const POLL_INTERVAL_MS = 1000;
const CODE_EXTRACT_DATA = 
    "result = { numbers: [ ], clickables: [ ], typables: [ ] };\n" +
    "document.querySelectorAll('*').forEach(function(element) {\n" +
    "    if (element.id) {\n" +
    "        var text = element.textContent;\n" +
    "        if (text.match(/^.?[,.0-9]+.?$/)) {\n" +
    "            result.numbers.push({ id: element.id, value: element.textContent });\n" +
    "        }\n" +
    "        \n" +
    "        var text = element.textContent.replace(/\\s+/g, ' ').trim();\n" +
    "        if ((element.tagName === 'A' || element.tagName === 'BUTTON') && text) {\n" +
    "            result.clickables.push({ id: element.id, value: text });\n" +
    "        }\n" +
    "        \n" +
    "        if (element.tagName === 'INPUT' && (element.type === 'text' || element.type === 'password')) {\n" +
    "            result.typables.push({ id: element.id, value: element.placeholder });\n" +
    "        }\n" +
    "    }\n" +
    "});\n" +
    "result;\n";

let BrowserWindow = undefined;
let ipc = undefined;

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

const isNumber = function(c) {
    return (c >= '0') && (c <= '9');
};

const parseNumber = function(numberStr) {
    return Number.parseFloat(numberStr.replace(/[^.0-9]/g, ""));
};

module.exports = {

    closeWindow: closeWindow,

    init: function(BrowserWindowRef, session, ipcRef) {
        BrowserWindow = BrowserWindowRef;
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
        let thisId = nextId++;

        let newWindow = new BrowserWindow({ 
            width: SCRAPER_WINDOW_WIDTH, 
            height: SCRAPER_WINDOW_HEIGHT, 
            webPreferences: { nodeIntegration: false },
        });

        allWindows[thisId] = { id: thisId, win: newWindow };

        newWindow.on("closed", () => {
            closeWindow(thisId);
        });

        newWindow.webContents.on('new-window', function(e, popupUrl) {
            console.log("Prenting popup to", popupUrl, "requested by", url);
            e.preventDefault();
        });

        let extractData = function() {
            newWindow.webContents.executeJavaScript(CODE_EXTRACT_DATA).then((extractedData) => {
                const numbers = extractedData.numbers;
                numbers.forEach(result => { result.value = parseNumber(result.value); });
                allWindows[thisId].extractedData = extractedData;
                allWindows[thisId].timeout = setTimeout(extractData, POLL_INTERVAL_MS); 
                const oldHash = allWindows[thisId].extractedDataHash;
                allWindows[thisId].extractedDataHash = crypto.createHash('sha256').update(JSON.stringify(extractedData)).digest('hex');
                if (oldHash != allWindows[thisId].extractedDataHash) {
                    ipc.scraperData(thisId, allWindows[thisId].extractedData);
                }
            });
        };

        extractData();

        newWindow.loadURL(url);

        return thisId;
    },

};
