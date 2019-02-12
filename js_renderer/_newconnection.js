var NUM_STEPS = 7;

var scraperId = null;
var url = null;
var step = 0;
var extractedData = null;
var recipe = [ ];
var result = null;

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
    result = null;
    prepareUi();
    return false; // prevent form submission
};

var loginTestDone = function() {
    closeScraperIfOpen();
    step = 2;
    recipe = [];
    result = null;
    prepareUi();
    return false; // prevent form submission
};

var prepareUi = function() {
    for (var i = 0; i < NUM_STEPS; i++) {
        var section = $(".-step-" + i).toggle(step === i);
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

    var valueExtracted = false;
    recipeList.append(templates.recipeUrl(url));
    for (var i = 0; i < recipe.length; i++) {
        var recipeItem = recipe[i];
        if (recipeItem.action === "click") {
            recipeList.append(templates.recipeClick(recipeItem));
        } else if (recipeItem.action === "type") {
            recipeList.append(templates.recipeType(recipeItem));
        } else if (recipeItem.action === "number") {
            valueExtracted = true;
            recipeList.append(templates.recipeNumber(recipeItem));
        }
    }

    if (valueExtracted) {
        $(".-extraction-column").attr("disabled", true);
    }

    $(".-success").toggle(!!result);
    $(".-failure").toggle(!result);
    $(".-result").text(result);
};

var startRecording = function() {
    closeScraperIfOpen();
    scraperId = moneylog.ipc.openScraper(url);
    step = 3;
    recipe = [];
    result = null;
    prepareUi();
    return false; // prevent form submission
};

var showTestInto = function() {
    closeScraperIfOpen();
    step = 4;
    result = null;
    prepareUi();
    return false; // prevent form submission
};

var startTesting = function() {
    closeScraperIfOpen();
    scraperId = moneylog.ipc.openScraper(url);
    moneylog.ipc.scraperRecipe(scraperId, recipe);
    step = 5;
    result = null;
    prepareUi();
    return false; // prevent form submission
};

var saveConnection = function() {
    var accountName = $("#accountName").val();
    var connection = {
        file: suggestFilename(url, accountName),
        url: url,
        accountName: accountName,
        recipe: recipe,
    };

    moneylog.ipc.saveConnection(connection);
    window.location.href = "home.html";
    return false; // prevent form submission
};

var suggestFilename = function(url, accountName) {
    return url.replace(/https?:\/\//, "").toLowerCase().replace(/[^-a-z0-9A-Z]+/g, "-").substring(0, 20) + "-" +
        accountName.toLowerCase().replace(/[^-a-z0-9A-Z]+/g, "-").substring(0, 20) + "-" +
        Math.round(Math.random() * 100000) +
        ".json";
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
        });
        return element;
    },

    recipeUrl: function(gotoUrl) {
        return $("<li>").text("Navigate to " + gotoUrl);
    },

    recipeClick: function(recipeItem) {
        return $("<li>").text("Click on '" + recipeItem.selector + "'" + (recipeItem.value ? " (usually labeled " + recipeItem.value + ")" : ""));
    },

    recipeType: function(recipeItem) {
        var pressEnter = recipeItem.pressEnter ? " and then press enter" : "";
        return $("<li>").text("Type '" + recipeItem.text + "' into '" + recipeItem.selector + "'" + pressEnter);
    },

    recipeNumber: function(recipeItem) {
        return $("<li>").text("Extract numerical value from '" + recipeItem.selector + "'");
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

    moneylog.ipc.on("scraper-result", function(_, data) {
        if (data.id === scraperId && step == 5) {
            closeScraperIfOpen();
            step = 6;
            result = data.result;
            prepareUi();
        }
    });

    $("#urlEntry").submit(loadScraper);
    $("#loginTest").submit(loginTestDone);
    $("#recordingIntro").submit(startRecording);
    $("#recording").on("reset", startRecording);
    $("#recording").submit(showTestInto);
    $("#testing").on("reset", startRecording);
    $("#testing").submit(startTesting);
    $("#saveConnection").on("reset", startRecording);
    $("#saveConnection").submit(saveConnection);
    $("#retry").click(showTestInto);

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
