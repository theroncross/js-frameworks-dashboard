'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var graphs = document.getElementById('graph-list');
var rootUrl = 'https://api.github.com';
var NS = 'http://www.w3.org/2000/svg';
var frameworks = [{ org: 'facebook', repo: 'react', color: '#61DAFB' }, { org: 'angular', repo: 'angular', color: '#DD1B16' }, { org: 'emberjs', repo: 'ember.js', color: '#E46651' }, { org: 'vuejs', repo: 'vue', color: '#41B883' }];

// Utility Functions

var setAttributes = function setAttributes(el, attrs) {
  Object.keys(attrs).forEach(function (attr) {
    el.setAttributeNS(null, attr, attrs[attr]);
  });
};

var svg = function svg(tag) {
  var newSvg = document.createElementNS(NS, tag);
  return newSvg;
};

// 'Components'

var bar = function bar(attrs) {
  var value = attrs.value;
  var width = attrs.width;
  var height = attrs.height;
  var fill = attrs.fill;
  var i = attrs.i;


  var newBar = svg('g');
  setAttributes(newBar, {
    transform: 'translate(' + width * i + ', 0)'
  });

  var newRect = svg('rect');
  setAttributes(newRect, {
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
  var labels = _attrs$labels === undefined ? [Math.round(value)] : _attrs$labels;

  var newAxis = svg('g');
  setAttributes(newAxis, {
    transform: 'translate(0, ' + (height - value) + ')'
  });

  var line = svg('line');
  setAttributes(line, {
    x2: width,
    y2: '0',
    stroke: stroke,
    'stroke-width': '1px'
  });

  if (labels.length) {
    labels.forEach(function (label, i) {
      var newLabel = svg('text');
      setAttributes(newLabel, {
        x: width * i / labels.length,
        y: '15',
        stroke: stroke
      });
      newLabel.innerHTML = label;
      newAxis.appendChild(newLabel);
    });
  }
  newAxis.appendChild(line);
  return newAxis;
};

var graph = function graph(attrs) {
  var data = attrs.data;
  var repo = attrs.repo;
  var color = attrs.color;
  var max = attrs.max;

  var height = max > 100 ? max : 100;
  var width = 0.5 * window.innerWidth;
  var barWidth = width / data.length;

  var newGraph = svg('svg');
  setAttributes(newGraph, {
    class: 'graph',
    id: repo,
    height: height,
    width: width
  });

  var axes = [{ value: 0, width: width, height: height }, { value: height / 2, width: width, height: height }, { value: height, width: width, height: height }];
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

  var daysAgo = [];
  for (var i = 0; i <= 6; i++) {
    daysAgo.push(i);
  }

  var entryAges = entries.map(function (entry) {
    return age(entry);
  });

  return daysAgo.map(function (days) {
    return entryAges.reduce(function (total, entryAge) {
      return days === entryAge ? total + 1 : total;
    }, 0);
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

var routes = function routes(measurement) {
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

var frameworkObjs = function frameworkObjs(response) {
  var isAge = !response[0].all;
  var ageWeighted = function ageWeighted(data) {
    return data.reduce(function (sum, d, i) {
      return sum + d * i;
    }) / data.length;
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
    fw.avg = isAge ? ageWeighted(fw.data) : mean(fw.data);
    var repo = fw.repo;
    var data = fw.data;
    var color = fw.color;
    var max = fw.max;
    var avg = fw.avg;

    fw.graph = graph({ repo: repo, data: data, color: color, max: max, avg: avg });
    return fw;
  });
};

// dom interaction

var renderGraphs = function renderGraphs(fws) {
  graphs.innerHTML = '';
  fws.forEach(function (fw) {
    var graphContainer = document.createElement('div');
    graphContainer.setAttribute('id', 'graph-container');
    var title = document.createElement('h2');
    title.innerHTML = '' + fw.repo.toUpperCase();
    graphContainer.appendChild(title);
    graphContainer.appendChild(fw.graph);
    graphs.appendChild(graphContainer);
  });
};

var displayError = function displayError(error) {
  var errorMessage = document.createElement('p');
  errorMessage.innerHTML = 'There was a problem loading the data.';
  graphs.appendChild(errorMessage);
  console.error('Error loading data: ' + error);
};

var show = function show(attrs) {
  var measurement = attrs.measurement;
  var stat = attrs.stat;
  var order = attrs.order;

  fetchData(routes(measurement)).then(function (response) {
    return response;
  }).then(function (arrs) {
    var selectedFws = frameworkObjs(arrs).sort(function (a, b) {
      return order === 'asc' ? a[stat] - b[stat] : b[stat] - a[stat];
    });
    renderGraphs(selectedFws);
  }).catch(function (error) {
    displayError(error);
  });
};

var handleChange = function handleChange() {
  var descriptions = {
    comments: 'The age of the most recent comments (limit 100) in days',
    participation: 'Total commits per week by all users for the last year',
    pulls: 'The age of the most recent pull requests (limit 100) in days'
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