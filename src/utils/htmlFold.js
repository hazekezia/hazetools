import { html } from '@codemirror/lang-html';
import { syntaxTree, foldService } from '@codemirror/language';

// Code folding for HTML.
//
// A fold region runs from the end of an element's opening tag to the start
// of its closing tag, so only the children are hidden and both tags stay
// visible: folding `  <div>\n    <p>a</p>\n  </div>` shows `  <div>⋯</div>`.
//
// The same logic powers the CodeMirror fold service (triangle in the gutter /
// folding keybindings) and findFoldableRanges() used by "Collapse all".

// Given the text of one whole element (from its '<' to the end of its closing
// tag), return { from, to } spanning its children only, or null.
const elementChildRange = (text) => {
  // End of the opening tag: first '>' outside of quoted attribute values
  let i = 0;
  let quote = null;
  let openEnd = -1;
  while (i < text.length) {
    const ch = text[i];
    if (quote) {
      if (ch === quote) quote = null;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (ch === '>') {
      openEnd = i + 1;
      break;
    }
    i += 1;
  }
  if (openEnd === -1) return null;

  // Start of the closing tag: the element's own '</...>' ends the text, so the
  // last '</' occurrence is its start.
  const rel = text.lastIndexOf('</', text.length);
  if (rel <= openEnd) return null;
  if (!/^<\/[a-zA-Z][\w-]*[^>]*>$/.test(text.slice(rel))) return null;
  return { from: openEnd, to: rel };
};

// CodeMirror fold service: answers a fold region for the element whose
// opening tag starts on the queried line.
export const htmlFoldService = foldService.of((state, lineStart) => {
  const tree = syntaxTree(state);
  const doc = state.doc;
  const wantLine = doc.lineAt(lineStart).number;

  // Walk up to an Element whose opening tag sits on the queried line
  let node = tree.resolveInner(lineStart, 1);
  for (; node; node = node.parent) {
    if (node.name !== 'Element') continue;
    if (doc.lineAt(node.from).number !== wantLine) continue;

    const text = doc.sliceString(node.from, node.to);
    const range = elementChildRange(text);
    if (!range) return null;
    const from = node.from + range.from;
    const to = node.from + range.to;
    if (doc.lineAt(to).number <= doc.lineAt(from).number) return null;
    return { from, to };
  }
  return null;
});

const lineStartsOf = (text) => {
  const starts = [0];
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] === '\n') starts.push(i + 1);
  }
  return starts;
};

// Pure helper: foldable element ranges for a raw HTML string.
// Returns [{ startLine, endLine, from, to }] with 1-based line numbers.
export const findFoldableRanges = (htmlText) => {
  const tree = html().language.parser.parse(htmlText);
  const starts = lineStartsOf(htmlText);
  const lineOf = (pos) => {
    let lo = 0;
    let hi = starts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (starts[mid] <= pos) lo = mid;
      else hi = mid - 1;
    }
    return lo + 1;
  };

  const ranges = [];
  const cursor = tree.cursor();
  do {
    if (cursor.name !== 'Element') continue;
    const text = htmlText.slice(cursor.from, cursor.to);
    const range = elementChildRange(text);
    if (!range) continue;
    const from = cursor.from + range.from;
    const to = cursor.from + range.to;
    if (lineOf(to) <= lineOf(from)) continue;
    ranges.push({ startLine: lineOf(cursor.from), endLine: lineOf(cursor.to), from, to });
  } while (cursor.next());
  return ranges;
};
