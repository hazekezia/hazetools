import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Home from './Home';

describe('Home Page', () => {
  it('renders title and tool cards', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    expect(screen.getByText('Welcome to hz.tools')).toBeInTheDocument();
    expect(screen.getByText('Image to Text (OCR)')).toBeInTheDocument();
    expect(screen.getByText('CSV Viewer')).toBeInTheDocument();
    expect(screen.getByText('JSON Viewer')).toBeInTheDocument();
  });
});
