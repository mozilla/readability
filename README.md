# Readability.js

A standalone version of the readability library used for Firefox Reader View. Any changes to Readability.js itself should be reviewed by an appropriate Firefox/toolkit peer, such as [@leibovic](https://github.com/leibovic) or [@thebnich](https://github.com/thebnich), since these changes will be automatically merged to mozilla-central.

For outstanding issues, see this bug list: https://bugzilla.mozilla.org/show_bug.cgi?id=1102450

For easy development, you can use the compare-view page to compare an original test page to its reader-ized content. Due to the same-origin policy, this will only work with pages hosted on the same domain as this compare-view page, so you should save testcases locally, and run a local http server to test.

For a simple node http server, see [http-server](https://github.com/nodeapps/http-server).

## License

    Copyright (c) 2010 Arc90 Inc

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
