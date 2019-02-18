document.body.onload = function() {

    var model = {
        filename: "my-connection",
        variables: { 
            username: "john.smith",
            password: "P@ssword!",
        },
        script: "page.goto('https://www.example.com/').then(() => {\n    // ...\n    result = 1;\n});",
    };

    var dom = {
        cancelButton: $(".-cancel"),
        filenameInput: $(".-filename"),
        newSessionCheckbox: $(".-new-session"),
        saveButton: $(".-save"),
        scriptInput: $("textarea"),
        startTestButton: $(".-start-test"),
        testResult: $(".-test-result"),
        variablesContainer: $(".-variables"),
        variables: function() { return $(".-variable"); },
    };

    var goHome = function() {
        window.location.href = "connections.html";
    };

    var save = function() {
        if (model.filename.length) {
            moneylog.ipc.saveConnection(model);
            // TODO: Error handling
            goHome();
        } else {
            alert("You must enter a filename to save this connection");
        }
    };

    var startTest = function() {
        moneylog.ipc.runnerTest(model, dom.newSessionCheckbox.prop("checked"));
        dom.testResult.text("Running script...");
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

        model.filename = dom.filenameInput.val().replace(/[^-a-zA-Z0-9.]+/g, "-");
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

        dom.filenameInput.val(model.filename);
    };

    moneylog.ipc.on("runner-result", (event, result) => {
        dom.testResult.text(typeof result == "number" ? "Result: " + result : "There was an error running your script, result: " + result);
    });

    dom.scriptInput.on("change", updateModel);
    dom.filenameInput.on("change", updateModelThenView);
    dom.startTestButton.on("click", startTest);
    dom.saveButton.on("click", save);
    dom.cancelButton.on("click", goHome);

    var filename = window.location.hash.substring(1);
    var connections = moneylog.connections.getConnections();
    if (connections && connections[filename] && connections[filename].model) {
        model = connections[filename].model;
    }

    updateView();

};

