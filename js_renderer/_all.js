var allModules = [
    "../js_renderer/authentication.js",
    "../js_renderer/connections.js",
    "../js_renderer/ui.js",
];

var appendScript = function(src) {
    var element = document.createElement('script');
    element.setAttribute("src", src);
    document.body.appendChild(element);
    return element;
};

appendScript("../node_modules/jquery/dist/jquery.js").onload = function() {
    appendScript("../node_modules/popper.js/dist/umd/popper.js").onload = function() {
        appendScript("../node_modules/bootstrap/dist/js/bootstrap.bundle.js").onload = function() {
            for (var i = 0; i < allModules.length; i++) {
                appendScript(allModules[i]);
            }
        };
    };
};



