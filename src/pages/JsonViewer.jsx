import { useState, useRef, useMemo, useCallback } from 'react';
import { Upload, Copy, Check, Download, Minus, Plus, Search, AlertCircle, Eye, EyeOff, FileJson } from 'lucide-react';
import './JsonViewer.css';

// Helper: safe JSON parse
const safeParse = (str) => {
  try {
    return { data: JSON.parse(str), error: null };
  } catch (e) {
    return { data: null, error: e.message };
  }
};

// Recursive tree node component
const TreeNode = ({ name, value, path, defaultExpanded }) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const isObject = value !== null && typeof value === 'object';
  const isArray = Array.isArray(value);
  const isExpandable = isObject;

  const type = isArray ? 'array' : typeof value;
  const displayValue = !isExpandable ? JSON.stringify(value) : '';

  const toggle = () => setExpanded(prev => !prev);

  // Determine value color class
  let valueClass = 'json-value ';
  if (type === 'string') valueClass += 'json-string';
  else if (type === 'number') valueClass += 'json-number';
  else if (type === 'boolean') valueClass += 'json-boolean';
  else if (value === null) valueClass += 'json-null';
  else valueClass += 'json-other';

  const entries = isArray
    ? value.map((item, idx) => ({ key: idx, value: item }))
    : isObject
    ? Object.entries(value).map(([k, v]) => ({ key: k, value: v }))
    : [];

  return (
    <div className="tree-node">
      <div
        className={`tree-node-label ${isExpandable ? 'expandable' : ''}`}
        onClick={isExpandable ? toggle : undefined}
        style={{ cursor: isExpandable ? 'pointer' : 'default' }}
      >
        {isExpandable && (
          <span className="tree-toggle">
            {expanded ? <Minus size={12} /> : <Plus size={12} />}
          </span>
        )}
        {name !== undefined && name !== null && (
          <span className="tree-key">"{name}"</span>
        )}
        {isExpandable ? (
          <span className="tree-bracket">
            {isArray ? `[${value.length}]` : `{${Object.keys(value).length}}`}
          </span>
        ) : (
          <span className={valueClass}>{displayValue}</span>
        )}
      </div>
      {isExpandable && expanded && (
        <div className="tree-children">
          {entries.map(({ key, value: childValue }) => (
            <TreeNode
              key={key}
              name={key}
              value={childValue}
              path={path ? `${path}.${key}` : `${key}`}
              defaultExpanded={false}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const JsonViewer = () => {
  const [inputText, setInputText] = useState('');
  const [parsed, setParsed] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showInput, setShowInput] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef(null);

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    setError(null);
    setParsed(null);
    setSearchResults([]);
    setFileName('');
  };

  const handleParse = () => {
    if (!inputText.trim()) {
      setError('Please enter JSON');
      return;
    }
    const { data, error: parseError } = safeParse(inputText);
    if (parseError) {
      setError(parseError);
      setParsed(null);
    } else {
      setError(null);
      setParsed(data);
      setShowInput(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      setInputText(text);
      // Automatically parse
      const { data, error: parseError } = safeParse(text);
      if (parseError) {
        setError(parseError);
        setParsed(null);
      } else {
        setError(null);
        setParsed(data);
        setShowInput(false);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.type === 'application/json' || file.name.endsWith('.json'))) {
      const event = { target: { files: [file] } };
      handleFileUpload(event);
    }
  };

  const handleCopy = () => {
    if (parsed) {
      const jsonString = JSON.stringify(parsed, null, 2);
      navigator.clipboard.writeText(jsonString).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const handleDownload = () => {
    if (parsed) {
      const jsonString = JSON.stringify(parsed, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || 'data.json';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleBeautify = () => {
    if (parsed) {
      setInputText(JSON.stringify(parsed, null, 2));
    } else {
      const { data, error: parseError } = safeParse(inputText);
      if (!parseError) {
        setInputText(JSON.stringify(data, null, 2));
      }
    }
  };

  const handleMinify = () => {
    if (parsed) {
      setInputText(JSON.stringify(parsed));
    } else {
      const { data, error: parseError } = safeParse(inputText);
      if (!parseError) {
        setInputText(JSON.stringify(data));
      }
    }
  };

  // Search inside parsed tree - flatten paths
  const flattenObject = (obj, prefix = '') => {
    let result = [];
    if (obj === null || typeof obj !== 'object') {
      result.push({ path: prefix, value: obj });
      return result;
    }
    if (Array.isArray(obj)) {
      obj.forEach((item, idx) => {
        const newPrefix = prefix ? `${prefix}[${idx}]` : `[${idx}]`;
        result = result.concat(flattenObject(item, newPrefix));
      });
    } else {
      for (const key in obj) {
        const newPrefix = prefix ? `${prefix}.${key}` : key;
        result = result.concat(flattenObject(obj[key], newPrefix));
      }
    }
    return result;
  };

  const performSearch = useCallback((query) => {
    if (!parsed || !query.trim()) {
      setSearchResults([]);
      return;
    }
    const flat = flattenObject(parsed);
    const lowerQuery = query.toLowerCase();
    const results = flat.filter(
      (item) =>
          item.path.toLowerCase().includes(lowerQuery) ||
          String(item.value).toLowerCase().includes(lowerQuery)
    );
    setSearchResults(results.slice(0, 50)); // limit
  }, [parsed]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    performSearch(e.target.value);
  };

  const handleNewFile = () => {
    setInputText('');
    setParsed(null);
    setError(null);
    setShowInput(true);
    setSearchQuery('');
    setSearchResults([]);
    setFileName('');
  };

  // Toggle between input and tree view
  const toggleView = () => setShowInput(prev => !prev);

  // Determine tree default expanded depth
  const defaultExpanded = useMemo(() => parsed !== null && typeof parsed === 'object', [parsed]);

  return (
    <div className="tool-page-container">
      <div className="tool-page-header">
        <h1 className="page-title">JSON Viewer</h1>
        <p className="page-subtitle">View, format, validate, and explore JSON data.</p>
      </div>

      <div className="json-content">
        {/* Input Section */}
        {showInput && (
          <div className="json-input-grid">
            {/* Upload Zone */}
            <div
              className="json-upload-zone glass-panel"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{ cursor: 'pointer' }}
            >
              <Upload size={48} className="upload-icon" />
              <h3>Click or drag your .json file here</h3>
              <p>Fully secure client-side JSON processing</p>
              <input
                type="file"
                data-testid="json-file-input"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".json,application/json"
                style={{ display: 'none' }}
              />
            </div>

            {/* Text Area Input */}
            <div className="json-input-section glass-panel">
              <div className="json-input-header">
                <h3>Or Paste/Type JSON</h3>
              </div>
              <textarea
                className="json-textarea input-field"
                value={inputText}
                onChange={handleInputChange}
                placeholder='Paste your JSON here, e.g. { "key": "value" }'
                rows={10}
                spellCheck={false}
              />
              <div className="json-input-footer">
                <div className="format-buttons">
                  <button className="btn-primary btn-sm" onClick={handleBeautify} disabled={!inputText.trim()}>
                    Beautify
                  </button>
                  <button className="btn-primary btn-sm" onClick={handleMinify} disabled={!inputText.trim()}>
                    Minify
                  </button>
                </div>
                <button
                  className="btn-primary"
                  onClick={handleParse}
                  disabled={!inputText.trim()}
                >
                  Parse
                </button>
              </div>
              {error && (
                <div className="json-error">
                  <AlertCircle size={18} />
                  <span>Invalid JSON: {error}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tree View Section */}
        {parsed && !showInput && (
          <div className="json-tree-section glass-panel">
            <div className="json-toolbar">
              <div className="toolbar-left">
                <span className="toolbar-status">
                  Valid JSON <span className="status-dot success"></span>
                </span>
                {fileName && (
                  <span className="toolbar-filename" title={fileName}>
                    ({fileName})
                  </span>
                )}
                <div className="search-box">
                  <Search size={16} />
                  <input
                    type="text"
                    placeholder="Search keys/values..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="input-field search-input"
                  />
                </div>
              </div>
              <div className="toolbar-right">
                <button className="btn-icon" onClick={handleCopy} title="Copy formatted JSON">
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                </button>
                <button className="btn-icon" onClick={handleDownload} title="Download JSON">
                  <Download size={18} />
                </button>
                <button className="btn-icon" onClick={toggleView} title="Edit JSON">
                  <EyeOff size={18} />
                </button>
                <button className="btn-primary btn-sm" onClick={handleNewFile}>
                  New File
                </button>
              </div>
            </div>

            {/* Search Results */}
            {searchQuery.trim() && searchResults.length > 0 && (
              <div className="search-results">
                <span className="search-results-count">
                  Found {searchResults.length} result(s):
                </span>
                <ul className="search-results-list">
                  {searchResults.map((item, idx) => (
                    <li key={idx} className="search-result-item">
                      <code className="search-path">{item.path}</code>
                      <code className="search-value">{JSON.stringify(item.value)}</code>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="tree-container">
              <TreeNode
                name="root"
                value={parsed}
                path="root"
                defaultExpanded={defaultExpanded}
              />
            </div>
          </div>
        )}

        {/* Empty error helper */}
        {!parsed && !showInput && (
          <div className="json-input-section glass-panel" style={{ textAlign: 'center', padding: '2rem' }}>
            <FileJson size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <p>No JSON loaded. Click 'New File' or upload a file.</p>
            <button className="btn-primary" onClick={handleNewFile} style={{ marginTop: '1rem' }}>
              Start New
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default JsonViewer;