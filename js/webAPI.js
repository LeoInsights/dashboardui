module.exports = {
	post: function (command, data, callback) {
		$.post(window.apiEndpoint + command, JSON.stringify(data), function (res) {
				if (res.header) {
					callback(res.data);
				} else {
					if (command == 'report') {
						//cookies.write('VisualExplorer.hash', window.location.hash);
					}
					callback(res);
				}
			}, 'json')
			.fail(function () {
				callback('error');
			});
	}
};