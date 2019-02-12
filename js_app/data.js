const DATA_FOLDER = "data/";

let authentication = undefined;

const DataAccessor = function() {
    this.supplyData = function(file, timestamp, value) {
        const dataFile = DATA_FOLDER + file + ".data.json";
        return authentication.getFile(dataFile).then(allDataJson => {
            allDataJson = allDataJson || "[]";
            allData = JSON.parse(allDataJson);
            allData.push([ Math.round(timestamp / 1000), value ]);
            allData.sort((a, b) => a[0] - b[0]);
            allDataJson = JSON.stringify(allData);
            console.log("Updating", dataFile, allData);
            return authentication.putFile(dataFile, allDataJson);
        });
    };
};

module.exports = {

    DataAccessor: DataAccessor,

    init: function(authenticationRef) {
        authentication = authenticationRef;
    },

};
