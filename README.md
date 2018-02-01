
## pa11y Audit Tool

To run an audit use the following command:

```
gulp audit --url "http://someurl.com/"
```

This will generate audit reports at `audits/someurl.com/`

Some sites will block the user agent used by `sitemap-generator`. In these cases it is helpful to manually compile a list of URLs to audit with pa11y. To do this, build a new json file with the following format:

```
{
  "urls": [
    "http://example.com/"
    "http://example.com/one-url"
    "http://example.com/two-url"
    "http://example.com/red-url"
    "http://example.com/blue-url"
  ]
}
```

You can then tell the tool to use your manually generated list of URLs instead of automatically generating a sitemap by running the following command:

```
gulp audit --url "http://someurl.com/" --json "/path/to/urls.json"
```

Large sites can take some time to generate a sitemap, be patient! If you suspect the sitemap is taking too long, plug your URL into a sitemap generator like [this one](https://www.xml-sitemaps.com/). If the user agent is being blocked, you will see an error when attempting to crawl the site.

Successful audits will be deposit an `audit.json` at `./audits/{site}/`. This file will a list of error codes along with their counts, followed by a full list of the errors encountered during the audit.

*To respect the privacy of the companies being audited all audit results are ignored by git.*
