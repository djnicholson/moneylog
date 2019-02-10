var MAX_STEP = 4;

var scraperId = null;
var url = null;
var step = 0;
var extractedData = null;

var prepareUi = function() {
    for (var i = 0; i < MAX_STEP; i++) {
        var section = $(".-step-" + i);
        if (step > i) {
            section.addClass("-faded");
            section.show();
        } else if (step === i) {
            section.removeClass("-faded");
            section.show();
        } else {
            section.hide();
        }
    }

    var clickables = $("#clickables");
    var typables = $("#typables");
    var numbers = $("#numbers");

    clickables.empty();
    typables.empty();
    numbers.empty();

    if (extractedData) {
        extractedData.clickables.forEach(item => clickables.append(optionClickable(item)));
        extractedData.typables.forEach(item => typables.append(optionTypable(item)));
        extractedData.numbers.forEach(item => numbers.append(optionNumber(item)));
    }
};

var closeScraperIfOpen = function() {
    if (scraperId != null) {
        moneylog.ipc.closeScraper(scraperId);
        scraperId = null;
        extractedData = null;
    }
}

var loadScraper = function() {
    closeScraperIfOpen();
    url = $("input[type=url]").val();
    scraperId = moneylog.ipc.openScraper(url);
    step = 1;
    prepareUi();
    return false; // prevent form submission
};

var loginTestDone = function() {
    closeScraperIfOpen();
    step = 2;
    prepareUi();
    return false; // prevent form submission
};

var optionClickable = function(item) {
    var element = $($("#template-clickable").html());
    element.find(".-id").text(item.id);
    element.find(".-value").text(item.value);
    return element;
};

var optionTypable = function(item) {
    var element = $($("#template-typable").html());
    element.find(".-id").text(item.id);
    element.find(".-value").text(item.value);
    return element;
};

var optionNumber = function(item) {
    var element = $($("#template-number").html());
    element.find(".-id").text(item.id);
    element.find(".-value").text(item.value);
    return element;
};

var startRecording = function() {
    closeScraperIfOpen();
    scraperId = moneylog.ipc.openScraper(url);
    step = 3;
    prepareUi();
    return false; // prevent form submission
};

document.body.onunload = function() {
    closeScraperIfOpen();
}

document.body.onload = function() {
    
    moneylog.ipc.on("scraper-closed", function(_, closedId) {
        if (closedId === scraperId) {
            scraperId = null;
            step = 0;
            extractedData = null;
            prepareUi();
        }
    });

    moneylog.ipc.on("scraper-data", function(_, data) {
        if (data.id === scraperId) {
            extractedData = data.data;
            prepareUi();
        }
    });

    $("#urlEntry").submit(loadScraper);
    $("#loginTest").submit(loginTestDone);
    $("#recordingIntro").submit(startRecording);
    
    prepareUi();
};
