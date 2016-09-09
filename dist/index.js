'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

// Utility Functions

var elWithAttrs = function elWithAttrs(attrs) {
  var tag = attrs.tag;

  var rest = _objectWithoutProperties(attrs, ['tag']);

  var NS = 'http://www.w3.org/2000/svg';
  var newEl = document.createElementNS(NS, tag);

  Object.keys(attrs).forEach(function (attr) {
    newEl.setAttributeNS(null, attr, attrs[attr]);
  });

  return newEl;
};

// 'Components'

var bar = function bar(attrs) {
  var value = attrs.value;
  var width = attrs.width;
  var height = attrs.height;
  var fill = attrs.fill;
  var i = attrs.i;


  var newBar = elWithAttrs({
    tag: 'g',
    transform: 'translate(' + width * i + ', 0)'
  });

  var newRect = elWithAttrs({
    tag: 'rect',
    width: '' + (width - 2),
    y: '' + (height - value),
    height: value,
    fill: fill
  });

  newBar.appendChild(newRect);
  return newBar;
};

var axis = function axis(attrs) {
  var value = attrs.value;
  var width = attrs.width;
  var height = attrs.height;
  var _attrs$stroke = attrs.stroke;
  var stroke = _attrs$stroke === undefined ? 'silver' : _attrs$stroke;
  var _attrs$labels = attrs.labels;
  var labels = _attrs$labels === undefined ? [Math.round(value), ''] : _attrs$labels;


  var newAxis = elWithAttrs({
    tag: 'g',
    transform: 'translate(0, ' + (height - value) + ')'
  });

  var newLine = elWithAttrs({
    tag: 'line',
    x2: width,
    y2: '0',
    stroke: stroke,
    'stroke-width': '1px'
  });

  if (labels) {
    labels.forEach(function (label, i) {
      var newLabel = elWithAttrs({
        tag: 'text',
        x: width * i / (labels.length - 1),
        y: '15',
        stroke: stroke
      });
      newLabel.innerHTML = label;
      newAxis.appendChild(newLabel);
    });
  }

  newAxis.appendChild(newLine);
  return newAxis;
};

var graph = function graph(attrs) {
  var data = attrs.data;
  var repo = attrs.repo;
  var color = attrs.color;
  var max = attrs.max;
  var labels = attrs.labels;

  var height = max > 100 ? max : 100;
  var width = 0.5 * window.innerWidth;
  var barWidth = width / data.length;

  var newGraph = elWithAttrs({
    tag: 'svg',
    class: 'graph',
    id: repo,
    height: height + 20,
    width: width + 30
  });

  var axes = [{ value: 0, width: width, height: height, labels: labels }, { value: height / 2, width: width, height: height }, { value: height, width: width, height: height }];
  axes.forEach(function (newAxis) {
    return newGraph.appendChild(axis(newAxis));
  });

  data.forEach(function (datum, i) {
    var barAttrs = { value: datum, fill: color, width: barWidth, height: height, i: i };
    newGraph.appendChild(bar(barAttrs));
  });

  return newGraph;
};

// data fetching and parsing

var mapAges = function mapAges(entries) {
  var age = function age(entry) {
    return Math.round((Date.now() - new Date(entry.created_at)) / (1000 * 60 * 60 * 24));
  };

  return entries.map(function (entry) {
    return age(entry);
  });
};

var tallyAges = function tallyAges(ages) {
  var days = [];
  for (var i = 6; i >= 0; i--) {
    days.push(i);
  }

  return days.map(function (day) {
    return ages.filter(function (age) {
      return day === age;
    }).length;
  });
};

var fetchData = function fetchData(routes) {
  var fetches = routes.map(function (route) {
    return fetch(route).then(function (response) {
      return response.json();
    });
  });

  return Promise.all(fetches);
};

