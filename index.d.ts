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
      allowedVideoRegex?: RegExp;
    }
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

export interface ReadabilityOptions {
  debug?: boolean; // Whether to output debug messages. Defaults to `false`.
  maxElemsToScan?: number;
  /**
   * An object of callback functions that can be used to extend Readability's behavior.
   * Currently, no specific callbacks are detailed or widely used.
   * It's treated as a generic object (`Record<string, unknown>`).
   */
  callbacks?: Record<string, unknown>;
  url?: string; // The base URL for resolving relative URLs. defaults to the document's `baseURI`.
  keepClasses?: boolean;
  /**
   * An array of class names to preserve. If `keepClasses` is `true`,
   * only classes in this array will be kept. Defaults to an empty array.
   */
  classesToPreserve?: string[];
/**
   * A function that serializes an HTML element into a string.
   * Defaults to `el => el.innerHTML`. This is used to get the content
   * of the parsed article.
   * @param el The HTMLElement to serialize.
   * @returns The HTML string representation of the element's content.
   */
  serializer?: (el: Node) => string;
  /**
   * When `true`, Readability skips some browser-specific operations
   * (e.g., scroll behavior modification) that might be problematic in
   * non-browser environments like JSDOM. Defaults to `false`.
   */
  headless?: boolean;
}

