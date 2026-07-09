/* eslint-disable */
import { useState, useEffect } from 'react';
import { Copy, Plus, Trash2, ArrowRightCircle, Circle, LoaderPinwheel } from 'lucide-react';

const GradientGenerator = ({ showToast }) => {
  const [type, setType] = useState('linear');
  const [angle, setAngle] = useState(90);
  const [stops, setStops] = useState([
    { id: 1, color: '#4f46e5', position: 0 },
    { id: 2, color: '#ec4899', position: 100 }
  ]);
  const [cssString, setCssString] = useState('');

  useEffect(() => {
    // Sort stops by position
    const sortedStops = [...stops].sort((a, b) => a.position - b.position);
    const stopStrings = sortedStops.map(s => `${s.color} ${s.position}%`).join(', ');
    
    let str = '';
    if (type === 'linear') {
      str = `linear-gradient(${angle}deg, ${stopStrings})`;
    } else if (type === 'radial') {
      str = `radial-gradient(circle, ${stopStrings})`;
    } else if (type === 'conic') {
      str = `conic-gradient(from ${angle}deg, ${stopStrings})`;
    }
    setCssString(`background: ${str}`);
  }, [type, angle, stops]);

  const addStop = () => {
    if (stops.length >= 5) {
      showToast("Maximum 5 color stops allowed");
      return;
    }
    const newId = Math.max(...stops.map(s => s.id), 0) + 1;
    setStops([...stops, { id: newId, color: '#ffffff', position: 50 }]);
  };

  const removeStop = (id) => {
    if (stops.length <= 2) {
      showToast("Minimum 2 color stops required");
      return;
    }
    setStops(stops.filter(s => s.id !== id));
  };

  const updateStop = (id, field, value) => {
    setStops(stops.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const copyCss = () => {
    navigator.clipboard.writeText(cssString);
    showToast("Copied CSS to clipboard!");
  };

  return (
    <div className="tool-section two-col">
      <div className="glass-panel tool-card">
        <h2>Gradient Settings</h2>
        
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <button 
            className={`tab-btn ${type === 'linear' ? 'active' : ''}`}
            onClick={() => setType('linear')}
            style={{ borderRadius: '8px' }}
          >
            <ArrowRightCircle size={16} /> Linear
          </button>
          <button 
            className={`tab-btn ${type === 'radial' ? 'active' : ''}`}
            onClick={() => setType('radial')}
            style={{ borderRadius: '8px' }}
          >
            <Circle size={16} /> Radial
          </button>
          <button 
            className={`tab-btn ${type === 'conic' ? 'active' : ''}`}
            onClick={() => setType('conic')}
            style={{ borderRadius: '8px' }}
          >
            <LoaderPinwheel size={16} /> Conic
          </button>
        </div>

        {(type === 'linear' || type === 'conic') && (
          <div className="color-input-group" style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Angle</span>
              <span>{angle}°</span>
            </label>
            <input 
              type="range" 
              className="range-slider"
              min="0" max="360" 
              value={angle} 
              onChange={(e) => setAngle(parseInt(e.target.value))}
            />
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Color Stops</label>
          <button className="copy-btn" onClick={addStop} style={{ padding: '0.25rem 0.5rem' }}>
            <Plus size={16} /> Add Stop
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {stops.map((stop, index) => (
            <div key={stop.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <div className="color-input-wrapper" style={{ flex: 1 }}>
                <input 
                  type="color" 
                  value={stop.color} 
                  onChange={(e) => updateStop(stop.id, 'color', e.target.value)} 
                />
                <input 
                  type="text" 
                  value={stop.color.toUpperCase()} 
                  onChange={(e) => updateStop(stop.id, 'color', e.target.value)}
                  style={{ width: '80px', flex: 'none' }}
                />
                <span style={{ padding: '0 0.5rem', color: 'var(--border-color)' }}>|</span>
                <input 
                  type="number" 
                  min="0" max="100" 
                  value={stop.position} 
                  onChange={(e) => updateStop(stop.id, 'position', parseInt(e.target.value) || 0)}
                  style={{ paddingLeft: '0.5rem' }}
                />
                <span style={{ paddingRight: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>%</span>
              </div>
              <button 
                className="copy-btn" 
                onClick={() => removeStop(stop.id)}
                style={{ color: stops.length <= 2 ? 'rgba(255,255,255,0.1)' : '#ef4444' }}
                disabled={stops.length <= 2}
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>

      </div>

      <div className="glass-panel tool-card">
        <h2>Preview</h2>
        
        <div className="color-preview-box checkered-bg" style={{ height: '240px' }}>
          <div 
            className="color-preview-inner" 
            style={{ cssText: cssString }}
            // React style object doesn't accept raw background strings easily with conic/radial sometimes, 
            // so we can use a trick with ref or just apply it properly
            ref={node => { if(node) node.style.cssText = cssString; }}
          ></div>
        </div>

        <div className="color-input-group" style={{ marginTop: '1rem' }}>
          <label>CSS Code</label>
          <div className="color-input-wrapper" style={{ alignItems: 'flex-start' }}>
            <textarea 
              value={cssString} 
              readOnly 
              style={{ 
                flex: 1, background: 'transparent', border: 'none', 
                color: 'var(--text-primary)', padding: '1rem', 
                fontFamily: 'monospace', minHeight: '80px', resize: 'none', outline: 'none'
              }}
            />
            <button className="copy-btn" onClick={copyCss} style={{ marginTop: '0.5rem', marginRight: '0.5rem' }}>
              <Copy size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GradientGenerator;
