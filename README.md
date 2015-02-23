# Readability.js

A standalone version of the readability library used for Firefox Reader View. Any changes to Readability.js itself should be reviewed by an appropriate Firefox/toolkit peer, such as [@leibovic](https://github.com/leibovic) or [@thebnich](https://github.com/thebnich), since these changes will be automatically merged to mozilla-central.

For outstanding issues, see this bug list: https://bugzilla.mozilla.org/show_bug.cgi?id=1102450

For easy development, you can use the compare-view page to compare an original test page to its reader-ized content. Due to the same-origin policy, this will only work with pages hosted on the same domain as this compare-view page, so you should save testcases locally, and run a local http server to test.

For a simple node http server, see [http-server](https://github.com/nodeapps/http-server).