var routes = function routes(attrs) {
  var measurement = attrs.measurement;
  var frameworks = attrs.frameworks;

  var rootUrl = 'https://api.github.com';
  var routeSuffixes = {
    participation: 'stats/participation',
    comments: 'issues/comments?sort=created&direction=desc&per_page=100',
    pulls: 'pulls?sort=created&state=all&direction=desc&per_page=100'
  };

  return frameworks.map(function (fw) {
    var org = fw.org;
    var repo = fw.repo;

    return rootUrl + '/repos/' + org + '/' + repo + '/' + routeSuffixes[measurement];
  });
};

var frameworkObjs = function frameworkObjs(attrs) {
  var response = attrs.response;
  var frameworks = attrs.frameworks;

  var isAge = !response[0].hasOwnProperty('all');
  var ageWeighted = function ageWeighted(data) {
    return data.reduce(function (sum, d, i) {
      return (sum + d * i) / data.length;
    });
  };
  var mean = function mean(data) {
    return data.reduce(function (sum, d) {
      return sum + d;
    }) / data.length;
  };

  return frameworks.map(function (framework, i) {
    var fw = Object.assign({}, framework);
    fw.data = isAge ? mapAges(response[i]) : response[i].all;
    fw.max = Math.max.apply(Math, _toConsumableArray(fw.data));
    fw.median = fw.data[Math.round(fw.data.length / 2)];
    fw.units = isAge ? 'days ago' : 'commits/week';
    fw.labels = isAge ? [fw.units, '3', 'now'] : [fw.units, '26', 'now'];
    fw.graph = graph(_extends({}, fw, { data: isAge ? tallyAges(fw.data) : fw.data }));
    return fw;
  });
};

// dom interaction

var renderGraphs = function renderGraphs(frameworks) {
  var graphList = document.getElementById('graph-list');
  graphList.innerHTML = '';
  frameworks.forEach(function (fw) {
    var graphContainer = document.createElement('div');
    graphContainer.setAttribute('id', 'graph-container');
    var title = document.createElement('h2');
    title.innerHTML = fw.repo.toUpperCase();
    var avg = document.createElement('h4');
    avg.innerHTML = 'Median: ~' + fw.median + ' ' + fw.units;
    graphContainer.appendChild(title);
    graphContainer.appendChild(avg);
    graphContainer.appendChild(fw.graph);
    graphList.appendChild(graphContainer);
  });
};

var displayError = function displayError(error) {
  var graphList = document.getElementById('graph-list');
  var errorMessage = document.createElement('p');
  errorMessage.innerHTML = 'There was a problem loading the data.';
  graphList.appendChild(errorMessage);
  console.error('Error loading data: ' + error);
};

var show = function show(attrs) {
  var measurement = attrs.measurement;
  var stat = attrs.stat;
  var order = attrs.order;

  var frameworks = [{ org: 'facebook', repo: 'react', color: '#61DAFB' }, { org: 'angular', repo: 'angular', color: '#DD1B16' }, { org: 'emberjs', repo: 'ember.js', color: '#E46651' }, { org: 'vuejs', repo: 'vue', color: '#41B883' }];

  fetchData(routes({ measurement: measurement, frameworks: frameworks })).then(function (response) {
    var selectedFws = frameworkObjs({ response: response, frameworks: frameworks }).sort(function (a, b) {
      return order === 'asc' ? a[stat] - b[stat] : b[stat] - a[stat];
    });
    renderGraphs(selectedFws);
  }).catch(function (error) {
    displayError(error);
  });
};

var handleChange = function handleChange() {
  var descriptions = {
    participation: 'Total commits by all users for the last year, by week',
    comments: 'Age of the 100 most recent comments (showing previous week)',
    pulls: 'Age of 100 most recent pull requests (showing previous week)'
  };

  var fields = [].concat(_toConsumableArray(document.getElementById('graph-selection-form').elements));
  document.getElementById('description').innerHTML = descriptions[fields[0].value];
  show({ measurement: fields[0].value, stat: fields[1].value, order: fields[2].value });
};

window.onload = function () {
  handleChange();
  window.setInterval(handleChange, 2 * 60 * 1000);
  document.getElementById('graph-selection-form').addEventListener('change', handleChange);
};