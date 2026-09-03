import { findFoldableRanges } from './htmlFold';

describe('findFoldableRanges', () => {
  it('finds a fold region between the open and close tags of a multi-line element', () => {
    const html = '<div class="a">\n  <p>x</p>\n</div>';
    const ranges = findFoldableRanges(html);
    expect(ranges).toHaveLength(1);
    const r = ranges[0];
    expect(r.startLine).toBe(1);
    expect(r.endLine).toBe(3);
    // from = after '>' of <div class="a">, to = start of '</div>'
    expect(html.slice(r.from, r.to)).toBe('\n  <p>x</p>\n');
  });

  it('ignores single-line elements and void elements', () => {
    const html = '<div><p>a</p></div>\n<img src="x.png">\n<span>s</span>';
    expect(findFoldableRanges(html)).toHaveLength(0);
  });

  it('reports nested foldable elements', () => {
    const html = '<section>\n  <div>\n    <p>a</p>\n  </div>\n</section>';
    const ranges = findFoldableRanges(html);
    const starts = ranges.map((r) => r.startLine).sort();
    expect(starts).toEqual([1, 2]); // outer <section> + inner <div>
  });

  it('keeps the region outside quoted values with > in attributes', () => {
    const html = '<div title="a > b">\n  <p>x</p>\n</div>';
    const ranges = findFoldableRanges(html);
    expect(ranges).toHaveLength(1);
    expect(html.slice(ranges[0].from, ranges[0].to)).toBe('\n  <p>x</p>\n');
  });
});
