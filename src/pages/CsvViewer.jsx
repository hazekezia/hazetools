import { useState, useRef, useMemo } from 'react';
import Papa from 'papaparse';
import { Upload, Search, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import './CsvViewer.css';

const CsvViewer = () => {
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [fileName, setFileName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const rowsPerPage = 50;
  
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          setHeaders(Object.keys(results.data[0]));
          setData(results.data);
          setCurrentPage(1);
          setSearchTerm('');
        }
      },
      error: (error) => {
        console.error('Error parsing CSV:', error);
        alert('Failed to parse CSV file.');
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

  // Filter data based on search term
  const filteredData = data.filter(row => {
    return Object.values(row).some(value => 
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Sort data
  const sortedData = useMemo(() => {
    let sortableItems = [...filteredData];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        
        const aNum = parseFloat(aVal);
        const bNum = parseFloat(bVal);
        const isNumeric = !isNaN(aNum) && !isNaN(bNum);

        if (isNumeric) {
           return sortConfig.direction === 'ascending' ? aNum - bNum : bNum - aNum;
        } else {
           const aStr = String(aVal).toLowerCase();
           const bStr = String(bVal).toLowerCase();
           if (aStr < bStr) {
             return sortConfig.direction === 'ascending' ? -1 : 1;
           }
           if (aStr > bStr) {
             return sortConfig.direction === 'ascending' ? 1 : -1;
           }
           return 0;
        }
      });
    }
    return sortableItems;
  }, [filteredData, sortConfig]);

  // Pagination logic
  const totalPages = Math.ceil(sortedData.length / rowsPerPage);
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = sortedData.slice(indexOfFirstRow, indexOfLastRow);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
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

      {!data.length ? (
        <div 
          className="csv-upload-zone glass-panel"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={64} className="upload-icon" style={{ color: 'var(--text-primary)' }} />
          <h3>Click or drag your .csv file here</h3>
          <p>Super fast client-side parsing</p>
          <input 
            type="file" 
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
              <span className="row-count">{data.length} rows</span>
              <button 
                className="btn-clear" 
                onClick={() => { setData([]); setFileName(''); }}
              >
                Clear
              </button>
            </div>
            <div className="search-box">
              <Search size={18} className="search-icon" />
              <input 
                type="text" 
                placeholder="Search across all columns..." 
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="input-field"
              />
            </div>
          </div>

          <div className="table-wrapper">
            <table className="csv-table">
              <thead>
                <tr>
                  {headers.map((header, idx) => (
                    <th key={idx} onClick={() => requestSort(header)} className="sortable-header">
                      <div className="header-content">
                        {header}
                        {sortConfig.key === header ? (
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
                      {headers.map((header, colIndex) => (
                        <td key={colIndex}>{row[header]}</td>
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
              Showing {filteredData.length > 0 ? indexOfFirstRow + 1 : 0} to {Math.min(indexOfLastRow, filteredData.length)} of {filteredData.length} entries
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
