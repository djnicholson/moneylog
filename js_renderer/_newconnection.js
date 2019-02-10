var MAX_STEP = 4;

var scraperId = null;
var step = 0;

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
};

var loadScraper = function() {
    if (scraperId != null) {
        moneylog.ipc.closeScraper(scraperId);
        scraperId = null;
    }

    var url = $("input[type=url]").val();
    
    scraperId = moneylog.ipc.openScraper(url);
    step = 1;

    prepareUi();

    return false; // prevent form submission
};

var extractNumericalValues = function() {
    if (scraperId == null) {
        step = 0;
    } else {
        step = 2;
    }

    prepareUi();

    return false; // prevent form submission
};

document.body.onload = function() {
    
    moneylog.ipc.on("scraper-closed", function(_, closedId) {
        if (closedId === scraperId) {
            scraperId = null;
            step = 0;
            prepareUi();
        }
    });

    moneylog.ipc.on("scraper-data", function(_, data) {
        if (data.id === scraperId) {
            console.log(data);
        }
    });

    $("#urlEntry").submit(loadScraper);
    $("#loginTest").submit(extractNumericalValues);
    
    prepareUi();
};
