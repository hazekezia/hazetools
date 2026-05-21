import { useState, useRef, useMemo, useEffect } from 'react';
import Papa from 'papaparse';
import { Upload, Search, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Loader2 } from 'lucide-react';
import './CsvViewer.css';

const CsvViewer = () => {
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [fileName, setFileName] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ index: null, direction: 'ascending' });
  const [isParsing, setIsParsing] = useState(false);
  const rowsPerPage = 50;
  
  const fileInputRef = useRef(null);

  // Debounce search input to prevent filtering lag on every keystroke
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchTerm(searchInput);
      setCurrentPage(1);
    }, 200);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    setIsParsing(true);
    
    // Parse using worker to avoid blocking the main UI thread
    Papa.parse(file, {
      header: false, // Array of arrays is ~5x more memory efficient than objects
      skipEmptyLines: true,
      worker: true,
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          const parsedHeaders = results.data[0];
          const parsedData = results.data.slice(1);
          setHeaders(parsedHeaders);
          setData(parsedData);
          setCurrentPage(1);
          setSearchInput('');
          setSearchTerm('');
          setSortConfig({ index: null, direction: 'ascending' });
          setIsParsing(false);
        } else {
          alert('CSV file is empty.');
          setIsParsing(false);
        }
      },
      error: (error) => {
        console.error('Error parsing CSV:', error);
        alert('Failed to parse CSV file.');
        setIsParsing(false);
      }
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
      const event = { target: { files: [file] } };
      handleFileUpload(event);
    }
  };

  // Highly optimized native filtering to process millions of rows instantly
  const filteredData = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return data;

    const results = [];
    const dataLength = data.length;
    const headersLength = headers.length;
    
    for (let i = 0; i < dataLength; i++) {
      const row = data[i];
      let match = false;
      for (let j = 0; j < headersLength; j++) {
        const cell = row[j];
        if (cell !== null && cell !== undefined && String(cell).toLowerCase().indexOf(query) !== -1) {
          match = true;
          break;
        }
      }
      if (match) {
        results.push(row);
      }
    }
    return results;
  }, [data, headers, searchTerm]);

  // Optimized sorting by column index
  const sortedData = useMemo(() => {
    if (sortConfig.index === null) return filteredData;
    
    const sortableItems = [...filteredData];
    const idx = sortConfig.index;
    const isAsc = sortConfig.direction === 'ascending';
    
    sortableItems.sort((a, b) => {
      const aVal = a[idx];
      const bVal = b[idx];
      
      const aNum = parseFloat(aVal);
      const bNum = parseFloat(bVal);
      const isNumeric = !isNaN(aNum) && !isNaN(bNum);

      if (isNumeric) {
         return isAsc ? aNum - bNum : bNum - aNum;
      } else {
         const aStr = String(aVal || '').toLowerCase();
         const bStr = String(bVal || '').toLowerCase();
         if (aStr < bStr) return isAsc ? -1 : 1;
         if (aStr > bStr) return isAsc ? 1 : -1;
         return 0;
      }
    });
    return sortableItems;
  }, [filteredData, sortConfig]);

  // Pagination logic
  const totalPages = Math.ceil(sortedData.length / rowsPerPage);
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = sortedData.slice(indexOfFirstRow, indexOfLastRow);

  const requestSort = (idx) => {
    let direction = 'ascending';
    if (sortConfig.index === idx && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ index: idx, direction });
  };

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  return (
    <div className="tool-page-container">
      <div className="tool-page-header">
        <h1 className="page-title">CSV Viewer</h1>
        <p className="page-subtitle">Instantly view and search your CSV files.</p>
      </div>

      {isParsing ? (
        <div className="loading-container glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px', gap: '1.5rem' }}>
          <Loader2 className="spinner" size={48} style={{ animation: 'spin 1s linear infinite' }} />
          <h3>Parsing CSV file...</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Optimizing data structures for instant viewing and searching.</p>
        </div>
      ) : !data.length ? (
        <div 
          className="csv-upload-zone glass-panel"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={64} className="upload-icon" style={{ color: 'var(--text-primary)' }} />
          <h3>Click or drag your .csv file here</h3>
          <p>Optimized client-side rendering for files up to millions of rows</p>
          <input 
            type="file" 
            data-testid="csv-file-input"
            ref={fileInputRef}
            onChange={handleFileUpload} 
            accept=".csv" 
            style={{ display: 'none' }}
          />
        </div>
      ) : (
        <div className="csv-viewer-container glass-panel">
          <div className="csv-toolbar">
            <div className="file-info">
              <span className="file-name">{fileName}</span>
              <span className="row-count">{data.length.toLocaleString()} rows</span>
              <button 
                className="btn-clear" 
                onClick={() => { setData([]); setHeaders([]); setFileName(''); }}
              >
                Clear
              </button>
            </div>
            <div className="search-box">
              <Search size={18} className="search-icon" />
              <input 
                type="text" 
                placeholder="Search across all columns..." 
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div className="table-wrapper">
            <table className="csv-table">
              <thead>
                <tr>
                  {headers.map((header, idx) => (
                    <th key={idx} onClick={() => requestSort(idx)} className="sortable-header">
                      <div className="header-content">
                        {header}
                        {sortConfig.index === idx ? (
                          sortConfig.direction === 'ascending' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                        ) : (
                          <ArrowUpDown size={14} className="sort-icon-idle" />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentRows.length > 0 ? (
                  currentRows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {headers.map((_, colIndex) => (
                        <td key={colIndex}>{row[colIndex]}</td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={headers.length} className="no-results">
                      No results found for "{searchTerm}"
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <span className="page-info">
              Showing {filteredData.length > 0 ? indexOfFirstRow + 1 : 0} to {Math.min(indexOfLastRow, filteredData.length)} of {filteredData.length.toLocaleString()} entries
            </span>
            <div className="pagination-controls">
              <button 
                onClick={handlePrevPage} 
                disabled={currentPage === 1}
                className="page-btn"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="current-page">Page {currentPage} of {totalPages || 1}</span>
              <button 
                onClick={handleNextPage} 
                disabled={currentPage === totalPages || totalPages === 0}
                className="page-btn"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CsvViewer;
