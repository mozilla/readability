/**
 * Decides whether or not the document is reader-able without parsing the whole thing.
 * @return {boolean} Whether or not we suspect Readability.parse() will suceeed at returning an article object.
 */
export function isProbablyReaderable(
  document: Document,
  options?: {
    /** The minimum node content length used to decide if the document is readerable. */
    minContentLength?: number;
    /** The minumum cumulated 'score' used to determine if the document is readerable. */
    minScore?: number;
    /** The function used to determine if a node is visible. */
    visibilityChecker?: (node: Node) => boolean;
  }
): boolean;

export class Readability<T = string> {
  constructor(
    document: Document,
    options?: {
      debug?: boolean;
      maxElemsToParse?: number;
      nbTopCandidates?: number;
      charThreshold?: number;
      classesToPreserve?: string[];
      keepClasses?: boolean;
      serializer?: (node: Node) => T;
      disableJSONLD?: boolean;
    }
  );

  parse(): null | {
    /** article title */
    title: string;

    /** HTML string of processed article content */
    content: T;

    /** text content of the article, with all the HTML tags removed */
    textContent: string;

    /** length of an article, in characters */
    length: number;

    /** article description, or short excerpt from the content */
    excerpt: string;

    /** author metadata */
    byline: string;

    /** content direction */
    dir: string;

    /** name of the site */
    siteName: string;

    /** content language */
    lang: string;
  };
}

export const REGEXPS: {
  unlikelyCandidates: RegExp;
  okMaybeItsACandidate: RegExp;
  positive: RegExp;
  negative: RegExp;
  extraneous: RegExp;
  byline: RegExp;
  replaceFonts: RegExp;
  normalize: RegExp;
  videos: RegExp;
  shareElements: RegExp;
  nextLink: RegExp;
  prevLink: RegExp;
  tokenize: RegExp;
  whitespace: RegExp;
  hasContent: RegExp;
  hashUrl: RegExp;
  srcsetUrl: RegExp;
  b64DataUrl: RegExp;
  jsonLdArticleTypes: RegExp;
}
