var Highcharts = require('highcharts');

var optionGroups = {};
function getGroup(group) {
  if(!(group in optionGroups)) {
    optionGroups[group] = $.extend(true, {}, {
        filters: {},
        timeframe: null,
//        timebreakdown: "month",
        legendToggles: [],
        refreshRate: {minutes: 30}
    }, optionGroups[group]);
  }
  return optionGroups[group];
}


module.exports = require("../react/flux/store.js")(function (my,dispatcher) {
  dispatcher.on("options.reset",  (e)=> {
    optionGroups = {};
  });
  
  dispatcher.on("options.setFilter", (e)=> {
    var group = getGroup(e.group);
    if(e.isRequired && (!e.value || e.value.length == 0)) {
      e.value = ["-99999999"];
    }
    group.filters[e.id] = {
        id: e.id,
        comparison: e.comparison || "in",
        value: e.value,
        checkboxes: e.checkboxes,
        label:e.label,
        api:e.api,
        isRequired: e.isRequired || false,
        singleValue: e.singleValue || false
    };
    my.emit("change", e.group, group);
  });
  
  dispatcher.on("options.deleteFilter", (e)=> {
    var group = getGroup(e.group);
    delete group.filters[e.id];
    my.emit("change", e.group, group);
  });
  
  dispatcher.on("options.setTimeFilter", (e)=> {
    var group = getGroup(e.group);
    group.timeframe = {id: "{d_date}.id", value: e.value};
    my.emit("change", e.group, group);
  });
  
  dispatcher.on("options.setTimeBreakdown", (e)=> {
    var group = getGroup(e.group);
    group.timebreakdown = e.breakdown;
    my.emit("change", e.group, group);
  });
  
  dispatcher.on("options.setLegendToggles",  (e)=> {
    var group = getGroup(e.group);
    group.legendToggles = e.items;
    for(var i = 0; i < e.items.length; i++) {
      var toggle = e.items[i];
      if(toggle.color) {
        this.setColor(toggle.name, toggle.color);
      } else {
        toggle.color = this.getColor(toggle.name);
      }
    }
    my.emit("togglelistchange", e.group, group);
  });
  dispatcher.on("options.setLegendToggle",  (e)=> {
    var group = getGroup(e.group);
    for(var i = 0; i < group.legendToggles.length; i++) {
      var toggle = group.legendToggles[i];
      
      if(toggle.name == e.name) {
        toggle.checked = e.status;
        my.emit("togglechange", e.group, toggle.name, toggle.checked);    
        break;
      }
    }
  });
  dispatcher.on("options.setColor",  (e)=> {
    var group = getGroup(e.group);
    this.setColor(e.seriesName, e.color);
  });
  dispatcher.on("options.setRefresh",  (e)=> {
    var group = getGroup(e.group);
    group.refreshRate  = e.rate;
  });
  
  
  this.getGroup = getGroup;
  
  var colorCount = 0;
  var colors = Highcharts.getOptions().colors;
  var serieColorMap = {};
  this.setColor = function(seriesName, color) {
    serieColorMap[seriesName.trim().toLowerCase()]=color;
  }
  this.getColor = function(seriesName) {
    seriesName = seriesName.toString().toLowerCase();
    if(!(seriesName in serieColorMap)) {
       serieColorMap[seriesName]=colors[colorCount++];
    }
    return serieColorMap[seriesName];
  }
  this.isToggleOn = function(seriesName,group='default') {
    var group = getGroup(group);
    var toggleExists = group.legendToggles.map(function(e) { return e.name;}).indexOf(seriesName);
    if(toggleExists >= 0 && group.legendToggles[toggleExists].checked !== true) {
      return false;
    }
    return true;
  }
  
});
