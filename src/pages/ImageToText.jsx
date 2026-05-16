import { useState, useRef, useEffect } from 'react';
import Tesseract from 'tesseract.js';
import { Upload, Copy, Check, Loader2 } from 'lucide-react';
import './ImageToText.css';

const ImageToText = () => {
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [text, setText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          setImage(file);
          setImagePreview(URL.createObjectURL(file));
          setText('');
          setProgress(0);
          break;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
      setText('');
      setProgress(0);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
      setText('');
      setProgress(0);
    }
  };

  const preprocessImage = async (file) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = 3; // Upscale 3x for clearer small text
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          // Calculate luminance
          let gray = 0.299 * r + 0.587 * g + 0.114 * b;
          
          // Apply simple grayscale without destructive contrast stretch
          data[i] = gray;
          data[i + 1] = gray;
          data[i + 2] = gray;
        }
        
        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const extractText = async () => {
    if (!image) return;
    
    setIsProcessing(true);
    setText('');
    
    try {
      const processedImageURL = await preprocessImage(image);
      const modesToTest = ['3', '4', '6']; // Auto, Single Column (Receipts), Single Block
      let bestResult = null;
      let highestConfidence = -1;
      
      for (let i = 0; i < modesToTest.length; i++) {
        const mode = modesToTest[i];
        const result = await Tesseract.recognize(
          processedImageURL,
          'ind+eng',
          {
            logger: m => {
              if (m.status === 'recognizing text') {
                const baseProgress = (i / modesToTest.length) * 100;
                const currentPassProgress = m.progress * (100 / modesToTest.length);
                setProgress(Math.round(baseProgress + currentPassProgress));
              }
            },
            tessedit_pageseg_mode: mode
          }
        );
        
        if (result.data.confidence > highestConfidence) {
          highestConfidence = result.data.confidence;
          bestResult = result;
        }
      }
      
      setText(bestResult.data.text);
    } catch (error) {
      console.error('OCR Error:', error);
      setText('Error extracting text. Please try another image.');
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = () => {
    if (text) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="tool-page-container">
      <div className="tool-page-header">
        <h1 className="page-title">Image to Text (OCR)</h1>
        <p className="page-subtitle">Extract text from images locally in your browser.</p>
      </div>

      <div className="ocr-content">
        <div className="upload-section glass-panel">
          <div 
            className={`drop-zone ${imagePreview ? 'has-image' : ''}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="image-preview" />
            ) : (
              <div className="drop-zone-content">
                <Upload size={48} className="upload-icon" />
                <h3>Click, drag, or paste (Ctrl+V) image</h3>
                <p>Supports PNG, JPG, JPEG</p>
              </div>
            )}
            <input 
              type="file" 
              data-testid="file-input"
              ref={fileInputRef}
              onChange={handleImageChange} 
              accept="image/*" 
              style={{ display: 'none' }}
            />
          </div>

          <button 
            className="btn-primary extract-btn" 
            onClick={extractText}
            disabled={!image || isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 size={20} className="spinner" />
                Processing... {progress}%
              </>
            ) : (
              'Extract Text'
            )}
          </button>
        </div>

        <div className="result-section glass-panel">
          <div className="result-header">
            <h3>Extracted Text</h3>
            <button 
              className={`copy-btn ${copied ? 'copied' : ''}`}
              onClick={copyToClipboard}
              disabled={!text}
              title="Copy to clipboard"
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
            </button>
          </div>
          <textarea 
            className="text-result input-field"
            value={text}
            readOnly
            placeholder="Extracted text will appear here..."
          />
        </div>
      </div>
    </div>
  );
};

export default ImageToText;
