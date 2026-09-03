import { useState, useRef, useEffect, useMemo } from 'react';
import { EditorState } from '@codemirror/state';
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  highlightActiveLineGutter,
  drawSelection,
  placeholder as cmPlaceholder,
} from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import {
  syntaxHighlighting,
  HighlightStyle,
  indentOnInput,
  bracketMatching,
  foldGutter,
  foldKeymap,
  foldAll,
  unfoldAll,
} from '@codemirror/language';
import { html as htmlLang } from '@codemirror/lang-html';
import { tags } from '@lezer/highlight';
import {
  Upload,
  Copy,
  Check,
  Download,
  Code,
  Eye,
  Columns2,
  Sparkles,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  FileCode,
  Minimize2,
  Maximize2,
} from 'lucide-react';
import '../css/HtmlViewer.css';
import { htmlFoldService } from '../../utils/htmlFold';

// Helper: lightweight HTML tag-balance check (advisory only — HTML is forgiving)
const VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
]);

const checkTagBalance = (html) => {
  const stack = [];
  const cleaned = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<!doctype[^>]*>/gi, '')
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '');
  const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9-]*)\b[^>]*>/g;
  let match;
  while ((match = tagRegex.exec(cleaned)) !== null) {
    const raw = match[0];
    const tag = match[1].toLowerCase();
    if (raw.startsWith('</')) {
      if (stack.length === 0) {
        return { ok: false, message: `Unexpected closing tag </${tag}>` };
      }
      if (stack[stack.length - 1] === tag) {
        stack.pop();
      } else {
        return { ok: false, message: `Mismatched tag: expected </${stack[stack.length - 1]}>, found </${tag}>` };
      }
    } else if (!raw.endsWith('/>') && !VOID_ELEMENTS.has(tag)) {
      stack.push(tag);
    }
  }
  if (stack.length > 0) {
    const open = [...new Set(stack)].reverse().map((t) => `<${t}>`).join(', ');
    return { ok: false, message: `Unclosed tag(s): ${open}` };
  }
  return { ok: true, message: '' };
};

