# `11ty-community`

This repo is the open source data set for Built With Eleventy sites, used for:

  * [Eleventy Authors](https://www.11ty.dev/authors/) 
  * [Eleventy Leaderboards](https://www.11ty.dev/speedlify/)

## [Did you build something? Please add it!](https://github.com/11ty/11ty-community/issues/new/choose)


---

## How does it work?

* Uses the [`zachleat/github-issue-to-json-file` GitHub action](https://github.com/zachleat/github-issue-to-json-file) to automatically create a JSON data file from a GitHub issue.
* All URLs are be normalized prior to JSON data file creation (via [`normalize-url`](https://www.npmjs.com/package/normalize-url) and [`follow-url-redirects`](https://www.npmjs.com/package/follow-url-redirects)).

### Stretch goals (for later):

* Use a spider to find fallbacks for `source_url` (`<a href rel="source">`) and `twitter` (`<a href rel="me">`) and `description` from `<meta>` on the page.
* Retirement of [Plugins Data](https://github.com/11ty/11ty-website/tree/master/src/_data/plugins) (move to `npm` API query)
* Migrate other data from `11ty-website` (these are used less frequently):
  * [Starter Projects](https://www.11ty.dev/docs/starter/) (and [migrate Data](https://github.com/11ty/11ty-website/tree/master/src/_data/starters))
  * [Community Resources](https://www.11ty.dev/docs/getting-started/#continue-learning) (and [migrate Data](https://github.com/11ty/11ty-website/tree/master/src/_data/community))
  * Demos (and [migrate Data](https://github.com/11ty/11ty-website/tree/master/src/_data/demos))
* Use a bookmarking service APIs to populate entries
* Use Twitter hashtag API search query to populate entries