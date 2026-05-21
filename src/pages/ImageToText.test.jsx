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
  beforeEach(() => {
    sessionStorage.clear();
  });

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

  it('saves result to history immediately when text is extracted', async () => {
    render(<ImageToText />);

    // Upload first image and extract text
    const file1 = new File(['dummy'], 'first.png', { type: 'image/png' });
    const input = screen.getByTestId('file-input');
    fireEvent.change(input, { target: { files: [file1] } });
    fireEvent.click(screen.getByText('Extract Text'));

    // History section should appear with the result immediately
    await waitFor(() => {
      expect(screen.getByDisplayValue('Correct Text (High Confidence)')).toBeInTheDocument();
      expect(screen.getByText(/History/)).toBeInTheDocument();
      expect(screen.getByText('first.png')).toBeInTheDocument();
    });
  });

  it('persists history in sessionStorage when component is unmounted and remounted', async () => {
    const { unmount } = render(<ImageToText />);

    const file1 = new File(['dummy'], 'first.png', { type: 'image/png' });
    const input = screen.getByTestId('file-input');
    fireEvent.change(input, { target: { files: [file1] } });
    fireEvent.click(screen.getByText('Extract Text'));

    await waitFor(() => {
      expect(screen.getByDisplayValue('Correct Text (High Confidence)')).toBeInTheDocument();
      expect(screen.getByText('first.png')).toBeInTheDocument();
    });

    // Simulate navigating away
    unmount();

    // Simulate navigating back
    render(<ImageToText />);

    // History should still be loaded from sessionStorage
    expect(screen.getByText('first.png')).toBeInTheDocument();
  });
});
