var numeral = require("numeral");
var format = require("../format.js");

var Highcharts = require('highcharts');

numeral.register('locale', 'en-gb', {
	delimiters: {
		thousands: ',',
		decimal: '.'
	},
	abbreviations: {
		thousand: 'k',
		million: 'm',
		billion: 'b',
		trillion: 't'
	},
	ordinal: function(number) {
		var b = number % 10;
		return (~~(number % 100 / 10) === 1) ? 'th' :
			(b === 1) ? 'st' :
			(b === 2) ? 'nd' :
			(b === 3) ? 'rd' : 'th';
	},
	currency: {
		symbol: '£'
	}
});

numeral.register('locale', 'nl', {
	delimiters: {
		thousands: '.',
		decimal: ','
	},
	abbreviations: {
		thousand: 'k',
		million: 'm',
		billion: 'b',
		trillion: 't'
	},
	currency: {
		symbol: '€'
	}
});


module.exports = {
	moment: require("moment"),
	parse_date: require("../parse_date.js"),
	numeral: require("numeral"),

	setLocale: function(locale) {
		var self = this;
		self.locale = locale;
		self.numeral.locale(locale);
		var lang = self.numeral.localeData();
		Highcharts.setOptions({
			lang: {
				decimalPoint: lang.delimiters.decimal,
				thousandsSep: lang.delimiters.thousands
			}
		});
	},

	format: {
		money: format.get({
			format: "money"
		}),
		count: format.get({
			format: "count"
		}),
		number: format.get({
			format: "int"
		}),
		percent: format.get({
			format: "percent"
		}),
		percentChange: function(now, then) {
			return (!now || !then) ? 'N/A' : format.get({
				format: "percent"
			})(((now - then) / then));
		}
	}
};
