var numeral = require("numeral");

module.exports = function () {
	var that = {};
	that.getComparator = function (column, field) {
		if (column.type == 'metric') {
			return function (a, b, nullMultiplier) {
				if (nullMultiplier == undefined) nullMultiplier = 1;
				if (a[field] === b[field]) {
					return 0;
				} else if (b[field] === null || b[field] === undefined) {
					return 1 * nullMultiplier;
				} else if (a[field] === null || a[field] === undefined) {
					return -1 * nullMultiplier;
				} else {
					return a[field] - b[field];
				}
			};
		} else if (column.sort && column.sort.type) {
			switch (column.sort.type) {
			case "enum":
				var order = {};
				var order_count = 0;
				for (var i = 0; i < column.sort.values.length; i++) {
					order[column.sort.values[i].toLowerCase()] = i;
					order_count++;
				}
				return function (a, b) {
					var sortA = order[a[field].toLowerCase()];
					var sortB = order[b[field].toLowerCase()];
					if (sortA === undefined) {
						order[a[field].toLowerCase()] = ++order_count;
						sortA = order[a[field].toLowerCase()];
					}
					if (sortB === undefined) {
						order[b[field].toLowerCase()] = ++order_count;
						sortB = order[b[field].toLowerCase()];
					}
					return sortA - sortB;
				};
				break;

			case "int":
				return function (a, b, nullMultiplier) {
					if (nullMultiplier == undefined) nullMultiplier = 1;
					if (a[field] === b[field]) {
						return 0;
					} else if (b[field] === null || b[field] === undefined || b[field] === "") {
						return 1 * nullMultiplier;
					} else if (a[field] === null || a[field] === undefined || a[field] === "") {
						return -1 * nullMultiplier;
					} else {
						return parseInt(a[field]) - parseInt(b[field]);
					}
				};
				break;

			case "float":
			case "money":
				return function (a, b, nullMultiplier) {
					if (nullMultiplier == undefined) nullMultiplier = 1;
					if (a[field] === b[field]) {
						return 0;
					} else if (b[field] === null || b[field] === undefined || b[field] === "") {
						return 1 * nullMultiplier;
					} else if (a[field] === null || a[field] === undefined || a[field] === "") {
						return -1 * nullMultiplier;
					} else {
						return parseFloat(numeral().unformat(a[field])) - parseFloat(numeral().unformat(b[field]));
					}
				};
				break;

			case "pattern":
				var sort = column.sort;
				// ex. 2014 December -- /^(\d+) (\W)$/, "int", "enum"
				// {
				// type: 'pattern',
				// pattern: '(d+) (.*)',
				// order: [
				// {group: 1, type: 'int'},
				// {group: 2, type: 'enum', values: ['January','February','March','April','May','June','July','August','September':'October','November','December']}
				// ]
				// }
				// ex. 2014 Q4 -- /^(\d+) Q(\d)$/, "int", "int"
				// ex. 2014-Q4 -- /^(\d+)\-Q(\d)$/, "int", "int"
				// ex.
				var pattern = new RegExp("^\\s*" + sort.pattern + "\\s*$");
				var sorts = [];
				for (var i = 0; i < sort.order.length; i++) {
					var s = sort.order[i];
					var order = {};
					var count = 0;
					if (s.values) {
						for (var x = 0; x < s.values.length; x++) {
							order[s.values[x].toLowerCase()] = x;
							count++;
						}
					}

					sorts.push({
						type: s.type,
						group: s.group,
						order: order,
						order_count: count
					});
				}
				var sortLength = sorts.length;
				return function (a, b) {
					var aMatches = pattern.exec(a[field]);
					var bMatches = pattern.exec(b[field]);

					if (aMatches == null || bMatches == null) {
						return a[field].toString().localeCompare(b[field]);
					}

					var sort, one, two;
					for (var i = 0; i < sortLength; i++) {
						sort = sorts[i];
						one = aMatches[sort.group];
						two = bMatches[sort.group];
						if (sort.type == "int" || sort.type == "float") {
							if (one !== two) {
								return one - two;
							}
						} else if (sort.type == "enum") {
							var sortA = sort.order[one.toLowerCase()];
							var sortB = sort.order[two.toLowerCase()];
							if (sortA === undefined) {
								sort.order[one.toLowerCase()] = ++sort.order_count;
								sortA = sort.order[one.toLowerCase()];
							}
							if (sortB === undefined) {
								sort.order[two.toLowerCase()] = ++sort.order_count;
								sortB = sort.order[two.toLowerCase()];
							}
							if (one !== two) {
								return sortA - sortB;
							}
						} else {
							if (one !== two) {
								return one.toString().localeCompare(two);
							}
						}
					}
					return 0;
				};
				break;

			default: // "String"
				return function (a, b) {
					if (b[field] === undefined || b[field] === null) {
						return -1;
					} else if (a[field] === undefined || a[field] === null) {
						return 1;
					}
					return a[field].toString().localeCompare(b[field]);
				};
				break;
			}
		} else { // "String"
			return function (a, b) {
				if (b[field] === undefined || b[field] === null) {
					return -1;
				} else if (a[field] === undefined || a[field] === null) {
					return 1;
				}
				return a[field].toString().localeCompare(b[field]);
			};
		}
	};
	that.getMultiCompare = function (sorts, mapping) {
		var comparators = [];
		var directions = [];
		if (sorts == undefined) sorts = [];
		var length = sorts.length;
		for (var i = 0; i < length; i++) {
			var sort = sorts[i];
			if (!sort.direction) {
				sort.direction = 'asc';
			}
			if (sort.column in mapping) {
				comparators.push(that.getComparator(mapping[sort.column], sort.column));
				directions.push(sort.direction.toLowerCase() == 'asc' ? 1 : -1);
			}
		}
		return function (a, b) {
			var v = 0;
			for (i = 0; i < length; i++) {
				v = comparators[i](a, b, directions[i] * -1);
				if (v !== 0) {
					return directions[i] * v;
				}
			}
			return 0;
		};
	};
	return that;
}();