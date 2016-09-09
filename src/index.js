const graphs = document.getElementById('graph-list');
const rootUrl = 'https://api.github.com';
const NS = 'http://www.w3.org/2000/svg';
const frameworks = [
  { org: 'facebook', repo: 'react', color: '#61DAFB' },
  { org: 'angular', repo: 'angular', color: '#DD1B16' },
  { org: 'emberjs', repo: 'ember.js', color: '#E46651' },
  { org: 'vuejs', repo: 'vue', color: '#41B883' },
];

// Utility Functions

const setAttributes = (el, attrs) => {
  Object.keys(attrs).forEach((attr) => {
    el.setAttributeNS(null, attr, attrs[attr]);
  });
};

const svg = (tag) => {
  const newSvg = document.createElementNS(NS, tag);
  return newSvg;
};

// 'Components'

const bar = (attrs) => {
  const { value, width, height, fill, i } = attrs;

  const newBar = svg('g');
  setAttributes(newBar, {
    transform: `translate(${width * i}, 0)`,
  });

  const newRect = svg('rect');
  setAttributes(newRect, {
    width: `${width - 2}`,
    y: `${height - value}`,
    height: value,
    fill,
  });

  newBar.appendChild(newRect);
  return newBar;
};

const axis = (attrs) => {
  const { value, width, height, stroke = 'silver', labels = [Math.round(value)] } = attrs;
  const newAxis = svg('g');
  setAttributes(newAxis, {
    transform: `translate(0, ${height - value})`,
  });

  const line = svg('line');
  setAttributes(line, {
    x2: width,
    y2: '0',
    stroke,
    'stroke-width': '1px',
  });

  if (labels.length) {
    labels.forEach((label, i) => {
      const newLabel = svg('text');
      setAttributes(newLabel, {
        x: (width * i) / labels.length,
        y: '15',
        stroke,
      });
      newLabel.innerHTML = label;
      newAxis.appendChild(newLabel);
    });
  }
  newAxis.appendChild(line);
  return newAxis;
};

const graph = (attrs) => {
  const { data, repo, color, max } = attrs;
  const height = max > 100 ? max : 100;
  const width = 0.5 * window.innerWidth;
  const barWidth = width / data.length;

  const newGraph = svg('svg');
  setAttributes(newGraph, {
    class: 'graph',
    id: repo,
    height,
    width,
  });

  const axes = [
    { value: 0, width, height },
    { value: height / 2, width, height },
    { value: height, width, height },
  ];
  axes.forEach((newAxis) => newGraph.appendChild(axis(newAxis)));

  data.forEach((datum, i) => {
    const barAttrs = { value: datum, fill: color, width: barWidth, height, i };
    newGraph.appendChild(bar(barAttrs));
  });

  return newGraph;
};

// data fetching and parsing

const mapAges = (entries) => {
  const age = (entry) =>
    Math.round((Date.now() - new Date(entry.created_at)) / (1000 * 60 * 60 * 24));

  const daysAgo = [];
  for (let i = 0; i <= 6; i++) { daysAgo.push(i); }

  const entryAges = entries.map((entry) => age(entry));

  return daysAgo.map((days) =>
    entryAges.reduce((total, entryAge) =>
      days === entryAge ? total + 1 : total
    , 0)
  );
};

const fetchData = (routes) => {
  const fetches = routes.map((route) =>
    fetch(route)
    .then((response) => response.json())
  );
  return Promise.all(fetches);
};

const routes = (measurement) => {
  const routeSuffixes = {
    participation: 'stats/participation',
    comments: 'issues/comments?sort=created&direction=desc&per_page=100',
    pulls: 'pulls?sort=created&state=all&direction=desc&per_page=100',
  };
  return frameworks.map((fw) => {
    const { org, repo } = fw;
    return `${rootUrl}/repos/${org}/${repo}/${routeSuffixes[measurement]}`;
  });
};

const frameworkObjs = (response) => {
  const isAge = !response[0].all;
  const ageWeighted = (data) =>
    data.reduce((sum, d, i) => sum + (d * i)) / data.length;
  const mean = (data) =>
    data.reduce((sum, d) => sum + d) / data.length;

  return frameworks.map((framework, i) => {
    const fw = Object.assign({}, framework);
    fw.data = isAge ? mapAges(response[i]) : response[i].all;
    fw.max = Math.max(...fw.data);
    fw.avg = isAge ? ageWeighted(fw.data) : mean(fw.data);
    const { repo, data, color, max, avg } = fw;
    fw.graph = graph({ repo, data, color, max, avg });
    return fw;
  });
};

// dom interaction

const renderGraphs = (fws) => {
  graphs.innerHTML = '';
  fws.forEach((fw) => {
    const graphContainer = document.createElement('div');
    graphContainer.setAttribute('id', 'graph-container');
    const title = document.createElement('h2');
    title.innerHTML = `${fw.repo.toUpperCase()}`;
    graphContainer.appendChild(title);
    graphContainer.appendChild(fw.graph);
    graphs.appendChild(graphContainer);
  });
};

const displayError = (error) => {
  const errorMessage = document.createElement('p');
  errorMessage.innerHTML = 'There was a problem loading the data.';
  graphs.appendChild(errorMessage);
  console.error(`Error loading data: ${error}`);
};

const show = (attrs) => {
  const { measurement, stat, order } = attrs;
  fetchData(routes(measurement))
  .then((response) => response)
  .then((arrs) => {
    const selectedFws = frameworkObjs(arrs).sort((a, b) =>
      order === 'asc' ? a[stat] - b[stat] : b[stat] - a[stat]
    );
    renderGraphs(selectedFws);
  })
  .catch((error) => {
    displayError(error);
  });
};

const handleChange = () => {
  const descriptions = {
    comments: 'The age of the most recent comments (limit 100) in days',
    participation: 'Total commits per week by all users for the last year',
    pulls: 'The age of the most recent pull requests (limit 100) in days',
  };

  const fields = [...document.getElementById('graph-selection-form').elements];
  document.getElementById('description').innerHTML = descriptions[fields[0].value];
  show({ measurement: fields[0].value, stat: fields[1].value, order: fields[2].value });
};

window.onload = () => {
  handleChange();
  window.setInterval(handleChange, 2 * 60 * 1000);
  document.getElementById('graph-selection-form')
  .addEventListener('change', handleChange);
};
