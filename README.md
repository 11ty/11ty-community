# `11ty-community`

## Goals

Serve as the open source data store for:

* Eleventy Sites ([migrate Data](https://github.com/11ty/11ty-website/tree/master/src/_data/sites)), used for:
  * [Eleventy Authors](https://www.11ty.dev/authors/) 
  * [Eleventy Leaderboards](https://www.11ty.dev/speedlify/)

Require less data to be entered by the end user. Currently we have:

1. `url`: (required)
1. `source_url`: (optional)
1. `opened_by`: (autopopulated) The GitHub user that created the issue.
1. `authors`: (optional) Previously `authoredBy` (was additive, now an override). Fallback to `opened_by`.
1. `business_url`: (optional) Previously `business.cta`. The [Super Professional Business Network](https://www.11ty.dev/blog/espbn/) url
1. `business_name`: (optional) Previously `business.name`. The [Super Professional Business Network](https://www.11ty.dev/blog/espbn/) company name
1. ~~`twitter`: Was required and the primary key, removed~~
1. ~~`description`: Optional, removed~~

All URLs must be  normalized prior to JSON data file creation (via [`normalize-url`](https://www.npmjs.com/package/normalize-url) and [`follow-url-redirects`](https://www.npmjs.com/package/follow-url-redirects)).

### Stretch Goals:

* Use a spider to find fallbacks for `source_url` (`<a href rel="source">`) and `twitter` (`<a href rel="me">`) and `description` from `<meta>` on the page.
* Retirement of [Plugins Data](https://github.com/11ty/11ty-website/tree/master/src/_data/plugins) (move to `npm` API query)
* Migrate other data from `11ty-website` (these are used less frequently):
  * [Starter Projects](https://www.11ty.dev/docs/starter/) (and [migrate Data](https://github.com/11ty/11ty-website/tree/master/src/_data/starters))
  * [Community Resources](https://www.11ty.dev/docs/getting-started/#continue-learning) (and [migrate Data](https://github.com/11ty/11ty-website/tree/master/src/_data/community))
  * Demos (and [migrate Data](https://github.com/11ty/11ty-website/tree/master/src/_data/demos))
* Use a bookmarking service APIs to populate entries
* Use Twitter hashtag API search query to populate entries