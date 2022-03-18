# `11ty-community`

## Goals

Serve as the open source data store for:

* Eleventy Sites ([migrate Data](https://github.com/11ty/11ty-website/tree/master/src/_data/sites)), used for:
  * [Eleventy Authors](https://www.11ty.dev/authors/) 
  * [Eleventy Leaderboards](https://www.11ty.dev/speedlify/)

Require less data to be entered by the end user. Currently we have:

1. `url`: Required
1. `source_url`: Optional, keep it.
1. `opened_by`: Autopopulated (new). The GitHub user that created the issue.
1. `authors`: Optional, previously `authoredBy` (was additive, now an override). Fallback to `opened_by`.
1. ~~`twitter`: Was required and the primary key, remove it.~~
1. ~~`description`: Optional, remove it~~

### Stretch Goals:

* Use a spider to find fallbacks for `source_url` (`<a href rel="source">`) and `twitter` (`<a href rel="me">`) and `description` from `<meta>` on the page.
* Retirement of [Plugins Data](https://github.com/11ty/11ty-website/tree/master/src/_data/plugins) (move to `npm` API query)
* Migrate other data from `11ty-website` (these are used less frequently):
  * [Starter Projects](https://www.11ty.dev/docs/starter/) (and [migrate Data](https://github.com/11ty/11ty-website/tree/master/src/_data/starters))
  * [Community Resources](https://www.11ty.dev/docs/getting-started/#continue-learning) (and [migrate Data](https://github.com/11ty/11ty-website/tree/master/src/_data/community))
  * Demos (and [migrate Data](https://github.com/11ty/11ty-website/tree/master/src/_data/demos))
* Use a bookmarking service APIs to populate entries
* Use Twitter hashtag API search query to populate entries