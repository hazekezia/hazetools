import { render, screen, fireEvent } from '@testing-library/react';
import CsvViewer from './CsvViewer';

describe('CsvViewer Page', () => {
  it('renders upload zone initially', () => {
    render(<CsvViewer />);
    expect(screen.getByText('CSV Viewer')).toBeInTheDocument();
    expect(screen.getByText('Click or drag your .csv file here')).toBeInTheDocument();
  });
});
