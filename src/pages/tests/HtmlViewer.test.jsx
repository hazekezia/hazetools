import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import HtmlViewer from '../jsx/HtmlViewer';

// CodeMirror needs a ResizeObserver, which jsdom does not provide
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Read only rendered code lines (the empty-doc placeholder also renders in a line)
const editorText = (container) =>
  [...(container.querySelectorAll('.cm-line') ?? [])]
    .map((line) => (line.querySelector('.cm-placeholder') ? '' : line.textContent))
    .join('\n');

describe('HtmlViewer Page', () => {
  beforeAll(() => {
    globalThis.ResizeObserver = globalThis.ResizeObserver || ResizeObserverStub;
  });

  it('renders the CodeMirror editor with line numbers, fold gutter, and empty preview', () => {
    const { container } = render(<HtmlViewer />);
    expect(screen.getByText('HTML Viewer')).toBeInTheDocument();
    expect(container.querySelector('.cm-editor')).toBeInTheDocument();
    expect(container.querySelector('.cm-lineNumbers')).toBeInTheDocument();
    expect(container.querySelector('.cm-foldGutter')).toBeInTheDocument();
    expect(screen.getByText(/Your rendered output will appear here/)).toBeInTheDocument();
  });

  it('loads the sample HTML into the editor and renders the preview live', async () => {
    const { container } = render(<HtmlViewer />);

    fireEvent.click(screen.getByTitle('Load sample HTML'));

    await waitFor(() => {
      expect(editorText(container)).toContain('<!DOCTYPE html>');
      expect(screen.getAllByText('(sample.html)').length).toBeGreaterThan(0);
    });

    await waitFor(() => {
      expect(screen.getByTitle('HTML preview').getAttribute('srcdoc')).toContain('Hello from hz.tools!');
    });
    expect(screen.getByText(/No tag issues detected/)).toBeInTheDocument();
  });

  it('loads an HTML file on upload', async () => {
    const { container } = render(<HtmlViewer />);

    const file = new File(['<p>Uploaded content</p>'], 'test_page.html', { type: 'text/html' });
    fireEvent.change(screen.getByTestId('html-file-input'), { target: { files: [file] } });

    await waitFor(() => {
      expect(editorText(container)).toBe('<p>Uploaded content</p>');
      expect(screen.getAllByText('(test_page.html)').length).toBeGreaterThan(0);
    });
  });

  it('shows a tag warning when an unbalanced file is uploaded', async () => {
    render(<HtmlViewer />);

    const file = new File(['<div><p>test</div>'], 'bad.html', { type: 'text/html' });
    fireEvent.change(screen.getByTestId('html-file-input'), { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/Mismatched tag/)).toBeInTheDocument();
    });
  });

  it('collapses and expands all foldable elements without errors', async () => {
    const { container } = render(<HtmlViewer />);

    fireEvent.click(screen.getByTitle('Load sample HTML'));
    await waitFor(() => expect(editorText(container)).toContain('<!DOCTYPE html>'));

    expect(() => fireEvent.click(screen.getByTitle('Collapse All'))).not.toThrow();
    expect(() => fireEvent.click(screen.getByTitle('Expand All'))).not.toThrow();
  });

  it('copies the document to the clipboard', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    Object.assign(navigator, { clipboard: { writeText } });

    const { container } = render(<HtmlViewer />);
    fireEvent.click(screen.getByTitle('Load sample HTML'));
    await waitFor(() => expect(editorText(container)).toContain('<!DOCTYPE html>'));

    fireEvent.click(screen.getByTitle('Copy HTML'));
    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(expect.stringContaining('<!DOCTYPE html>'));
    });
  });

  it('clears the editor when Clear is clicked', async () => {
    const { container } = render(<HtmlViewer />);

    fireEvent.click(screen.getByTitle('Load sample HTML'));
    await waitFor(() => expect(editorText(container)).toContain('<!DOCTYPE html>'));

    fireEvent.click(screen.getByTitle('Clear'));
    await waitFor(() => {
      expect(editorText(container)).toBe('');
      expect(screen.queryByTitle('HTML preview')).not.toBeInTheDocument();
    });
  });

  it('disables action buttons when the editor is empty', () => {
    render(<HtmlViewer />);
    expect(screen.getByTitle('Collapse All')).toBeDisabled();
    expect(screen.getByTitle('Expand All')).toBeDisabled();
    expect(screen.getByTitle('Copy HTML')).toBeDisabled();
    expect(screen.getByTitle('Download HTML')).toBeDisabled();
    expect(screen.getByTitle('Clear')).toBeDisabled();
  });

  it('toggles between view modes', async () => {
    const { container } = render(<HtmlViewer />);

    const editorPanel = container.querySelector('.html-editor-panel');
    const previewPanel = container.querySelector('.html-preview-panel');
    expect(editorPanel).not.toHaveClass('panel-hidden');
    expect(previewPanel).not.toHaveClass('panel-hidden');

    fireEvent.click(screen.getByTitle('Preview Only'));
    expect(editorPanel).toHaveClass('panel-hidden');
    expect(previewPanel).not.toHaveClass('panel-hidden');

    fireEvent.click(screen.getByTitle('Code Only'));
    expect(editorPanel).not.toHaveClass('panel-hidden');
    expect(previewPanel).toHaveClass('panel-hidden');

    fireEvent.click(screen.getByTitle('Split View'));
    expect(editorPanel).not.toHaveClass('panel-hidden');
    expect(previewPanel).not.toHaveClass('panel-hidden');
  });
});
