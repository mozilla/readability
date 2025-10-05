/* eslint-env node, mocha */

/**
 * Test case for issue #986: Wikipedia h2 headings being skipped when parent div contains extra links
 *
 * This test verifies that h2 headings are preserved even when their parent div contains
 * links like "edit" or "talk" that might trigger negative class weight filtering.
 */

const { JSDOM } = require("jsdom");
const chai = require("chai");
const expect = chai.expect;
const Readability = require("../index").Readability;

// Sample HTML that mimics Wikipedia structure with h2 headings in divs containing edit/talk links
const testHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>Test Wikipedia Article</title>
</head>
<body>
    <div id="content">
        <h1>Main Article Title</h1>
        
        <p>This is the introduction paragraph.</p>
        
        <!-- This h2 should be preserved despite the parent div having edit/talk links -->
        <div class="mw-headline" id="History">
            <h2>History</h2>
            <span class="mw-editsection">
                <span class="mw-editsection-bracket">[</span>
                <a href="/w/index.php?title=Test&action=edit&section=1" title="Edit section: History">edit</a>
                <span class="mw-editsection-bracket">]</span>
            </span>
        </div>
        
        <p>This is content under the History section.</p>
        
        <!-- Another h2 that should be preserved -->
        <div class="mw-headline" id="Development">
            <h2>Development</h2>
            <span class="mw-editsection">
                <span class="mw-editsection-bracket">[</span>
                <a href="/w/index.php?title=Test&action=edit&section=2" title="Edit section: Development">edit</a>
                <span class="mw-editsection-bracket">]</span>
            </span>
        </div>
        
        <p>This is content under the Development section.</p>
        
        <!-- h2 with negative class that should still be preserved if it has content -->
        <div class="edit-talk-share">
            <h2>Important Section</h2>
            <a href="/talk">talk</a>
            <a href="/share">share</a>
        </div>
        
        <p>This is content under the Important Section.</p>
        
        <!-- Empty h2 that should be removed -->
        <div class="edit-talk-share">
            <h2></h2>
            <a href="/talk">talk</a>
        </div>
        
        <p>This paragraph should remain.</p>
    </div>
</body>
</html>
`;

describe("Wikipedia H2 Heading Preservation", function () {
  it("should preserve h2 headings even when parent div contains edit/talk links", function () {
    const dom = new JSDOM(testHTML, {
      url: "https://example.com",
      contentType: "text/html",
    });

    const reader = new Readability(dom.window.document, {
      debug: false,
    });

    const article = reader.parse();

    expect(article).to.not.be.null;
    expect(article.content).to.not.be.undefined;

    // Check that h2 headings are preserved
    const h2Count = (article.content.match(/<h2>/g) || []).length;

    // We expect 4 h2 headings: "Main Article Title", "History", "Development", and "Important Section"
    // The empty h2 should be removed
    expect(h2Count).to.equal(4, `Expected 4 h2 headings, but found ${h2Count}`);

    // Check for specific headings
    expect(article.content).to.include(
      "<h2>History</h2>",
      "History h2 heading not found"
    );
    expect(article.content).to.include(
      "<h2>Development</h2>",
      "Development h2 heading not found"
    );
    expect(article.content).to.include(
      "<h2>Important Section</h2>",
      "Important Section h2 heading not found"
    );

    // Check that empty h2 was removed
    expect(article.content).to.not.include(
      "<h2></h2>",
      "Empty h2 heading should have been removed"
    );
  });
});
