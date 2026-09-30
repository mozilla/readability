/* eslint-env node, mocha */
var { JSDOM } = require("jsdom");
var { expect } = require("chai");
var { Readability } = require("../index");

describe("JSON-LD candidate selection", function () {
  const page = "https://example.com/recipe";
  const schema = "https://schema.org";
  const recipe = {
    "@context": schema,
    "@type": "Recipe",
    name: "Recipe title",
    datePublished: "2026-08-20",
  };
  function extract(blocks, head = "") {
    const doc = new JSDOM(
      "<html><head><title>Recipe title</title>" +
        head +
        blocks
          .map(
            block =>
              '<script type="application/ld+json">' +
              (typeof block === "string" ? block : JSON.stringify(block)) +
              "</script>"
          )
          .join("") +
        "</head><body><article><p>" +
        "Recipe content with useful details, ingredients, and instructions. ".repeat(
          20
        ) +
        "</p></article></body></html>",
      { url: page }
    ).window.document;
    const reader = new Readability(doc);
    const result = reader.parse();
    expect(result).not.to.equal(null);
    expect(result.textContent).to.contain("Recipe content");
    return result;
  }
  it("continues past an undated video in a separate script", function () {
    const result = extract([
      { "@context": schema, "@type": "VideoObject", name: "Video" },
      recipe,
    ]);
    expect(result.title).to.equal(recipe.name);
    expect(result.publishedTime).to.equal(recipe.datePublished);
  });
  for (const reference of [
    page,
    { "@id": page },
    [{ "@id": page }],
    { url: page },
    [{ url: page }],
  ]) {
    it("prefers a dated page match: " + JSON.stringify(reference), function () {
      const result = extract([
        { ...recipe, name: "Other", datePublished: "2000-01-01" },
        { ...recipe, mainEntityOfPage: reference },
      ]);
      expect(result.title).to.equal(recipe.name);
      expect(result.publishedTime).to.equal(recipe.datePublished);
    });
  }
  it("matches a canonical URL and relative references", function () {
    const result = extract(
      [
        { ...recipe, name: "Other" },
        { ...recipe, mainEntityOfPage: { "@id": "/canonical#page" } },
      ],
      '<link rel="canonical" href="/canonical">'
    );
    expect(result.title).to.equal(recipe.name);
  });
  it("keeps the first dated candidate when no page match exists", function () {
    expect(
      extract([recipe, { ...recipe, datePublished: "2020-01-01" }])
        .publishedTime
    ).to.equal(recipe.datePublished);
  });
  it("collects arrays and graphs with inherited context and array types", function () {
    const result = extract([
      {
        "@context": schema,
        "@graph": [
          null,
          { "@type": "Organization", name: "Publisher" },
          {
            ...recipe,
            "@context": undefined,
            "@type": ["Recipe", "CustomContent"],
          },
        ],
      },
    ]);
    expect(result.publishedTime).to.equal(recipe.datePublished);
  });
  it("ignores malformed scripts, invalid types and foreign contexts", function () {
    expect(
      extract([
        "{broken",
        { ...recipe, "@type": {} },
        { ...recipe, "@context": "https://other.example" },
        recipe,
      ]).publishedTime
    ).to.equal(recipe.datePublished);
  });
  it("does not select a nested review date", function () {
    expect(
      extract([
        {
          ...recipe,
          datePublished: undefined,
          review: { "@type": "Review", datePublished: "2000-01-01" },
        },
      ]).publishedTime
    ).to.equal(null);
  });
  it("treats blank dates as absent", function () {
    expect(
      extract([{ ...recipe, datePublished: "  " }, recipe]).publishedTime
    ).to.equal(recipe.datePublished);
  });
  it("does not use an undated publisher name as the title", function () {
    const result = extract([
      { "@context": schema, "@type": "Organization", name: "Publisher" },
    ]);
    expect(result.title).to.equal("Recipe title");
    expect(result.publishedTime).to.equal(null);
  });
  it("preserves HTML date fallback for undated content", function () {
    expect(
      extract(
        [{ ...recipe, datePublished: undefined }],
        '<meta property="article:published_time" content="2020-01-01">'
      ).publishedTime
    ).to.equal("2020-01-01");
  });
  it("preserves page-associated undated metadata with a different title", function () {
    const result = extract([
      {
        ...recipe,
        "@type": "NewsArticle",
        name: "Original article title",
        mainEntityOfPage: page,
        datePublished: undefined,
        author: { name: "Original Author" },
        description: "Original description",
      },
    ]);
    expect(result.title).to.equal("Original article title");
    expect(result.byline).to.equal("Original Author");
    expect(result.excerpt).to.equal("Original description");
  });
  it("keeps document order when two dated candidates both match the page", function () {
    expect(
      extract([
        { ...recipe, mainEntityOfPage: page },
        { ...recipe, mainEntityOfPage: page, datePublished: "2020-01-01" },
      ]).publishedTime
    ).to.equal(recipe.datePublished);
  });
  it("does not match an unrelated page association", function () {
    expect(
      extract([
        recipe,
        {
          ...recipe,
          name: "Wrong",
          mainEntityOfPage: "https://other.example/recipe",
        },
      ]).title
    ).to.equal(recipe.name);
  });
  it("retains metadata fallback with JSON-LD disabled", function () {
    const doc = new JSDOM(
      '<html><head><title>HTML title</title><meta property="article:published_time" content="2020-01-01">' +
        '<script type="application/ld+json">' +
        JSON.stringify(recipe) +
        "</script></head><body><p>" +
        "Article content. ".repeat(100) +
        "</p></body></html>",
      { url: page }
    ).window.document;
    const result = new Readability(doc, { disableJSONLD: true }).parse();
    expect(result.title).to.equal("HTML title");
    expect(result.publishedTime).to.equal("2020-01-01");
  });
  it("does not prefer an undated article type without page or title matching", function () {
    const result = extract([
      {
        ...recipe,
        "@type": "NewsArticle",
        name: "Unrelated story",
        datePublished: undefined,
        author: { name: "Other Author" },
      },
    ]);
    expect(result.title).to.equal("Recipe title");
    expect(result.byline).to.equal(null);
    expect(result.publishedTime).to.equal(null);
  });
  it("does not select undated metadata merely because its title matches", function () {
    const result = extract(
      [
        {
          ...recipe,
          datePublished: undefined,
          author: { name: "JSON-LD Author" },
          description: "JSON-LD description",
        },
      ],
      '<meta name="author" content="HTML Author"><meta name="description" content="HTML description">'
    );
    expect(result.title).to.equal(recipe.name);
    expect(result.byline).to.equal("HTML Author");
    expect(result.excerpt).to.equal("HTML description");
    expect(result.publishedTime).to.equal(null);
  });
  it("matches relative url references against the canonical URL", function () {
    const result = extract(
      [
        { ...recipe, name: "Other" },
        { ...recipe, mainEntityOfPage: { url: "/canonical#page" } },
      ],
      '<link rel="canonical" href="/canonical">'
    );
    expect(result.title).to.equal(recipe.name);
  });
  it("uses url associations for undated metadata", function () {
    const result = extract([
      {
        ...recipe,
        datePublished: undefined,
        mainEntityOfPage: { url: page },
        author: { name: "Recipe Author" },
      },
    ]);
    expect(result.byline).to.equal("Recipe Author");
    expect(result.publishedTime).to.equal(null);
  });
  it("does not override an existing @id with url", function () {
    const result = extract([
      recipe,
      {
        ...recipe,
        name: "Other",
        datePublished: "2000-01-01",
        mainEntityOfPage: { "@id": "https://other.example/page", url: page },
      },
    ]);
    expect(result.title).to.equal(recipe.name);
    expect(result.publishedTime).to.equal(recipe.datePublished);
  });
  it("ignores a non-string url reference", function () {
    const result = extract([
      recipe,
      {
        ...recipe,
        name: "Other",
        mainEntityOfPage: { url: { "@id": page } },
      },
    ]);
    expect(result.title).to.equal(recipe.name);
  });
  for (const context of [
    { "@vocab": schema },
    [schema, { "@language": "en" }],
  ]) {
    it("accepts context " + JSON.stringify(context), function () {
      expect(
        extract([{ ...recipe, "@context": context }]).publishedTime
      ).to.equal(recipe.datePublished);
    });
  }
  it("respects a graph child's explicit context override", function () {
    const result = extract([
      {
        "@context": schema,
        "@graph": [
          { ...recipe, "@context": null, name: "Ignored" },
          { ...recipe, "@context": undefined },
        ],
      },
    ]);
    expect(result.title).to.equal(recipe.name);
  });
  for (const [context, acceptsSchema] of [
    [[schema, { "@vocab": "https://example.com/" }], false],
    [[{ "@vocab": schema }, { "@vocab": "https://example.com/" }], false],
    [[schema, { "@vocab": null }], false],
    [[schema, null, { "@language": "en" }], false],
    [[schema, "https://example.com/context"], false],
    [[{ "@vocab": "https://example.com/" }, schema], true],
    [
      [schema, { "@vocab": "https://example.com/" }, { "@vocab": schema }],
      true,
    ],
    [[schema, null, schema], true],
    [[schema, { label: "https://example.com/label" }], true],
    [
      [schema, { "@language": "en" }, { label: "https://example.com/label" }],
      true,
    ],
    [[schema, {}], true],
  ]) {
    it(
      "applies context entries in order: " + JSON.stringify(context),
      function () {
        const result = extract([{ ...recipe, "@context": context }]);
        expect(result.publishedTime).to.equal(
          acceptsSchema ? recipe.datePublished : null
        );
      }
    );
  }
  for (const [context, acceptsSchema] of [
    [{ "@language": "en" }, true],
    [{ label: "https://example.com/label" }, true],
    [{ "@vocab": "https://example.com/" }, false],
    [[{ "@language": "en" }, { "@vocab": null }], false],
  ]) {
    it(
      "applies a graph child's context to the inherited vocabulary: " +
        JSON.stringify(context),
      function () {
        const result = extract([
          {
            "@context": schema,
            "@graph": [{ ...recipe, "@context": context }],
          },
        ]);
        expect(result.publishedTime).to.equal(
          acceptsSchema ? recipe.datePublished : null
        );
      }
    );
  }
  it("skips a foreign-context candidate before a valid dated recipe", function () {
    const result = extract([
      {
        ...recipe,
        "@context": [schema, { "@vocab": "https://example.com/" }],
        name: "Unrelated entity",
        datePublished: "2000-01-01",
        mainEntityOfPage: page,
      },
      recipe,
    ]);
    expect(result.title).to.equal(recipe.name);
    expect(result.publishedTime).to.equal(recipe.datePublished);
  });
  it("uses JSON-LD dates ahead of HTML dates", function () {
    expect(
      extract(
        [recipe],
        '<meta property="article:published_time" content="2000-01-01">'
      ).publishedTime
    ).to.equal(recipe.datePublished);
  });
  it("keeps metadata from one candidate and fills missing fields from HTML", function () {
    const result = extract(
      [recipe, { ...recipe, author: { name: "Other Author" } }],
      '<meta name="author" content="HTML Author">'
    );
    expect(result.byline).to.equal("HTML Author");
    expect(result.publishedTime).to.equal(recipe.datePublished);
  });
  it("uses document order even when the first dated candidate is a video", function () {
    const result = extract([
      {
        ...recipe,
        "@type": "VideoObject",
        name: "Video",
        datePublished: "2000-01-01",
      },
      recipe,
    ]);
    expect(result.title).to.equal("Video");
    expect(result.publishedTime).to.equal("2000-01-01");
  });
  it("prefers a dated candidate over an undated page-associated candidate", function () {
    const result = extract([
      {
        ...recipe,
        name: "Undated",
        datePublished: undefined,
        mainEntityOfPage: page,
      },
      recipe,
    ]);
    expect(result.title).to.equal(recipe.name);
    expect(result.publishedTime).to.equal(recipe.datePublished);
  });
  it("does not use dateModified or uploadDate as datePublished", function () {
    expect(
      extract([
        {
          ...recipe,
          datePublished: undefined,
          dateModified: "2026-09-01",
          uploadDate: "2026-08-01",
          mainEntityOfPage: page,
        },
      ]).publishedTime
    ).to.equal(null);
  });
});
