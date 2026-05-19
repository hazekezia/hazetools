import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ImageToText from './ImageToText';

// Mock Tesseract
vi.mock('tesseract.js', () => ({
  default: {
    recognize: vi.fn().mockImplementation(async (image, lang, options) => {
      if (options && options.tessedit_pageseg_mode === '4') {
        return { data: { text: 'Correct Text (High Confidence)', confidence: 95 } };
      }
      return { data: { text: 'Garbage Text (Low Confidence)', confidence: 40 } };
    })
  }
}));

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'mocked-url');

// Mock Image and Canvas for preprocessImage
global.Image = class {
  constructor() {
    setTimeout(() => {
      this.width = 100;
      this.height = 100;
      this.onload && this.onload();
    }, 10);
  }
};

HTMLCanvasElement.prototype.getContext = () => ({
  drawImage: vi.fn(),
  getImageData: () => ({ data: new Uint8ClampedArray(40000) }),
  putImageData: vi.fn()
});
HTMLCanvasElement.prototype.toDataURL = () => 'mocked-data-url';

describe('ImageToText Page', () => {
  it('renders upload zone initially', () => {
    render(<ImageToText />);
    expect(screen.getByText('Image to Text (OCR)')).toBeInTheDocument();
    expect(screen.getByText('Click, drag, or paste (Ctrl+V) image')).toBeInTheDocument();
  });

  it('selects the result with the highest confidence', async () => {
    render(<ImageToText />);

    // Upload image
    const file = new File(['dummy content'], 'test.png', { type: 'image/png' });
    const input = screen.getByTestId('file-input');
    fireEvent.change(input, { target: { files: [file] } });

    // Extract text
    const extractBtn = screen.getByText('Extract Text');
    fireEvent.click(extractBtn);

    // Wait for OCR to complete and verify correct text is displayed
    await waitFor(() => {
      expect(screen.getByDisplayValue('Correct Text (High Confidence)')).toBeInTheDocument();
    });
  });

  it('saves previous result to history when new image is uploaded', async () => {
    render(<ImageToText />);

    // Upload first image and extract text
    const file1 = new File(['dummy'], 'first.png', { type: 'image/png' });
    const input = screen.getByTestId('file-input');
    fireEvent.change(input, { target: { files: [file1] } });
    fireEvent.click(screen.getByText('Extract Text'));

    await waitFor(() => {
      expect(screen.getByDisplayValue('Correct Text (High Confidence)')).toBeInTheDocument();
    });

    // Upload second image — should save first result to history
    const file2 = new File(['dummy'], 'second.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [file2] } });

    // History section should appear with the previous result
    await waitFor(() => {
      expect(screen.getByText(/History/)).toBeInTheDocument();
      expect(screen.getByText('Correct Text (High Confidence)')).toBeInTheDocument();
      expect(screen.getByText('first.png')).toBeInTheDocument();
    });
  });
});
