/* eslint-disable */
import { useState, useEffect } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { hexToRgb, rgbToHex, getContrastRatio } from '../../utils/colorUtils';

const ContrastChecker = () => {
  const [bgHex, setBgHex] = useState('#ffffff');
  const [fgHex, setFgHex] = useState('#000000');
  
  const [ratio, setRatio] = useState(21); // Max contrast white vs black

  useEffect(() => {
    const bg = hexToRgb(bgHex);
    const fg = hexToRgb(fgHex);
    if (bg && fg) {
      const cr = getContrastRatio(bg, fg);
      setRatio(cr);
    }
  }, [bgHex, fgHex]);

  const swapColors = () => {
    const temp = bgHex;
    setBgHex(fgHex);
    setFgHex(temp);
  };

  const handleHexInput = (setter) => (e) => {
    setter(e.target.value);
  };

  const formatRatio = (r) => {
    return Math.round(r * 100) / 100;
  };

  const checkAA_Normal = ratio >= 4.5;
  const checkAA_Large = ratio >= 3.0;
  const checkAAA_Normal = ratio >= 7.0;
  const checkAAA_Large = ratio >= 4.5;

  return (
    <div className="tool-section two-col">
      <div className="glass-panel tool-card">
        <h2>Colors</h2>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
          <div className="color-input-group" style={{ flex: 1 }}>
            <label>Background</label>
            <div className="color-input-wrapper">
              <input 
                type="color" 
                value={hexToRgb(bgHex) ? rgbToHex(hexToRgb(bgHex).r, hexToRgb(bgHex).g, hexToRgb(bgHex).b, 1) : '#ffffff'} 
                onChange={handleHexInput(setBgHex)} 
              />
              <input type="text" value={bgHex} onChange={handleHexInput(setBgHex)} spellCheck="false" />
            </div>
          </div>

          <button 
            className="btn-primary" 
            style={{ padding: '0.75rem', height: '42px', flex: 'none' }}
            onClick={swapColors}
            title="Swap Colors"
          >
            <ArrowLeftRight size={18} />
          </button>

          <div className="color-input-group" style={{ flex: 1 }}>
            <label>Text Color</label>
            <div className="color-input-wrapper">
              <input 
                type="color" 
                value={hexToRgb(fgHex) ? rgbToHex(hexToRgb(fgHex).r, hexToRgb(fgHex).g, hexToRgb(fgHex).b, 1) : '#000000'} 
                onChange={handleHexInput(setFgHex)} 
              />
              <input type="text" value={fgHex} onChange={handleHexInput(setFgHex)} spellCheck="false" />
            </div>
          </div>
        </div>

        <div 
          className="contrast-preview checkered-bg" 
          style={{ marginTop: '2rem', padding: '0' }}
        >
          <div style={{
            background: bgHex,
            color: fgHex,
            padding: '3rem 2rem',
            borderRadius: '11px',
            width: '100%',
            height: '100%'
          }}>
            <h1 style={{ color: fgHex }}>The quick brown fox</h1>
            <p style={{ color: fgHex, opacity: 0.8 }}>jumps over the lazy dog. This is normal text to preview contrast readability.</p>
          </div>
        </div>

      </div>

      <div className="glass-panel tool-card">
        <h2>WCAG Accessibility</h2>
        
        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
          <div style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Contrast Ratio</div>
          <div style={{ fontSize: '4rem', fontWeight: 'bold', color: 'var(--text-primary)', lineHeight: 1.2 }}>
            {formatRatio(ratio)}<span style={{ fontSize: '2rem', color: 'var(--text-secondary)' }}>:1</span>
          </div>
          <p style={{ 
            color: ratio >= 4.5 ? '#10b981' : '#ef4444', 
            fontWeight: 500,
            marginTop: '0.5rem'
          }}>
            {ratio >= 4.5 ? 'Good contrast' : 'Poor contrast'}
          </p>
        </div>

        <div className="wcag-badges">
          <div className={`wcag-badge ${checkAA_Normal ? 'pass' : 'fail'}`}>
            <span>AA Normal Text</span>
            <strong>{checkAA_Normal ? 'Pass' : 'Fail'}</strong>
          </div>
          <div className={`wcag-badge ${checkAA_Large ? 'pass' : 'fail'}`}>
            <span>AA Large Text</span>
            <strong>{checkAA_Large ? 'Pass' : 'Fail'}</strong>
          </div>
          <div className={`wcag-badge ${checkAAA_Normal ? 'pass' : 'fail'}`}>
            <span>AAA Normal Text</span>
            <strong>{checkAAA_Normal ? 'Pass' : 'Fail'}</strong>
          </div>
          <div className={`wcag-badge ${checkAAA_Large ? 'pass' : 'fail'}`}>
            <span>AAA Large Text</span>
            <strong>{checkAAA_Large ? 'Pass' : 'Fail'}</strong>
          </div>
        </div>
        
        <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
          Normal Text: &lt; 18pt or 14pt bold.<br />
          Large Text: &ge; 18pt or 14pt bold.
        </div>
      </div>
    </div>
  );
};

export default ContrastChecker;
