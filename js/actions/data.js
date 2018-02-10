var api = require("../webAPI.js");
var format = require("../format.js");

module.exports = require("../react/flux/action.js")(function (my,dispatcher) {
	this.load = function(id, data) {

		var apiData = {
			groups: data.groups,
			partitions: data.partitions,
			metrics: data.metrics,
			filters: data.filters,
			apikey:window.apiKey,
			redshift: true,
			numericFormat: true,
			sort: data.sort
		};

//    sort[0][column]:f_airbill|count
//    sort[0][direction]:asc

		api.post("report", apiData, function(result) {
			if (result === 'error') {
				result = { error: true };
			}
			result.groups = data.groups;
			result.partitions = data.partitions;
			if(!result.error) {
				for(var columnId in result.columns) {
					result.columns[columnId].formatter = format.get(result.columns[columnId]);
				}
				for(var i = 0; i < result.mapping.length; i++) {
					result.mapping[i].formatter = format.get(result.mapping[i]);
				}
			}
			dispatcher.emit("data.data", {id: id, data: result});
		});
	};

	this.reset = function() {
		dispatcher.emit("data.reset");
	};
	this.refresh = function() {
		dispatcher.emit("data.refresh");
	}

	this.downloadData = function(title, data) {
		var downloadForm = $("#downloadform");
		if(!downloadForm.length) {
			downloadForm = $('<div id="downloadform" style="display: none"><form method="POST" action="'+window.apiEndpoint+'download" /></div>').appendTo("body");
		}
		var inputtitle = $('<input type="hidden" name="title" value="'+title+'.csv"/>');
		var inputdata = $('<input type="hidden" name="data" />');
		inputdata.val(data.map(function(r) {return r.join(",");}).join("\r\n"));
		downloadForm.find("form").empty().append(inputtitle).append(inputdata).submit();
	}
});
