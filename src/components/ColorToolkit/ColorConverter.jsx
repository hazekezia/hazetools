/* eslint-disable */
import { useState, useEffect } from 'react';
import { Copy } from 'lucide-react';
import { 
  hexToRgb, rgbToHex, rgbToHsl, hslToRgb, rgbToHsv, hsvToRgb, rgbToCmyk, cmykToRgb 
} from '../../utils/colorUtils';

const ColorConverter = ({ showToast }) => {
  const [color, setColor] = useState({ r: 99, g: 102, b: 241 }); // Base state is RGB
  
  const [hex, setHex] = useState('#6366f1');
  const [rgb, setRgb] = useState('rgb(99, 102, 241)');
  const [hsl, setHsl] = useState('hsl(239, 83%, 67%)');
  const [hsv, setHsv] = useState('hsv(239, 59%, 95%)');
  const [cmyk, setCmyk] = useState('cmyk(59%, 58%, 0%, 5%)');

  // Sync strings when base color changes
  useEffect(() => {
    const newHex = rgbToHex(color.r, color.g, color.b, 1);
    const newHsl = rgbToHsl(color.r, color.g, color.b);
    const newHsv = rgbToHsv(color.r, color.g, color.b);
    const newCmyk = rgbToCmyk(color.r, color.g, color.b);
    
    setHex(newHex);
    setRgb(`rgb(${color.r}, ${color.g}, ${color.b})`);
    setHsl(`hsl(${newHsl.h}, ${newHsl.s}%, ${newHsl.l}%)`);
    setHsv(`hsv(${newHsv.h}, ${newHsv.s}%, ${newHsv.v}%)`);
    setCmyk(`cmyk(${newCmyk.c}%, ${newCmyk.m}%, ${newCmyk.y}%, ${newCmyk.k}%)`);
  }, [color]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showToast(`Copied ${text}`);
  };

  const handleHexInput = (e) => {
    const val = e.target.value;
    setHex(val);
    const parsedRgb = hexToRgb(val);
    if (parsedRgb) setColor({ r: parsedRgb.r, g: parsedRgb.g, b: parsedRgb.b });
  };

  const handleRgbInput = (e) => {
    const val = e.target.value;
    setRgb(val);
    const parts = val.match(/\d+/g);
    if (parts && parts.length >= 3) {
      setColor({
        r: Math.min(255, parseInt(parts[0])),
        g: Math.min(255, parseInt(parts[1])),
        b: Math.min(255, parseInt(parts[2]))
      });
    }
  };

  const handleHslInput = (e) => {
    const val = e.target.value;
    setHsl(val);
    const parts = val.match(/\d+/g);
    if (parts && parts.length >= 3) {
      const rgbObj = hslToRgb(parseInt(parts[0]), parseInt(parts[1]), parseInt(parts[2]));
      setColor(rgbObj);
    }
  };

  const handleHsvInput = (e) => {
    const val = e.target.value;
    setHsv(val);
    const parts = val.match(/\d+/g);
    if (parts && parts.length >= 3) {
      const rgbObj = hsvToRgb(parseInt(parts[0]), parseInt(parts[1]), parseInt(parts[2]));
      setColor(rgbObj);
    }
  };
  
  const handleCmykInput = (e) => {
    const val = e.target.value;
    setCmyk(val);
    const parts = val.match(/\d+/g);
    if (parts && parts.length >= 4) {
      const rgbObj = cmykToRgb(parseInt(parts[0]), parseInt(parts[1]), parseInt(parts[2]), parseInt(parts[3]));
      setColor(rgbObj);
    }
  };

  return (
    <div className="tool-section">
      <div className="glass-panel tool-card" style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        <h2>Format Converter</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
          Edit any field below and the others will automatically update.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ 
            width: '60px', height: '60px', borderRadius: '12px', 
            backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})`,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            border: '1px solid var(--border-color)'
          }} />
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{hex.toUpperCase()}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div className="color-input-group">
            <label>HEX</label>
            <div className="color-input-wrapper">
              <input type="text" value={hex} onChange={handleHexInput} spellCheck="false" />
              <button className="copy-btn" onClick={() => copyToClipboard(hex)}>
                <Copy size={18} />
              </button>
            </div>
          </div>
          
          <div className="color-input-group">
            <label>RGB</label>
            <div className="color-input-wrapper">
              <input type="text" value={rgb} onChange={handleRgbInput} spellCheck="false" />
              <button className="copy-btn" onClick={() => copyToClipboard(rgb)}>
                <Copy size={18} />
              </button>
            </div>
          </div>
          
          <div className="color-input-group">
            <label>HSL</label>
            <div className="color-input-wrapper">
              <input type="text" value={hsl} onChange={handleHslInput} spellCheck="false" />
              <button className="copy-btn" onClick={() => copyToClipboard(hsl)}>
                <Copy size={18} />
              </button>
            </div>
          </div>

          <div className="color-input-group">
            <label>HSV</label>
            <div className="color-input-wrapper">
              <input type="text" value={hsv} onChange={handleHsvInput} spellCheck="false" />
              <button className="copy-btn" onClick={() => copyToClipboard(hsv)}>
                <Copy size={18} />
              </button>
            </div>
          </div>

          <div className="color-input-group">
            <label>CMYK</label>
            <div className="color-input-wrapper">
              <input type="text" value={cmyk} onChange={handleCmykInput} spellCheck="false" />
              <button className="copy-btn" onClick={() => copyToClipboard(cmyk)}>
                <Copy size={18} />
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ColorConverter;
