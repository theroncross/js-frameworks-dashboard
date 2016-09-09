
// Utility Functions

const elWithAttrs = (attrs) => {
  const { tag, ...rest } = attrs;
  const NS = 'http://www.w3.org/2000/svg';
  const newEl = document.createElementNS(NS, tag);

  Object.keys(rest).forEach((attr) => {
    newEl.setAttributeNS(null, attr, attrs[attr]);
  });

  return newEl;
};

// 'Components'

const bar = (attrs) => {
  const { value, width, height, fill, i } = attrs;

  const newBar = elWithAttrs({
    tag: 'g',
    transform: `translate(${width * i}, 0)`,
  });

  const newRect = elWithAttrs({
    tag: 'rect',
    width: `${width - 2}`,
    y: `${height - value}`,
    height: value,
    fill,
  });

  newBar.appendChild(newRect);
  return newBar;
};

const axis = (attrs) => {
  const { value, width, height, stroke = 'silver', labels = [Math.round(value), ''] } = attrs;

  const newAxis = elWithAttrs({
    tag: 'g',
    transform: `translate(0, ${height - value})`,
  });

  const newLine = elWithAttrs({
    tag: 'line',
    x2: width,
    y2: '0',
    stroke,
    'stroke-width': '1px',
  });

  if (labels) {
    labels.forEach((label, i) => {
      const newLabel = elWithAttrs({
        tag: 'text',
        x: (width * i) / (labels.length - 1),
        y: '15',
        stroke,
      });
      newLabel.innerHTML = label;
      newAxis.appendChild(newLabel);
    });
  }

  newAxis.appendChild(newLine);
  return newAxis;
};

const graph = (attrs) => {
  const { data, repo, color, max, labels } = attrs;
  const height = max > 100 ? max : 100;
  const width = 0.5 * window.innerWidth;
  const barWidth = width / data.length;

  const newGraph = elWithAttrs({
    tag: 'svg',
    class: 'graph',
    id: repo,
    height: height + 20,
    width: width + 30,
  });

  const axes = [
    { value: 0, width, height, labels },
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

  return entries.map(entry => age(entry))
};

const tallyAges = (ages) => {
  const days = [];
  for (let i = 6; i >= 0; i--) { days.push(i); }

  return days.map(day => ages.filter(age => day === age).length);
};

const fetchData = (routes) => {
  const fetches = routes.map((route) =>
    fetch(route)
    .then((response) => response.json())
  );

  return Promise.all(fetches);
};

const routes = (dataType, frameworks) => {
  const rootUrl = 'https://api.github.com';
  const routeSuffixes = {
    participation: 'stats/participation',
    comments: 'issues/comments?sort=created&direction=desc&per_page=100',
    pulls: 'pulls?sort=created&state=all&direction=desc&per_page=100',
  };

  return frameworks.map((fw) => {
    const { org, repo } = fw;
    return `${rootUrl}/repos/${org}/${repo}/${routeSuffixes[dataType]}`;
  });
};

const frameworkObjs = (response, frameworks) => {
  const isAge = !response[0].hasOwnProperty('all');
  const ageWeighted = (data) =>
    data.reduce((sum, d, i) => (sum + (d * i)) / data.length);
  const mean = (data) =>
    data.reduce((sum, d) => sum + d) / data.length;

  return frameworks.map((framework, i) => {
    const fw = Object.assign({}, framework);
    fw.data = isAge ? mapAges(response[i]) : response[i].all;
    fw.max = Math.max(...fw.data);
    fw.median = fw.data[Math.round(fw.data.length / 2)];
    fw.units = isAge ? 'days ago' : 'commits/week';
    fw.labels = isAge ? [fw.units, '3', 'now'] : [fw.units, '26', 'now']
    fw.graph = graph({ ...fw, data: isAge ? tallyAges(fw.data) : fw.data});
    return fw;
  });
};

// dom interaction

const renderGraphs = (frameworks) => {
  const graphList = document.getElementById('graph-list');
  graphList.innerHTML = '';
  frameworks.forEach((fw) => {
    const graphContainer = document.createElement('div');
    graphContainer.setAttribute('id', 'graph-container');
    const title = document.createElement('h2');
    title.innerHTML = fw.repo.toUpperCase();
    const avg = document.createElement('h4');
    avg.innerHTML = `Median: ~${fw.median} ${fw.units}`;
    graphContainer.appendChild(title);
    graphContainer.appendChild(avg);
    graphContainer.appendChild(fw.graph);
    graphList.appendChild(graphContainer);
  });
};

const displayError = (error) => {
  const graphList = document.getElementById('graph-list');
  const errorMessage = document.createElement('p');
  errorMessage.innerHTML = 'There was a problem loading the data.';
  graphList.appendChild(errorMessage);
  console.error(`Error loading data: ${error}`);
};

const show = (attrs) => {
  const { dataType, stat, order } = attrs;
  const frameworks = [
    { org: 'facebook', repo: 'react', color: '#61DAFB' },
    { org: 'angular', repo: 'angular', color: '#DD1B16' },
    { org: 'emberjs', repo: 'ember.js', color: '#E46651' },
    { org: 'vuejs', repo: 'vue', color: '#41B883' },
  ];

  fetchData(routes(dataType, frameworks))
  .then((response) => {
    const selectedFws = frameworkObjs(response, frameworks)
    .sort((a, b) => order === 'asc' ? a[stat] - b[stat] : b[stat] - a[stat]);
    renderGraphs(selectedFws);
  })
  .catch((error) => {
    displayError(error);
  });
};

const handleChange = () => {
  const descriptions = {
    participation: 'Total commits by all users for the last year, by week',
    comments: 'Age of the 100 most recent comments (showing previous week)',
    pulls: 'Age of 100 most recent pull requests (showing previous week)',
  };

  const fields = [...document.getElementById('graph-selection-form').elements];
  document.getElementById('description').innerHTML = descriptions[fields[0].value];
  show({ dataType: fields[0].value, stat: fields[1].value, order: fields[2].value });
};

window.onload = () => {
  handleChange();
  window.setInterval(handleChange, 2 * 60 * 1000);
  document.getElementById('graph-selection-form')
  .addEventListener('change', handleChange);
};
