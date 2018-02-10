var Data = require('../stores/data.js')();
var DashboardOptions = require('../stores/options.js')();
var parse_date = require("../parse_date.js").parse_date;
var ReactDom = require("react-dom");
var moment = require("moment");

var timeframes = {
	"hour": {
		id: "hour",
		columns: ["{d_date}.date", "{d_time}.hour24"],
		dimensions: {
			d_date: "d_date",
			d_time: "d_time"
		}
	},
	"day": {
		id: "day",
		columns: ["{d_date}.date"],
		dimensions: {
			d_date: "d_date",
			d_time: "d_time"
		}
	},
	"week": {
		id: "week",
		columns: ["{d_date}.week_ending_date"],
		dimensions: {
			d_date: "d_date",
			d_time: "d_time"
		}
	},
	"month": {
		id: "month",
		columns: ["{d_date}.year_month"],
		dimensions: {
			d_date: "d_date",
			d_time: "d_time"
		}
	},
	"quarter": {
		id: "quarter",
		columns: ["{d_date}.year_quarter"],
		dimensions: {
			d_date: "d_date",
			d_time: "d_time"
		}
	},
	"year": {
		id: "year",
		columns: ["{d_date}.year"],
		dimensions: {
			d_date: "d_date",
			d_time: "d_time"
		}
	}

};

function comparison(timeframe, metric, options) {

	var [metric, modifiers] = metric.split('|', 2);

	var asOfDate = options.asOf || moment();

	var timeLimit = (options.notime ? '' : `and ${timeframe.dimensions.d_time}._id<=@time(${asOfDate.format('HH:mm:ss')}`);

	var filter = {
		id: timeframe.dimensions.d_date + ".id",
		comparison: 'between',
		value: []
	};

	var [currentstart, currentend] = parse_date('last 0 ' + timeframe.id + ' to date', asOfDate);
	var [prevstart, prevend] = parse_date('last ' + timeframe.id, asOfDate);
	var todayLastPeriod = parse_date('today last ' + timeframe.id, asOfDate);

	currentend = currentend || currentstart

	filter.value = [prevstart, currentend];

	var metrics = [
		metric + `|filter:${timeframe.dimensions.d_date}._id between @date(${currentstart}) and @date(${currentend})|${modifiers}`,
		metric + `|filter:${timeframe.dimensions.d_date}._id >= @date(${prevstart}) and (${timeframe.dimensions.d_date}._id < @date(${todayLastPeriod}) or (${timeframe.dimensions.d_date}._id = @date(${todayLastPeriod}) ${timeLimit}))|${modifiers}`,
		metric + `|filter:${timeframe.dimensions.d_date}._id between @date(${prevstart}) and @date(${prevend})|${modifiers}`
	];

	return {
		filter: filter,
		metrics: metrics
	};
}

