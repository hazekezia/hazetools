import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CsvViewer from './CsvViewer';

// Mock Papa.parse
vi.mock('papaparse', () => ({
  default: {
    parse: vi.fn((file, config) => {
      // Simulate successful parsing
      setTimeout(() => {
        config.complete({
          data: [
            ['Name', 'Age', 'Country'], // Headers
            ['Alice', '25', 'USA'],
            ['Bob', '30', 'UK'],
            ['Charlie', '35', 'Canada']
          ]
        });
      }, 10);
    })
  }
}));

describe('CsvViewer Page', () => {
  it('renders upload zone initially', () => {
    render(<CsvViewer />);
    expect(screen.getByText('CSV Viewer')).toBeInTheDocument();
    expect(screen.getByText('Click or drag your .csv file here')).toBeInTheDocument();
  });

  it('parses CSV and renders headers and rows correctly', async () => {
    render(<CsvViewer />);

    const file = new File(['Name,Age,Country\nAlice,25,USA\nBob,30,UK\nCharlie,35,Canada'], 'test.csv', { type: 'text/csv' });
    const input = screen.getByTestId('csv-file-input');
    
    // Upload the file
    fireEvent.change(input, { target: { files: [file] } });

    // Wait for the complete callback to be triggered and render table
    await waitFor(() => {
      expect(screen.getByText('test.csv')).toBeInTheDocument();
      expect(screen.getByText('3 rows')).toBeInTheDocument();
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Age')).toBeInTheDocument();
      expect(screen.getByText('Country')).toBeInTheDocument();
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText('Charlie')).toBeInTheDocument();
    });
  });
});
