import { useState, useEffect } from 'react';
import { Palette, Image as ImageIcon, Sparkles, SlidersHorizontal, Paintbrush, Contrast } from 'lucide-react';

import '../../components/ColorToolkit/ColorToolkit.css';
import { useColorHistory } from '../../hooks/useColorHistory';

import ColorPicker from '../../components/ColorToolkit/ColorPicker';
import ColorConverter from '../../components/ColorToolkit/ColorConverter';
import GradientGenerator from '../../components/ColorToolkit/GradientGenerator';
import ContrastChecker from '../../components/ColorToolkit/ContrastChecker';
import ImageColorPicker from '../../components/ColorToolkit/ImageColorPicker';
import PaletteGenerator from '../../components/ColorToolkit/PaletteGenerator';

const ColorToolkit = () => {
  const [activeTab, setActiveTab] = useState('picker');
  const [toastMsg, setToastMsg] = useState('');
  const historyProps = useColorHistory();

  useEffect(() => {
    if (toastMsg) {
      const timer = setTimeout(() => setToastMsg(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMsg]);

  const showToast = (msg) => setToastMsg(msg);

  const tabs = [
    { id: 'picker', label: 'Color Picker', icon: <Paintbrush size={16} /> },
    { id: 'image', label: 'Image Picker', icon: <ImageIcon size={16} /> },
    { id: 'palette', label: 'Palette Generator', icon: <Sparkles size={16} /> },
    { id: 'converter', label: 'Converter', icon: <SlidersHorizontal size={16} /> },
    { id: 'gradient', label: 'Gradient', icon: <Palette size={16} /> },
    { id: 'contrast', label: 'Contrast', icon: <Contrast size={16} /> },
  ];

  return (
    <div className="color-toolkit-container">
      <div className="toolkit-header">
        <h1 className="page-title">Color Toolkit</h1>
        <p className="page-subtitle">A comprehensive suite of color tools for designers and developers.</p>
        
        <div className="toolkit-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="toolkit-content">
        {activeTab === 'picker' && <ColorPicker historyProps={historyProps} showToast={showToast} />}
        {activeTab === 'image' && <ImageColorPicker historyProps={historyProps} showToast={showToast} />}
        {activeTab === 'palette' && <PaletteGenerator historyProps={historyProps} showToast={showToast} />}
        {activeTab === 'converter' && <ColorConverter showToast={showToast} />}
        {activeTab === 'gradient' && <GradientGenerator showToast={showToast} />}
        {activeTab === 'contrast' && <ContrastChecker />}
      </div>

      <div className={`toast ${toastMsg ? 'show' : ''}`}>
        {toastMsg}
      </div>
    </div>
  );
};

export default ColorToolkit;
