const app = document.getElementById('app');
const rootUrl = 'https://api.github.com/'
const NS='http://www.w3.org/2000/svg';
const setAttributes = (el, attrs) => {
  for(let attr in attrs) {
    el.setAttributeNS(null, attr, attrs[attr]);
  }
};
const SVGElement = (type) => {
  const svg=document.createElementNS(NS, type);
  return svg;
};

const newGraph = (params) => {
  const { route, id, color, width = 1030, height = 140 } = params;
  fetch(`${rootUrl}${route}`)
  .then((response) => {
    return response.json()
  })
  .then((data) => {
    let bar, rect;
    const barWidth = width / data.all.length;
    const graph = SVGElement("svg");
    setAttributes(graph, { height, width, id });

    const avg = data.all.reduce((w, a) => { return w + a }) / data.all.length;
    const avgLine = SVGElement("line");
    setAttributes(avgLine, {
      "x1": "0",
      "x2": width,
      "y1": `${100 - avg}`,
      "y2": `${100 - avg}`,
      "stroke-width": "1px",
      "stroke": "orange"
    });
    data.all.forEach((week, i) => {
      bar = SVGElement("g");
      setAttributes(bar, {
        "transform": `translate(${barWidth * i}, 0)`
      });
      rect = SVGElement("rect");
      setAttributes(rect, {
        "width": `${barWidth - 2}`,
        "height": week,
        "y": `${100 - week}`,
        "fill": color
      });
      bar.appendChild(rect);
      graph.appendChild(bar);
    });
    graph.appendChild(avgLine);
    app.appendChild(graph);
  });
};

const frameworks = [
  {
    org: "facebook",
    repo: "react",
    color: "blue"
  }, {
    org: "angular",
    repo: "angular",
    color: "red"
  }, {
    org: "emberjs",
    repo: "ember.js",
    color: "green"
  }, {
    org: "vuejs",
    repo: "vue",
    color: "purple"
  }
];

for(let framework of frameworks) {
  newGraph({
    route: `repos/${framework.org}/${framework.repo}/stats/participation`,
    id: framework.repo,
    color: framework.color
  });
}
