/* eslint-disable */
import { useState, useRef, useEffect } from 'react';
import { UploadCloud, Image as ImageIcon, Copy } from 'lucide-react';
import { extractColorsFromImage } from '../../utils/colorUtils';

const PaletteGenerator = ({ showToast, historyProps }) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [palette, setPalette] = useState([]);
  const imageRef = useRef(null);

  // Handle file input
  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) {
      showToast('Please upload a valid image file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageSrc(e.target.result);
      setPalette([]);
      setIsProcessing(true);
    };
    reader.readAsDataURL(file);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const onPaste = (e) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        handleFile(items[i].getAsFile());
        break;
      }
    }
  };

  useEffect(() => {
    document.addEventListener('paste', onPaste);
    return () => {
      document.removeEventListener('paste', onPaste);
    };
  }, []);

  const generatePalette = () => {
    if (imageRef.current) {
      // Use setTimeout to allow the UI to render the loading state
      setTimeout(() => {
        try {
          const colors = extractColorsFromImage(imageRef.current, 6);
          setPalette(colors);
        } catch (error) {
          showToast('Failed to extract palette. Image might be corrupt.');
        } finally {
          setIsProcessing(false);
        }
      }, 50);
    }
  };

  const copyColor = (hex) => {
    navigator.clipboard.writeText(hex);
    historyProps.addHistory(hex);
    showToast(`Copied ${hex.toUpperCase()}`);
  };

  return (
    <div className="tool-section">
      <div className="glass-panel tool-card">
        <h2>Palette Generator</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
          Upload an image to automatically extract a beautiful, balanced color palette based on its dominant colors.
        </p>

        {!imageSrc ? (
          <div 
            className={`dropzone ${isDragging ? 'active' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => document.getElementById('palette-upload').click()}
          >
            <UploadCloud size={48} className="dropzone-icon" />
            <div>
              <strong>Click to upload</strong> or drag and drop<br />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>PNG, JPG, WEBP, or paste from clipboard (Ctrl+V)</span>
            </div>
            <input 
              id="palette-upload" 
              type="file" 
              accept="image/*" 
              style={{ display: 'none' }} 
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFile(e.target.files[0]);
                }
              }}
            />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem' }}>Extracted Palette</h3>
              <button 
                className="btn-primary" 
                style={{ background: 'transparent', color: 'var(--text-primary)', padding: '0.5rem 1rem' }}
                onClick={() => setImageSrc(null)}
              >
                <ImageIcon size={16} /> New Image
              </button>
            </div>

            <div style={{ 
              display: 'flex', justifyContent: 'center', 
              background: '#1a1a1a', padding: '1rem', borderRadius: '12px',
              border: '1px solid var(--border-color)'
            }}>
              <img 
                src={imageSrc} 
                ref={imageRef} 
                onLoad={generatePalette}
                style={{ maxHeight: '300px', maxWidth: '100%', objectFit: 'contain', borderRadius: '8px' }}
                crossOrigin="anonymous"
                alt="Source"
              />
            </div>

            {isProcessing ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                Analyzing image colors...
              </div>
            ) : palette.length > 0 ? (
              <div className="palette-bar">
                {palette.map((color, index) => (
                  <div 
                    key={index} 
                    className="palette-color" 
                    style={{ backgroundColor: color }}
                    onClick={() => copyColor(color)}
                    title={`Copy ${color.toUpperCase()}`}
                  >
                    <div className="palette-hex">{color.toUpperCase()}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                Could not find dominant colors.
              </div>
            )}

            {palette.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button 
                  className="btn-primary"
                  onClick={() => {
                    const cssVars = palette.map((c, i) => `--color-${i + 1}: ${c};`).join('\n');
                    navigator.clipboard.writeText(`:root {\n${cssVars}\n}`);
                    showToast("Copied palette to clipboard as CSS variables");
                  }}
                >
                  <Copy size={16} /> Export as CSS Variables
                </button>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};

export default PaletteGenerator;