module.exports = function(element, chart, options, my) {

	var that = chart || {};

	that.guid = that.guid || Date.now() + Math.random()

	element.attr('data-guid', that.guid)

	my = my || {};

	my.dashboardOptions = DashboardOptions;

	my.graphWatching = null;
	my.optiongroup = options['leo-option-group'] || 'default';

	that.refreshInterval = DashboardOptions.getGroup(my.optiongroup).refreshRate;

	my.context = {};
	element.empty();

	if (chart.chart_id) {
		element.prop('id', chart.chart_id)
	}

	var hasColumns = (that.columns && that.columns.length > 0);
	var optionsChange = function() {

		var optionsGroup = DashboardOptions.getGroup(my.optiongroup);
		my.timeframe = $.extend(true, {}, timeframes[optionsGroup.timebreakdown], {
			periods: 2,
			dimensions: {
				d_date: options.date || "d_date",
				d_time: options.time || "d_time"
			}
		});
		if (!hasColumns && my.timeframe.columns) {
			that.columns = my.timeframe.columns.map(function(col) {
				return col.replace("{d_date}", my.timeframe.dimensions.d_date).replace("{d_time}", my.timeframe.dimensions.d_time);
			});
		}

		var hasTimeFrame = false;
		for (var j = that.filters.length - 1; j >= 0; j--) {
			var filter = that.filters[j];
			if (filter.timeframe || filter.optionsGroup) {
				that.filters.splice(j, 1);
			} else if (filter.id.match(new RegExp('^' + my.timeframe.dimensions.d_date))) {
				hasTimeFrame = true;
			}
		}

		if (optionsGroup.timeframe && !hasTimeFrame) {
			let newFilter = {
				timeframe: true
			};
			newFilter.id = optionsGroup.timeframe.id.replace("{d_date}", my.timeframe.dimensions.d_date).replace("{d_time}", my.timeframe.dimensions.d_time);
			var values = optionsGroup.timeframe.value;
			if (typeof values == 'string') {
				values = [values];
			} else {
				newFilter.comparison = "between";
			}
			for (var i = 0; i < values.length; i++) {
				values[i] = values[i].replace("{d_date}", my.timeframe.dimensions.d_date).replace("{d_time}", my.timeframe.dimensions.d_time).replace("{periods}", my.timeframe.periods - 1);
			}
			newFilter.value = values;
			that.filters.push(newFilter);
		}
		for (let id in optionsGroup.filters) {
			let f = optionsGroup.filters[id];

			let newFilter = {
				optionsGroup: true
			};
			newFilter.id = f.id;
			newFilter.value = f.value;

			that.filters.push(newFilter);
		}
		if (my.optionsChange) {
			my.optionsChange(that);
		}
	};

	DashboardOptions.on("change", function(groupId) {
		if (groupId === my.optiongroup) {
			optionsChange();
			my.graphWatching.stop();
			my.graphWatching = Data.watchGraph(that, function(dataSources) {
				my.dataSources = dataSources;
				var result = my.redraw();
				if (result) {
					ReactDom.render(result, element.get(0));
				}
				that.hideLoading();
			});
		}
	});

	DashboardOptions.on("togglechange", function(group, name, checked) {
		if (group == my.optiongroup) {
			that.toggleLegendItem(name, checked);
		}
	});

	DashboardOptions.on("togglelistchange", function(group, items) {
		if (group == my.optiongroup) {
			for (var i = 0; i < items.legendToggles.length; i++) {
				var toggle = items.legendToggles[i];
				//setTimeout(function() {
				that.toggleLegendItem(toggle.name, toggle.checked);
				//}, 1000)
			}
		}
	});

	that.showLoading = function() {
		element.append($('<div/>').addClass('leo-charts-loading').append('<span>Loading...</span>'));
	};

	that.hideLoading = function() {
		element.find('.leo-charts-loading').remove();
	};

	that.showNeedsFilter = function() {
		element.empty();
		element.append($('<div/>').addClass('leo-charts-loading').append('<span>Select a Filter to Load Data</span>'));
	};

	that.hideNeedsFilter = function() {
		element.find('.leo-charts-loading').remove();
	};

	that.toggleLegendItem = function(name, checked) {};

	that.refresh = function() {
		my.graphWatching.refresh();
	};

	that.start = function() {
		my.graphWatching = Data.watchGraph(that, function(dataSources) {
			my.dataSources = dataSources;
			var result = my.redraw();
			if (result) {
				ReactDom.render(result, element.get(0), function() {
					element.trigger("leo-after-render", [element]);
				});
			} else {
				element.trigger("leo-after-render", [element]);
			}
		});

		Data.on('loading', function(id) {
			if (id === my.graphWatching.id) {
				element.trigger("leo-loading");
				that.showLoading();
			}
		});
		Data.on('loaded', function(id) {
			if (id === my.graphWatching.id) {
				that.hideLoading();
				element.trigger("leo-complete");
			}
		});
		return that;
	};

	that.destroy = function(keepElement) {
		my.graphWatching.stop();
		DashboardOptions.off("change");
		DashboardOptions.off("togglechange");
		DashboardOptions.off("togglelistchange");
		if (keepElement) {
			element.empty();
		} else {
			element.remove();
		}
	};

	my.getComparisonMetrics = comparison;

	my.getMetricValue = function(metricNumber) {
		var result = my.getMetric(metricNumber);
		return result.rows[0][result.metricOffsets[0]];
	};

	my.getMetric = function(metricNumber) {
		var metric = that.metrics[metricNumber];
		if (!metric.field) {
			metric = {
				field: metric
			};
		}
		var metricName = metric.field;
		var columns = metric.columns || that.columns || [];

		var colors = metric.colors || [];
		var filters = metric.filters || [];

		for (var i in my.dataSources) {
			var dataSource = my.dataSources[i];

			if (!dataSource.error) {
				var hasCorrectGroupings = (
					dataSource.groups.toString() === columns.toString() &&
					dataSource.partitions.toString() === colors.toString()
					/* &&
										dataSource.filters.toString() === filters.toString()*/
				);
				if (!hasCorrectGroupings) {
					continue;
				}

				var offset = 0;
				for (let j = 0; j < dataSource.columnheaders.length; j++) {
					if (dataSource.columnheaders[j].type !== "metric") {
						offset++;
					}
				}

				var metricOffsets = [];
				for (let j = 0; j < dataSource.mapping.length; j++) {
					if (dataSource.mapping[j].id == metric.field) {
						metricOffsets.push(j);
					}
				}
				if (!metricOffsets.length) {
					continue;
				}

				return {
					metric: metric,
					rows: dataSource.rows || [],
					columns: dataSource.columns || {},
					columnheaders: dataSource.columnheaders || [],
					headers: dataSource.headers || [],
					mapping: dataSource.mapping || [],
					headerMapping: dataSource.headerMapping || [],
					metricOffsets: metricOffsets
				};
			} else {
				return {};
			}
		}
		return {};
	};

	function render() {
		my.graphWatching.stop();
		my.graphWatching = Data.watchGraph(that, function(dataSources) {
			my.dataSources = dataSources;
			element.trigger("leo-before-render");
			var result = my.redraw();
			if (result) {
				ReactDom.render(result, element.get(0), function() {
					element.trigger("leo-after-render", [element]);
				});
			} else {
				element.trigger("leo-after-render", [element]);
			}
			that.hideLoading();
		});
	}

	my.redraw = function() {};

	my.changeChart = that.changeChart = function(newParams, replace) {
		my.graphWatching.stop();
		if (replace) {
			that.columns = [];
			that.filters = [];
			that.metrics = [];
		}
		that = $.extend(true, that, newParams);
		render();
	};

	my.setFilter = function(filter, redraw = true) {
		that.filters = that.filters.filter(function(f) {
			if (f.id != filter.id) {
				return f;
			}
		});
		that.filters.push({
			id: filter.id,
			value: filter.value,
			comparison: filter.comparison || '=',
			fromController: filter.fromController || false
		});
		if (redraw && my.graphWatching) {
			render();
		}
	};

	element.data('leo', {
		setFilter: my.setFilter,
		changeChart: that.changeChart,
		removeFilter: function(filterId) {
			that.filters = that.filters.filter(function(f) {
				if (f.id != filterId) {
					return f;
				}
			});
			render();
		}
	});

	optionsChange();
	return that;
};