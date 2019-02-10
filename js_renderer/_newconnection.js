var NUM_STEPS = 6;

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

var prepareUi = function() {
    for (var i = 0; i < NUM_STEPS; i++) {
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
    var recipeList = $(".-recipe-list");

    clickables.empty();
    typables.empty();
    numbers.empty();
    recipeList.empty();

    if (extractedData) {
        extractedData.clickables.forEach(item => clickables.append(templates.optionClickable(item)));
        extractedData.typables.forEach(item => typables.append(templates.optionTypable(item)));
        extractedData.numbers.forEach(item => numbers.append(templates.optionNumber(item)));
    }

    var ended = false;
    recipeList.append(templates.recipeUrl(url));
    for (var i = 0; i < recipe.length; i++) {
        var recipeItem = recipe[i];
        if (recipeItem.action === "click") {
            ended = false;
            recipeList.append(templates.recipeClick(recipeItem));
        } else if (recipeItem.action === "type") {
            ended = false;
            recipeList.append(templates.recipeType(recipeItem));
        } else if (recipeItem.action === "number") {
            ended = true;
            recipeList.append(templates.recipeNumber(recipeItem));
        }
    }

    !ended && recipeList.append($("<li>").text("…"));
};

var startRecording = function() {
    closeScraperIfOpen();
    scraperId = moneylog.ipc.openScraper(url);
    step = 3;
    recipe = [];
    prepareUi();
    return false; // prevent form submission
};

var showTestInto = function() {
    closeScraperIfOpen();
    step = 4;
    prepareUi();
    return false; // prevent form submission
};

var startTesting = function() {
    closeScraperIfOpen();
    scraperId = moneylog.ipc.openScraper(url);
    moneylog.ipc.scraperRecipe(scraperId, recipe);
    step = 5;
    prepareUi();
    return false; // prevent form submission
};

var templates = {
    optionClickable: function(item) {
        var element = $($("#template-clickable").html());
        element.find(".-selector").text(item.selector);
        element.find(".-value").text(item.value);
        element.click(function() { addToRecipe({ action: "click", selector: item.selector, value: item.value }); });
        return element;
    },

    optionTypable: function(item) {
        var element = $($("#template-typable").html());
        var submit = function() { 
            var text = element.find("input[type=text]").val();
            var pressEnter = element.find("input[type=checkbox]").prop("checked");
            addToRecipe({ action: "type", selector: item.selector, text: text, pressEnter: pressEnter }); 
        };

        element.find(".-selector").text(item.selector);
        element.find(".-value").attr("placeholder", item.value);
        element.find(".-value").keypress(function(e) {
            if (e.keyCode == '13') {
                submit();
            }
        });

        element.find("input[type=button]").click(submit);
        return element;
    },

    optionNumber: function(item) {
        var element = $($("#template-number").html());
        element.find(".-selector").text(item.selector);
        element.find(".-value").text(item.value);
        element.click(function() { 
            addToRecipe({ action: "number", selector: item.selector }); 
            showTestInto();
        });
        return element;
    },

    recipeUrl: function(gotoUrl) {
        return $("<li>").text("Navigate to " + gotoUrl);
    },

    recipeClick: function(recipeItem) {
        return $("<li>").text("Click on " + recipeItem.selector + " (" + recipeItem.value + ")");
    },

    recipeType: function(recipeItem) {
        var pressEnter = recipeItem.pressEnter ? " then press enter" : "";
        return $("<li>").text("Type '" + recipeItem.text + "' into " + recipeItem.selector + pressEnter);
    },

    recipeNumber: function(recipeItem) {
        return $("<li>").text("Extract numerical value from " + recipeItem.selector);
    },
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
    $("#testing").on("reset", startRecording);
    $("#testing").submit(startTesting);

    $("#addCustomClick").click(function() {
        addToRecipe({ action: "click", selector: $("#customClickSelector").val() }); 
    });

    $("#addCustomType").click(function() {
        addToRecipe({ 
            action: "type", 
            selector: $("#customTypeSelector").val(), 
            text: $("#customTypeText").val(), 
            pressEnter: $("#customTypePressEnter").prop("checked"),
        }); 
    });

    $("#addCustomNumber").click(function() {
        addToRecipe({ action: "number", selector: $("#customNumberSelector").val() }); 
    });
    
    prepareUi();
};
