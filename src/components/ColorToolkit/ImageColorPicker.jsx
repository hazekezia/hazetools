/* eslint-disable */
import { useState, useRef, useEffect } from 'react';
import { UploadCloud, Image as ImageIcon, Copy } from 'lucide-react';
import { getColorFromPixel, rgbToHex } from '../../utils/colorUtils';

const ImageColorPicker = ({ showToast, historyProps }) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const [hoverColor, setHoverColor] = useState(null);
  const [magnifierPos, setMagnifierPos] = useState({ x: 0, y: 0 });
  const [showMagnifier, setShowMagnifier] = useState(false);
  const [pickedColors, setPickedColors] = useState([]);
  
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
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
      setPickedColors([]); // Reset picked colors on new image
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

  // Draw image to canvas once loaded
  const onImageLoad = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const img = imageRef.current;
    
    // Set internal canvas size to match intrinsic image size
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);
  };

  const handleMouseMove = (e) => {
    if (!canvasRef.current || !containerRef.current || !imageRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Scale coordinates from display size to natural size
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    
    const pixelX = Math.floor(x * scaleX);
    const pixelY = Math.floor(y * scaleY);
    
    if (pixelX >= 0 && pixelX < canvasRef.current.width && pixelY >= 0 && pixelY < canvasRef.current.height) {
      setShowMagnifier(true);
      // Update magnifier pos (relative to container)
      const containerRect = containerRef.current.getBoundingClientRect();
      setMagnifierPos({
        x: e.clientX - containerRect.left,
        y: e.clientY - containerRect.top
      });
      
      const color = getColorFromPixel(imageRef.current, pixelX, pixelY);
      setHoverColor(color);
    } else {
      setShowMagnifier(false);
    }
  };

  const handleMouseLeave = () => {
    setShowMagnifier(false);
  };

  const handleClick = () => {
    if (hoverColor) {
      const hex = rgbToHex(hoverColor.r, hoverColor.g, hoverColor.b, 1);
      if (!pickedColors.includes(hex)) {
        setPickedColors(prev => [hex, ...prev].slice(0, 10)); // keep last 10
      }
      historyProps.addHistory(hex);
      showToast(`Picked ${hex.toUpperCase()}`);
    }
  };

  const getHoverHex = () => {
    if (!hoverColor) return '#000000';
    return rgbToHex(hoverColor.r, hoverColor.g, hoverColor.b, 1);
  };

  return (
    <div className="tool-section">
      <div className="glass-panel tool-card">
        <h2>Image Color Picker</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
          Upload, drag & drop, or paste an image. Hover over the image to inspect pixels, and click to pick colors.
        </p>

        {!imageSrc ? (
          <div 
            className={`dropzone ${isDragging ? 'active' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => document.getElementById('image-upload').click()}
          >
            <UploadCloud size={48} className="dropzone-icon" />
            <div>
              <strong>Click to upload</strong> or drag and drop<br />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>PNG, JPG, WEBP, or paste from clipboard (Ctrl+V)</span>
            </div>
            <input 
              id="image-upload" 
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
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ 
                  width: '40px', height: '40px', borderRadius: '8px', 
                  backgroundColor: getHoverHex(),
                  border: '1px solid var(--border-color)',
                  transition: 'background-color 0.1s'
                }} />
                <div>
                  <div style={{ fontWeight: 'bold' }}>{getHoverHex().toUpperCase()}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {hoverColor ? `rgb(${hoverColor.r}, ${hoverColor.g}, ${hoverColor.b})` : 'Hover to pick'}
                  </div>
                </div>
              </div>
              
              <button 
                className="btn-primary" 
                style={{ background: 'transparent', color: 'var(--text-primary)' }}
                onClick={() => setImageSrc(null)}
              >
                <ImageIcon size={18} /> Clear Image
              </button>
            </div>

            <div 
              className="image-canvas-container checkered-bg" 
              ref={containerRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              onClick={handleClick}
            >
              {/* Hidden image to hold intrinsic data */}
              <img 
                src={imageSrc} 
                ref={imageRef} 
                onLoad={onImageLoad} 
                style={{ display: 'none' }}
                crossOrigin="anonymous"
                alt="Source"
              />
              {/* Visible canvas */}
              <canvas ref={canvasRef} style={{ width: '100%' }} />

              {showMagnifier && hoverColor && (
                <div 
                  className="magnifier" 
                  style={{
                    left: `${magnifierPos.x - 50}px`, // center the 100x100 magnifier
                    top: `${magnifierPos.y - 50}px`,
                    backgroundColor: getHoverHex()
                  }}
                />
              )}
            </div>

            {pickedColors.length > 0 && (
              <div style={{ marginTop: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Picked Colors</h3>
                <div className="color-swatch-list">
                  {pickedColors.map((color, i) => (
                    <div 
                      key={i}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem'
                      }}
                    >
                      <div 
                        className="color-swatch"
                        style={{ backgroundColor: color, width: '48px', height: '48px' }}
                        onClick={() => {
                          navigator.clipboard.writeText(color);
                          showToast(`Copied ${color.toUpperCase()}`);
                        }}
                      />
                      <span style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>{color.toUpperCase()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};

export default ImageColorPicker;
