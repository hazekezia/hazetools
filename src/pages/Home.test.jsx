import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Home from './Home';

describe('Home Page', () => {
  it('renders title and tool cards', () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Welcome to Haze Tools')).toBeInTheDocument();
    expect(screen.getByText('Image to Text (OCR)')).toBeInTheDocument();
    expect(screen.getByText('CSV Viewer')).toBeInTheDocument();
  });
});
