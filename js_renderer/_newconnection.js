var MAX_STEP = 4;

var scraperId = null;
var url = null;
var step = 0;
var extractedData = null;
var recipe = [ ];

var addToRecipe = function(recipeItem) {
    recipe.push(recipeItem);
    moneylog.ipc.scraperRecipe(scraperId, [ recipeItem ]);
    prepareUi();
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
    recipe = [];
    prepareUi();
    return false; // prevent form submission
};

var loginTestDone = function() {
    closeScraperIfOpen();
    step = 2;
    recipe = [];
    prepareUi();
    return false; // prevent form submission
};

var optionClickable = function(item) {
    var element = $($("#template-clickable").html());
    element.find(".-id").text(item.id);
    element.find(".-value").text(item.value);
    element.click(function() { addToRecipe({ action: "click", id: item.id, value: item.value }); });
    return element;
};

var optionTypable = function(item) {
    var element = $($("#template-typable").html());
    element.find(".-id").text(item.id);
    element.find(".-value").attr("placeholder", item.value);
    element.find("button").click(function() { 
        var text = element.find("input[type=text]").val();
        var pressEnter = element.find("input[type=checkbox]").prop("checked");
        addToRecipe({ action: "type", id: item.id, text: text, pressEnter: pressEnter }); 
    });
    return element;
};

var optionNumber = function(item) {
    var element = $($("#template-number").html());
    element.find(".-id").text(item.id);
    element.find(".-value").text(item.value);
    element.click(function() { addToRecipe({ action: "extracxt", id: item.id }); });
    return element;
};

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
    var recipeList = $("#recipeList");

    clickables.empty();
    typables.empty();
    numbers.empty();
    recipeList.empty();

    if (extractedData) {
        extractedData.clickables.forEach(item => clickables.append(optionClickable(item)));
        extractedData.typables.forEach(item => typables.append(optionTypable(item)));
        extractedData.numbers.forEach(item => numbers.append(optionNumber(item)));
    }

    recipeList.append(recipeUrl(url));
    for (var i = 0; i < recipe.length; i++) {
        var recipeItem = recipe[i];
        if (recipeItem.action === "click") {
            recipeList.append(recipeClick(recipeItem));
        } else if (recipeItem.action === "type") {
            recipeList.append(recipeType(recipeItem));
        } else if (recipeItem.action === "extract") {
            recipeList.append(recipeExtract(recipeItem));
        }
    }
};

var recipeUrl = function(gotoUrl) {
    return $("<li>").text("Navigate to " + gotoUrl);
};

var recipeClick = function(recipeItem) {
    return $("<li>").text("Click on " + recipeItem.id + " (" + recipeItem.value + ")");
};

var recipeType = function(recipeItem) {
    var pressEnter = recipeItem.pressEnter ? " then press enter" : "";
    return $("<li>").text("Type '" + recipeItem.text + "'' into " + recipeItem.id + pressEnter);
};

var recipeExtract = function(recipeItem) {
    return $("<li>").text("Extract numerical value from " + recipeItem.id);
};

var startRecording = function() {
    closeScraperIfOpen();
    scraperId = moneylog.ipc.openScraper(url);
    step = 3;
    recipe = [];
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
            console.log(extractedData);
            prepareUi();
        }
    });

    $("#urlEntry").submit(loadScraper);
    $("#loginTest").submit(loginTestDone);
    $("#recordingIntro").submit(startRecording);
    $("#recording").on("reset", startRecording);
    
    prepareUi();
};
