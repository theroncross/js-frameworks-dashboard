# [JS Framework Dashboard](https://theroncross.github.io/js-frameworks-dashboard/)

View and compare GitHub user activity on popular JavaScript framework repos, including:

* React
* Angular 2
* Vue JS
* Ember

Compared values include:

* weekly commits by all users for the past year
* the age of the last 100 issues comments
* the age of the last 100 pull requests

This is by no means a complete view of the health and popularity of these frameworks, but should give a good general sense of the size and activity of its developers.

### Rationale

1. Commits are a decent proxy for how much coding is actually happening on the project. Nicely, Github has already compiled these numbers and made them easily available in the API. The resulting graph gives a quick visual representation of activity on a project over the course of a year.

2. Issue Comments give a sense of the level of communication on a project. How many people are contributing? Is there a rich discussion in the community?

3. Recent Pull Requests ultimately give you a sense of the maintenance of a repo. While it's possible that a decline in PRs is just the result of a more stable, more mature project, it could also be a sign that contributors are jumping ship to other projects.

### TODOs

1. prefetch data - the load time is too long
2. load more data - Github's response limit is 100 entries, which means I'll need to implement some traversal of the paginated results
3. add trendlines - visualizing the direction of the project isn't as clear as I'd like
4. make it responsive - the width is set as a percentage of viewport width in the js
5. make it modular - this was an exercise. Other than transpiling with Babel, I didn't want to use any external frameworks, libraries, or bundlers.
6. scale - the pull request bars are difficult to compare.
7. gussy up the form - 'nough said