const SAMPLE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Sample Page</title>
  <style>
    body {
      font-family: 'Segoe UI', sans-serif;
      margin: 0;
      background: #0f172a;
      color: #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    .card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 16px;
      padding: 2.5rem 3rem;
      text-align: center;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
    }
    h1 { margin: 0 0 0.5rem; font-size: 1.75rem; }
    p { margin: 0 0 1.5rem; color: #94a3b8; }
    button {
      background: #38bdf8;
      color: #0f172a;
      border: none;
      border-radius: 8px;
      padding: 0.65rem 1.5rem;
      font-weight: 600;
      cursor: pointer;
    }
    button:hover { background: #7dd3fc; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Hello from hz.tools!</h1>
    <p>This is a live preview of your HTML document.</p>
    <button onclick="document.querySelector('h1').textContent = 'Nice, scripts work!'">Try me</button>
  </div>
</body>
</html>`;

// Syntax highlight colors (GitHub-dark-ish, tuned for the hz.tools theme)
const htmlHighlightStyle = HighlightStyle.define([
  { tag: tags.tagName, color: '#ff7b72' },
  { tag: tags.attributeName, color: '#79c0ff' },
  { tag: [tags.string, tags.attributeValue], color: '#7ee787' },
  { tag: tags.comment, color: '#8b949e', fontStyle: 'italic' },
  { tag: tags.meta, color: '#d2a8ff' },
  { tag: [tags.bracket, tags.angleBracket, tags.contentSeparator], color: '#8b949e' },
]);

// Dark editor look consistent with the rest of the app
const htmlEditorTheme = EditorView.theme(
  {
    '&': {
      height: '100%',
      backgroundColor: '#0d1117',
      color: '#e6edf3',
      fontSize: '0.875rem',
    },
    '.cm-scroller': {
      fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
      lineHeight: '1.6',
      overflow: 'auto',
    },
    '.cm-content': {
      caretColor: '#e6edf3',
      padding: '0.75rem 0',
    },
    '.cm-line': {
      padding: '0 1rem',
    },
    '.cm-placeholder': {
      color: '#7d8590',
      fontStyle: 'italic',
    },
    '.cm-cursor, .cm-dropCursor': {
      borderLeftColor: '#e6edf3',
    },
    '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
      backgroundColor: 'rgba(56, 139, 253, 0.3)',
    },
    '.cm-gutters': {
      backgroundColor: '#010409',
      color: '#6e7681',
      border: 'none',
      borderRight: '1px solid var(--border-color)',
    },
    '.cm-lineNumbers .cm-gutterElement': {
      minWidth: '2.6rem',
      padding: '0 0.6rem 0 0.9rem',
    },
    '.cm-activeLine': {
      backgroundColor: 'rgba(255, 255, 255, 0.04)',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'rgba(255, 255, 255, 0.06)',
      color: '#e6edf3',
    },
    '.cm-foldGutter .cm-gutterElement': {
      cursor: 'pointer',
    },
    '.cm-foldPlaceholder': {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      border: '1px solid var(--border-color)',
      borderRadius: '4px',
      color: '#8b949e',
      padding: '0 0.4rem',
    },
    '.cm-matchingBracket': {
      backgroundColor: 'rgba(139, 148, 158, 0.18)',
      outline: '1px solid rgba(139, 148, 158, 0.4)',
    },
    '&.cm-focused': {
      outline: 'none',
    },
  },
  { dark: true }
);

const HtmlViewer = () => {
  const [html, setHtml] = useState('');
  const [previewHtml, setPreviewHtml] = useState('');
  const [view, setView] = useState('split'); // 'split' | 'preview' | 'code'
  const [copied, setCopied] = useState(false);
  const [fileName, setFileName] = useState('');
  const editorHostRef = useRef(null);
  const viewRef = useRef(null);
  const fileInputRef = useRef(null);

  // Debounce live preview updates while typing
  useEffect(() => {
    const timer = setTimeout(() => setPreviewHtml(html), 300);
    return () => clearTimeout(timer);
  }, [html]);

  const validation = useMemo(
    () => (html.trim() ? checkTagBalance(html) : { ok: true, message: '' }),
    [html]
  );

  // Mount CodeMirror once; the doc is the source of truth, mirrored into `html`
  // on every change via the update listener.
  useEffect(() => {
    const view = new EditorView({
      state: EditorState.create({
        doc: '',
        extensions: [
          lineNumbers(),
          highlightActiveLineGutter(),
          highlightActiveLine(),
          history(),
          drawSelection(),
          indentOnInput(),
          bracketMatching(),
          foldGutter(),
          htmlLang({ autoCloseTags: true, matchClosingTags: true }),
          htmlFoldService,
          syntaxHighlighting(htmlHighlightStyle),
          htmlEditorTheme,
          cmPlaceholder('Write or paste your HTML here...'),
          keymap.of([...defaultKeymap, ...historyKeymap, ...foldKeymap, indentWithTab]),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              setHtml(update.state.doc.toString());
              setCopied(false);
              setFileName('');
            }
          }),
        ],
      }),
      parent: editorHostRef.current,
    });
    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  const setDoc = (text) => {
    const view = viewRef.current;
    if (!view) return;
    const cur = view.state.doc.toString();
    if (cur !== text) {
      view.dispatch({ changes: { from: 0, to: cur.length, insert: text } });
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setDoc(event.target.result);
      setFileName(file.name);
      setCopied(false);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.type === 'text/html' || /\.html?$/i.test(file.name))) {
      handleFileUpload({ target: { files: [file] } });
    }
  };

  const handleLoadSample = () => {
    setDoc(SAMPLE_HTML);
    setFileName('sample.html');
    setCopied(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(html).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownload = () => {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || 'document.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    setFileName('');
    setCopied(false);
    setDoc('');
  };

  const handleCollapseAll = () => {
    const view = viewRef.current;
    if (view) foldAll(view, 0, view.state.doc.length);
  };

  const handleExpandAll = () => {
    const view = viewRef.current;
    if (view) unfoldAll(view, 0, view.state.doc.length);
  };

  const showEditor = view === 'split' || view === 'code';
  const showPreview = view === 'split' || view === 'preview';

  return (
    <div className="tool-page-container">
      <div className="tool-page-header">
        <h1 className="page-title">HTML Viewer</h1>
        <p className="page-subtitle">Write or load HTML and see it rendered live — right in your browser.</p>
      </div>

      <div className="html-content">
        {/* Toolbar */}
        <div className="html-toolbar glass-panel">
          <div className="html-view-toggle" role="group" aria-label="View mode">
            <button
              className={`view-toggle-btn ${view === 'split' ? 'active' : ''}`}
              onClick={() => setView('split')}
              title="Split View"
            >
              <Columns2 size={16} />
              <span>Split</span>
            </button>
            <button
              className={`view-toggle-btn ${view === 'preview' ? 'active' : ''}`}
              onClick={() => setView('preview')}
              title="Preview Only"
            >
              <Eye size={16} />
              <span>Preview</span>
            </button>
            <button
              className={`view-toggle-btn ${view === 'code' ? 'active' : ''}`}
              onClick={() => setView('code')}
              title="Code Only"
            >
              <Code size={16} />
              <span>Code</span>
            </button>
          </div>
          <div className="html-toolbar-actions">
            <button className="btn-icon" onClick={handleCollapseAll} disabled={!html.trim()} title="Collapse All">
              <Minimize2 size={18} />
            </button>
            <button className="btn-icon" onClick={handleExpandAll} disabled={!html.trim()} title="Expand All">
              <Maximize2 size={18} />
            </button>
            <button className="btn-primary btn-sm" onClick={handleLoadSample} title="Load sample HTML">
              <Sparkles size={16} />
              Sample
            </button>
            <button className="btn-icon" onClick={handleCopy} disabled={!html.trim()} title="Copy HTML">
              {copied ? <Check size={18} /> : <Copy size={18} />}
            </button>
            <button className="btn-icon" onClick={handleDownload} disabled={!html.trim()} title="Download HTML">
              <Download size={18} />
            </button>
            <button className="btn-icon" onClick={handleClear} disabled={!html.trim()} title="Clear">
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        {/* Workspace */}
        <div className={`html-viewer-grid ${view}`}>
          <div className={`html-editor-panel glass-panel ${showEditor ? '' : 'panel-hidden'}`}>
            <div className="panel-header">
              <span className="panel-title">HTML</span>
              <div className="panel-header-actions">
                {fileName && (
                  <span className="html-filename" title={fileName}>
                    ({fileName})
                  </span>
                )}
                <button
                  className="btn-icon"
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload HTML file"
                >
                  <Upload size={16} />
                </button>
              </div>
              <input
                type="file"
                data-testid="html-file-input"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".html,.htm,text/html"
                style={{ display: 'none' }}
              />
            </div>
            <div
              className="html-editor-wrap"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              <div ref={editorHostRef} className="html-cm-host" />
            </div>
          </div>

          <div className={`html-preview-panel glass-panel ${showPreview ? '' : 'panel-hidden'}`}>
            <div className="panel-header">
              <span className="panel-title">Preview</span>
            </div>
            {previewHtml.trim() ? (
              <iframe
                className="html-preview-frame"
                title="HTML preview"
                sandbox="allow-scripts"
                srcDoc={previewHtml}
              />
            ) : (
              <div className="html-preview-empty">
                <FileCode size={40} />
                <p>Your rendered output will appear here.</p>
                <p className="html-preview-hint">Type or load some HTML to see it rendered.</p>
              </div>
            )}
          </div>
        </div>

        {/* Status bar */}
        <div className="html-status-bar">
          <span className="status-item">{html.length} characters</span>
          {fileName && <span className="status-item html-filename">({fileName})</span>}
          {html.trim() && !validation.ok && (
            <span className="status-item status-warning">
              <AlertTriangle size={14} />
              {validation.message}
            </span>
          )}
          {html.trim() && validation.ok && (
            <span className="status-item status-success">
              <CheckCircle2 size={14} />
              No tag issues detected
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default HtmlViewer;
