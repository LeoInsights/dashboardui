var React = require('react');
var table = require('../../charts/custom/table.js');

class TableView extends React.Component {
    state = {};

    componentWillUnmount() {
        //this.chart.stop();
    }

    componentDidMount() {
        var columns = this.props.params.rowDims;
        var metrics =
            this.props.params.rowMetrics || this.props.params.columnMetrics;
        var partitions = this.props.params.columnDims;
        var filters = this.props.params.filters;

        var params = $.extend(
            true,
            {
                columns: [],
                metrics: [],
                partitions: [],
                filters: []
            },
            {
                columns: columns,
                metrics: metrics,
                partitions: partitions,
                filters: filters
            }
        );

        this.chart = table($(this.refs.body), params, {
            width: 500,
            height: 200
        }).start();
    }

    close() {
        React.unmountComponentAtNode(
            $(this)
                .parent()
                .get(0)
        );
    }

    copyToClipboard() {
        /*
		//The Report Store is in charge of output
		var exportData = ReportStore.exportData(true);
		var copyReportInput = $("#copyReportInput");
		if (!copyReportInput.length) {
			copyReportInput = $('<textarea id="copyReportInput" type="text" name="copyReportInput"></textarea>').appendTo("body");
		}
		copyReportInput.val(exportData);
		/* */
    }

    downloadTable() {
        /*
		exportReport(a) {	
		//The Report Store is in charge of output
		var exportData = ReportStore.exportData();

		if (exportData.length > 10000) {
			var downloadForm = $("#warehouse-downloadform");
			if(!downloadForm.length) {
				downloadForm = $('<div id="warehouse-downloadform" style="display: none"><form method="POST" action="/download" /></div>').appendTo("body");
			}
			var inputtitle = $('<input type="hidden" name="title" value="Datawarehouse Export.csv"/>');
			var inputdata = $('<input type="hidden" name="data" />');
			inputdata.val(exportData);
			downloadForm.find("form").attr("action", "/download").empty().append(inputtitle).append(inputdata).submit();
			return true;
		} else {
			a.attr("download","Datawarehouse Export.csv").attr("href", "data:text/csv;charset=utf-8,\ufeff" + encodeURIComponent(exportData));
		}
		/* */
    }

    render() {
        return (
            <div className="dialog-box">
                <header>
                    Table View
                    <i
                        className="close pull-right icon-cancel"
                        onClick={() => this.close}
                    ></i>
                </header>
                <div className="body" ref="body"></div>
                <footer>
                    {/*<button type="button" onClick={this.copyToClipboard}>copy to clipboard</button>
				
				<button type="button" onClick={this.downloadTable}>download</button>*/}

                    <button
                        className="close"
                        type="button"
                        onClick={() => this.close}
                    >
                        close
                    </button>
                </footer>
            </div>
        );
    }
}

module.exports = TableView;
