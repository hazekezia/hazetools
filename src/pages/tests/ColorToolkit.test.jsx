import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ColorToolkit from '../jsx/ColorToolkit';

// Mock clipboard to avoid errors in tests when copy buttons are clicked (or rendered)
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
});

describe('ColorToolkit Page', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    window.localStorage.clear();
  });

  it('renders title and subtitle', () => {
    render(
      <MemoryRouter>
        <ColorToolkit />
      </MemoryRouter>
    );

    expect(screen.getByText('Color Toolkit')).toBeInTheDocument();
    expect(screen.getByText('A comprehensive suite of color tools for designers and developers.')).toBeInTheDocument();
  });

  it('renders all tabs and defaults to Color Picker', () => {
    render(
      <MemoryRouter>
        <ColorToolkit />
      </MemoryRouter>
    );

    // Check tabs
    expect(screen.getByText(/Color Picker/i)).toBeInTheDocument();
    expect(screen.getByText(/Image Picker/i)).toBeInTheDocument();
    expect(screen.getByText(/Palette Generator/i)).toBeInTheDocument();
    expect(screen.getByText(/Converter/i)).toBeInTheDocument();
    expect(screen.getByText(/Gradient/i)).toBeInTheDocument();
    expect(screen.getByText(/Contrast/i)).toBeInTheDocument();

    // Default view check (Color Picker renders Visual & History)
    expect(screen.getByText('Visual & History')).toBeInTheDocument();
    expect(screen.getByText('Manual Inputs')).toBeInTheDocument();
  });

  it('switches to Converter tab when clicked', () => {
    render(
      <MemoryRouter>
        <ColorToolkit />
      </MemoryRouter>
    );

    const converterTab = screen.getByText(/Converter/i);
    fireEvent.click(converterTab);

    // Converter view check
    expect(screen.getByText('Format Converter')).toBeInTheDocument();
    expect(screen.getByText(/Edit any field below/i)).toBeInTheDocument();
  });

  it('switches to Gradient tab when clicked', () => {
    render(
      <MemoryRouter>
        <ColorToolkit />
      </MemoryRouter>
    );

    const gradientTab = screen.getByText(/Gradient/i);
    fireEvent.click(gradientTab);

    // Gradient view check
    expect(screen.getByText('Gradient Settings')).toBeInTheDocument();
  });

  it('switches to Contrast tab when clicked', () => {
    render(
      <MemoryRouter>
        <ColorToolkit />
      </MemoryRouter>
    );

    const contrastTab = screen.getByText(/Contrast/i);
    fireEvent.click(contrastTab);

    // Contrast view check
    expect(screen.getByText('WCAG Accessibility')).toBeInTheDocument();
    expect(screen.getByText(/The quick brown fox/i)).toBeInTheDocument();
  });
});
