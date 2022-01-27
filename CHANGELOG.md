# Changelog

Notable changes to readability will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project attempts to adhere to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

For the purposes of Semantic Versioning, the readability output object for a given
input document is not considered a stable API. That is, minor version increments
may change this output. Patch version increments will only do so in ways that are
strict improvements (e.g. from empty strings or exceptions to something more
reasonable).

## [Unreleased]

- Fix [compatibility with DOM implementations where the `childNodes` property is not live](https://github.com/mozilla/readability/pull/694) ([x2](https://github.com/mozilla/readability/pull/677)).
- Lazily-loaded image references [will no longer use the `alt` attribute](https://github.com/mozilla/readability/pull/689) to find images.
- `parse()` [provides the root element's `lang` attribute](https://github.com/mozilla/readability/pull/721)
- `isProbablyReadable` [includes article tags](https://github.com/mozilla/readability/pull/724)
- Improvements to JSON-LD support
  - [Continue parsing other JSON-LD elements until we find one we can support](https://github.com/mozilla/readability/pull/713)
  - [Prefer using headline for article title](https://github.com/mozilla/readability/pull/713)

## [0.4.1] - 2021-01-13

### Added

- Typescript type definition file (`.d.ts`).

## [0.4.0] - 2020-12-23

### Added

- `isProbablyReaderable` [can now take an optional options object](https://github.com/mozilla/readability/pull/634) to configure it,
allowing you to specify the minimum content length, minimum score, and how to
check if nodes are visible.

- Better support for [deeply-nested content](https://github.com/mozilla/readability/pull/611).

- Readability is now more likely to [keep tables of content](https://github.com/mozilla/readability/pull/646).

- Better support for [content in `<code>` tags](https://github.com/mozilla/readability/pull/647).

- Readability (finally) no longer [throws away all `<h1>` tags](https://github.com/mozilla/readability/pull/650).

### Changed

- JSON-LD [support for multiple authors](https://github.com/mozilla/readability/pull/618)
  was improved.

- Elements with roles `menu`, `menubar`, `complementary`, `navigation`, `alert`,
  `alertdialog`, `dialog` will [all be removed](https://github.com/mozilla/readability/pull/619).


## [0.3.0] - 2020-08-05

The first version that was published on NPM.

Previously, we did not consistently version anything,
nor did we publish to NPM.

At some point, we may wish to expand this changelog into the past.
