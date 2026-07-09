/* eslint-disable */
import { useState, useEffect } from 'react';
import { Copy, Heart, Clock } from 'lucide-react';
import { 
  hexToRgb, rgbToHex, rgbToHsl, hslToRgb, rgbToHsv, hsvToRgb 
} from '../../utils/colorUtils';

const ColorPicker = ({ historyProps, showToast }) => {
  const { history, favorites, addHistory, toggleFavorite, isFavorite } = historyProps;
  
  // Base color state in RGB and Alpha
  const [color, setColor] = useState({ r: 99, g: 102, b: 241, a: 1 });
  
  // Derived strings for inputs
  const [hex, setHex] = useState('#6366f1');
  const [hsl, setHsl] = useState({ h: 239, s: 83, l: 67 });
  const [hsv, setHsv] = useState({ h: 239, s: 59, v: 95 });

  // Sync derived states when base color changes
  useEffect(() => {
    const newHex = rgbToHex(color.r, color.g, color.b, color.a);
    if (newHex.toLowerCase() !== hex.toLowerCase()) setHex(newHex);
    setHsl(rgbToHsl(color.r, color.g, color.b));
    setHsv(rgbToHsv(color.r, color.g, color.b));
    
    // Debounce adding to history
    const timeout = setTimeout(() => {
      addHistory(rgbToHex(color.r, color.g, color.b, 1));
    }, 1000);
    return () => clearTimeout(timeout);
  }, [color]);

  const handleHexChange = (e) => {
    const val = e.target.value;
    setHex(val);
    if (val.length === 7 || val.length === 9) {
      const rgb = hexToRgb(val);
      if (rgb) setColor(rgb);
    }
  };

  const handleRgbChange = (field, value) => {
    const num = Math.min(255, Math.max(0, parseInt(value) || 0));
    setColor(prev => ({ ...prev, [field]: num }));
  };

  const handleAlphaChange = (value) => {
    const num = Math.min(1, Math.max(0, parseFloat(value) || 0));
    setColor(prev => ({ ...prev, a: num }));
  };

  const handleHslChange = (field, value) => {
    const num = field === 'h' 
      ? Math.min(360, Math.max(0, parseInt(value) || 0))
      : Math.min(100, Math.max(0, parseInt(value) || 0));
    
    const newHsl = { ...hsl, [field]: num };
    setHsl(newHsl);
    const rgb = hslToRgb(newHsl.h, newHsl.s, newHsl.l);
    setColor(prev => ({ ...rgb, a: prev.a }));
  };

  const handleHsvChange = (field, value) => {
    const num = field === 'h' 
      ? Math.min(360, Math.max(0, parseInt(value) || 0))
      : Math.min(100, Math.max(0, parseInt(value) || 0));
    
    const newHsv = { ...hsv, [field]: num };
    setHsv(newHsv);
    const rgb = hsvToRgb(newHsv.h, newHsv.s, newHsv.l);
    setColor(prev => ({ ...rgb, a: prev.a }));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showToast(`Copied ${text}`);
  };

  const rgbaString = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
  const baseHex = rgbToHex(color.r, color.g, color.b, 1);

  return (
    <div className="tool-section two-col">
      {/* Visual Preview & Base Input */}
      <div className="glass-panel tool-card">
        <h2>Visual & History</h2>
        
        <div className="color-preview-box checkered-bg">
          <div className="color-preview-inner" style={{ backgroundColor: rgbaString }}></div>
          <div 
            className="color-hex-display"
            onClick={() => copyToClipboard(hex.toUpperCase())}
            title="Click to copy HEX"
          >
            {hex.toUpperCase()}
          </div>
        </div>

        <div className="color-input-group">
          <label>Visual Picker (Native)</label>
          <div className="color-input-wrapper">
            <span className="color-input-prefix">#</span>
            <input 
              type="color" 
              value={baseHex}
              onChange={(e) => {
                const rgb = hexToRgb(e.target.value);
                if (rgb) setColor({ ...rgb, a: color.a });
              }}
            />
            <input 
              type="text" 
              value={hex}
              onChange={handleHexChange}
              spellCheck="false"
            />
            <button 
              className="copy-btn"
              onClick={() => toggleFavorite(baseHex)}
              title="Toggle Favorite"
            >
              <Heart size={18} fill={isFavorite(baseHex) ? "currentColor" : "none"} color={isFavorite(baseHex) ? "#ef4444" : "currentColor"} />
            </button>
            <button className="copy-btn" onClick={() => copyToClipboard(hex)}>
              <Copy size={18} />
            </button>
          </div>
        </div>

        {/* History and Favorites Swatches */}
        <div style={{ marginTop: '1rem' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Heart size={16} color="#ef4444" /> Favorites
          </h3>
          <div className="color-swatch-list">
            {favorites.length > 0 ? favorites.map((fav, i) => (
              <div 
                key={i} 
                className="color-swatch" 
                style={{ backgroundColor: fav }}
                onClick={() => {
                  const rgb = hexToRgb(fav);
                  if (rgb) setColor({ ...rgb, a: 1 });
                }}
                title={fav}
              />
            )) : <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No favorites yet.</span>}
          </div>
        </div>
        
        <div style={{ marginTop: '1rem' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={16} /> Recent History
          </h3>
          <div className="color-swatch-list">
            {history.length > 0 ? history.map((hist, i) => (
              <div 
                key={i} 
                className="color-swatch" 
                style={{ backgroundColor: hist }}
                onClick={() => {
                  const rgb = hexToRgb(hist);
                  if (rgb) setColor({ ...rgb, a: 1 });
                }}
                title={hist}
              />
            )) : <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No history yet.</span>}
          </div>
        </div>
      </div>

      {/* Manual Inputs */}
      <div className="glass-panel tool-card">
        <h2>Manual Inputs</h2>
        
        <div className="color-input-group">
          <label>RGB(A)</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <div className="color-input-wrapper">
              <span className="color-input-prefix">R</span>
              <input type="number" min="0" max="255" value={color.r} onChange={(e) => handleRgbChange('r', e.target.value)} />
            </div>
            <div className="color-input-wrapper">
              <span className="color-input-prefix">G</span>
              <input type="number" min="0" max="255" value={color.g} onChange={(e) => handleRgbChange('g', e.target.value)} />
            </div>
            <div className="color-input-wrapper">
              <span className="color-input-prefix">B</span>
              <input type="number" min="0" max="255" value={color.b} onChange={(e) => handleRgbChange('b', e.target.value)} />
            </div>
            <div className="color-input-wrapper">
              <span className="color-input-prefix">A</span>
              <input type="number" min="0" max="1" step="0.1" value={color.a} onChange={(e) => handleAlphaChange(e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
            <button className="btn-primary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }} onClick={() => copyToClipboard(rgbaString)}>
              <Copy size={14} /> Copy RGBA
            </button>
          </div>
        </div>

        <div className="color-input-group">
          <label>HSL</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <div className="color-input-wrapper">
              <span className="color-input-prefix">H</span>
              <input type="number" min="0" max="360" value={hsl.h} onChange={(e) => handleHslChange('h', e.target.value)} />
            </div>
            <div className="color-input-wrapper">
              <span className="color-input-prefix">S%</span>
              <input type="number" min="0" max="100" value={hsl.s} onChange={(e) => handleHslChange('s', e.target.value)} />
            </div>
            <div className="color-input-wrapper">
              <span className="color-input-prefix">L%</span>
              <input type="number" min="0" max="100" value={hsl.l} onChange={(e) => handleHslChange('l', e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
            <button className="btn-primary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }} onClick={() => copyToClipboard(`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`)}>
              <Copy size={14} /> Copy HSL
            </button>
          </div>
        </div>
        
        <div className="color-input-group">
          <label>HSV</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <div className="color-input-wrapper">
              <span className="color-input-prefix">H</span>
              <input type="number" min="0" max="360" value={hsv.h} onChange={(e) => handleHsvChange('h', e.target.value)} />
            </div>
            <div className="color-input-wrapper">
              <span className="color-input-prefix">S%</span>
              <input type="number" min="0" max="100" value={hsv.s} onChange={(e) => handleHsvChange('s', e.target.value)} />
            </div>
            <div className="color-input-wrapper">
              <span className="color-input-prefix">V%</span>
              <input type="number" min="0" max="100" value={hsv.v} onChange={(e) => handleHsvChange('v', e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
            <button className="btn-primary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }} onClick={() => copyToClipboard(`hsv(${hsv.h}, ${hsv.s}%, ${hsv.v}%)`)}>
              <Copy size={14} /> Copy HSV
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ColorPicker;
