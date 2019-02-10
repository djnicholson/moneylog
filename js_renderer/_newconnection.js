var scraperId = null;

var closeExistingScraper = function() {
    if (scraperId != null) {
        moneylog.ipc.closeScraper(scraperId);
        scraperId = null;
    }
};

var loadScraper = function () {
    closeExistingScraper();
    var url = $("input[type=url]").val();
    scraperId = moneylog.ipc.openScraper(url);
    return false; // prevent form submission
};

document.body.onload = function() {
    $("#urlEntry").submit(loadScraper);
};
