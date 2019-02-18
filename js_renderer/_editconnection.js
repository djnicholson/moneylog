document.body.onload = function() {

    var model = {
        variables: { },
        script: "page.goto('https://www.example.com/');\n\n//...\n\nresult = 123;",
    };

    var dom = {
        cancelButton: $(".-cancel"),
        newSessionCheckbox: $(".-new-session"),
        scriptInput: $("textarea"),
        startTestButton: $(".-start-test"),
        variablesContainer: $(".-variables"),
        variables: function() { return $(".-variable"); },
    };

    var startTest = function() {
        moneylog.ipc.runnerTest(model, dom.newSessionCheckbox.prop("checked"));
    };

    var updateModel = function() {
        model.variables = {};
        var domVariables = dom.variables();
        for (var i = 0; i < domVariables.length; i++) {
            var name = $(domVariables[i]).find(".-name").val();
            var value = $(domVariables[i]).find(".-value").val();
            if (name.length || value.length) {
                model.variables[name] = value;
            }
        }

        model.script = dom.scriptInput.val();
    };

    var updateModelThenView = function() {
        updateModel();
        updateView();
    };

    var updateView = function() {
        dom.variablesContainer.empty();

        var addVariable = function(name, value) {
            var element = $($("#template-variableFormRow").html());
            element.find(".-name").val(name);
            element.find(".-name").on("change", updateModelThenView);
            element.find(".-value").val(value);
            element.find(".-value").on("change", updateModelThenView);
            dom.variablesContainer.append(element);
        };

        for (var variableName in model.variables) {
            addVariable(variableName, model.variables[variableName]);
        }

        addVariable("", ""); // blank row for new value

        dom.scriptInput.val(model.script);
    };

    dom.scriptInput.on("change", updateModel);
    dom.startTestButton.on("click", startTest);
    dom.cancelButton.on("click", () => { window.location.href = "home.html"; });

    updateView();

};

