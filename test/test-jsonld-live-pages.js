/* eslint-env node, mocha */
var { JSDOM } = require("jsdom");
var { expect } = require("chai");
var { Readability } = require("../index");
var JSDOMParser = require("../JSDOMParser");
var fixtures = require("./fixtures/jsonld-live-pages.json");

// Reduced JSON-LD captured from the source URLs on 2026-09-10.
// Keep script order and selection fields; use synthetic body text so tests
// remain offline and do not depend on changing publisher content.
describe("Real-page JSON-LD layouts", function () {
  for (const fixture of fixtures) {
    for (const parser of ["jsdom", "JSDOMParser"]) {
      it(fixture.url + " with " + parser, function () {
        const body =
          "This recipe explains the ingredients, preparation, and baking instructions. ".repeat(
            20
          );
        const html =
          "<html><head><title>" +
          fixture.htmlTitle +
          "</title>" +
          fixture.blocks
            .map(
              block =>
                '<script type="application/ld+json">' +
                JSON.stringify(block) +
                "</script>"
            )
            .join("") +
          "</head><body><article><p>" +
          body +
          "</p></article></body></html>";
        const doc =
          parser === "jsdom"
            ? new JSDOM(html, { url: fixture.url }).window.document
            : new JSDOMParser().parse(html);
        if (parser === "JSDOMParser") {
          doc.documentURI = fixture.url;
          doc.baseURI = fixture.url;
        }
        const result = new Readability(doc).parse();
        expect(result).not.to.equal(null);
        expect(result.title).to.equal(fixture.title);
        expect(result.publishedTime).to.equal(fixture.date);
        expect(result.textContent.trim()).to.equal(body.trim());
      });
    }
  }
});
