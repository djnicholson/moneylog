document.body.onload = function() {

    var formatNumber = function(n) {
        return "$" + n;
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
        return row;
    };

    var renderTable = function(connections) {
        $("tbody").empty();
        for (var filename in connections) {
            var state = connections[filename].state;
            if (!lastAttemptTimestamp || (state.lastFail && (state.lastFail > lastAttemptTimestamp))) {
                lastAttemptTimestamp = state.lastFail;
            }

            var status = state ? (state.failCount ? "X" : " ") : "?";
            var lastSuccess = (state && state.lastSuccess) ? unixTimestampToString(state.lastSuccess) : "Never";
            var lastAttemptTimestamp = state.lastSuccess;
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

