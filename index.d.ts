/**
 * Decides whether or not the document is reader-able without parsing the whole thing.
 * @return {boolean} Whether or not we suspect Readability.parse() will succeed at returning an article object.
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

export interface ReadabilityOptions<T = string> {
  /**
   * Whether to output debug messages. Defaults to `false`.
   */
  debug?: boolean;
  /**
   * The maximum number of elements to parse. If the document exceeds this,
   * Readability will stop processing. Useful for performance on very large documents.
   * Defaults to 0 (no limit).
   */
  maxElemsToParse?: number;
  /**
   * The number of top candidate nodes to consider when determining the main article content.
   * A higher number might lead to better results but could increase processing time.
   * Defaults to 5.
   */
  nbTopCandidates?: number;
  /**
   * The minimum number of characters required for a text node to be considered
   * significant and included in the article content.
   * Defaults to 500.
   */
  charThreshold?: number;
  /**
   * An array of class names to preserve. If `keepClasses` is `true`,
   * only classes in this array will be kept. Defaults to an empty array.
   */
  classesToPreserve?: string[];
  /**
   * If `true`, Readability will retain the original class names of elements
   * in the parsed article content. If `classesToPreserve` is also set,
   * only those specified classes will be kept. Defaults to `false`.
   */
  keepClasses?: boolean;
  /**
   * A function that serializes an HTML element into a string or another representation.
   * Defaults to `el => el.innerHTML`. This is used to get the content of the parsed article.
   * An identity function (`el => el`) may be useful for returning a DOM element as-is
   * for further processing.
   * @param el The Node to serialize.
   * @returns The HTML string representation of the element's content.
   */
  serializer?: (el: Node) => T;
  /**
   * If `true`, Readability will not attempt to parse or extract
   * JSON-LD structured data from the document. Defaults to `false`.
   */
  disableJSONLD?: boolean;
  /**
   * A regular expression used to validate video URLs. Only videos
   * matching this regex will be included in the parsed content.
   * Defaults to a regex that allows common video embedding platforms.
   */
  allowedVideoRegex?: RegExp;
  /**
   * A modifier applied to the link density score of an element.
   * This influences how Readability judges the main content area,
   * potentially helping with documents that have many or few links.
   * Defaults to 1.
   */
  linkDensityModifier?: number;
}

export class Readability<T = string> {
  constructor(
    document: Document,
    options?: ReadabilityOptions<T>
  );

  parse(): null | {
    /** article title */
    title: string | null | undefined;

    /** HTML string of processed article content */
    content: T | null | undefined;

    /** text content of the article, with all the HTML tags removed */
    textContent: string | null | undefined;

    /** length of an article, in characters */
    length: number | null | undefined;

    /** article description, or short excerpt from the content */
    excerpt: string | null | undefined;

    /** author metadata */
    byline: string | null | undefined;

    /** content direction */
    dir: string | null | undefined;

    /** name of the site */
    siteName: string | null | undefined;

    /** content language */
    lang: string | null | undefined;

    /** published time */
    publishedTime: string | null | undefined;
  };
}

// Assuming Article is the return type of Readability.prototype.parse()
export type Article = ReturnType<Readability['parse']>;

