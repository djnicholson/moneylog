document.body.onload = function() {

    var formatNumber = function(n) {
        return "$" + n;
    };

    var renderActionsCell = function(filename) {
        var cell = $($("#template-actionsCell").html());
        cell.find(".-edit").click(function() { window.location.href = "editconnection.html#" + filename; });
        return cell;
    };

    var renderCell = function(contents) {
        var cell = $("<td>");
        cell.text(contents);
        return cell;
    };

    var renderRow = function(status, filename, lastSuccess, lastAttempt, balance) {
        var row = $("<tr>");
        row.append(renderCell(status));
        row.append(renderCell(filename));
        row.append(renderCell(lastSuccess));
        row.append(renderCell(lastAttempt));
        row.append(renderCell(balance));
        row.append(renderActionsCell(filename));
        return row;
    };

    var renderTable = function(connections) {
        $("tbody").empty();
        for (var filename in connections) {
            var state = connections[filename].state;
            var lastSuccessTimestamp = (state && state.lastSuccess) || 0;
            var lastFailTimestamp = (state && state.lastFail) || 0;
            var lastAttemptTimestamp = Math.max(lastSuccessTimestamp, lastFailTimestamp);
            var status = state ? (state.failCount ? "X" : " ") : "?";
            var lastSuccess = lastSuccessTimestamp ? unixTimestampToString(lastSuccessTimestamp) : "Never";
            var lastAttempt = lastAttemptTimestamp ? unixTimestampToString(lastAttemptTimestamp) : "Never";
            var balance = state ? (typeof state.result == "number" ? formatNumber(state.result) : " ") : " ";
            $("tbody").append(renderRow(status, filename, lastSuccess, lastAttempt, balance));
        }
    };

    var unixTimestampToString = function(timestamp) {
        return (new Date(timestamp)).toString();
    };

    moneylog.connections.onUpdate(renderTable);
    renderTable(moneylog.connections.getConnections());
};

