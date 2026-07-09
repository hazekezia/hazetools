import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { vi, describe, it, expect } from 'vitest';

describe('Sidebar Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
  };

  const renderSidebar = (props = defaultProps) => {
    return render(
      <MemoryRouter>
        <Sidebar {...props} />
      </MemoryRouter>
    );
  };

  it('renders logo, search input, and initial navigation links', () => {
    renderSidebar();

    expect(screen.getByText('hz.tools')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search tools...')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Image to Text')).toBeInTheDocument();
    expect(screen.getByText('CSV Viewer')).toBeInTheDocument();
    expect(screen.getByText('JSON Viewer')).toBeInTheDocument();
    expect(screen.getByText('AI Key Lab')).toBeInTheDocument();
  });

  it('filters navigation items based on search input query', () => {
    renderSidebar();

    const searchInput = screen.getByPlaceholderText('Search tools...');

    // Search for "csv"
    fireEvent.change(searchInput, { target: { value: 'csv' } });

    // "CSV Viewer" should be visible
    expect(screen.getByText('CSV Viewer')).toBeInTheDocument();
    
    // Other items should be filtered out
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    expect(screen.queryByText('Image to Text')).not.toBeInTheDocument();
    expect(screen.queryByText('JSON Viewer')).not.toBeInTheDocument();
    expect(screen.queryByText('AI Key Lab')).not.toBeInTheDocument();
  });

  it('displays a friendly no results message when no items match the query', () => {
    renderSidebar();

    const searchInput = screen.getByPlaceholderText('Search tools...');

    // Search for non-existent tool
    fireEvent.change(searchInput, { target: { value: 'nonexistenttoolxyz' } });

    expect(screen.getByText('No tools found')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    expect(screen.queryByText('CSV Viewer')).not.toBeInTheDocument();
  });

  it('clears search query and restores all items when clear button is clicked', () => {
    renderSidebar();

    const searchInput = screen.getByPlaceholderText('Search tools...');

    // Search for "csv"
    fireEvent.change(searchInput, { target: { value: 'csv' } });
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();

    // Clear search button (X) should be present
    const clearBtn = screen.getByTitle('Clear Search');
    expect(clearBtn).toBeInTheDocument();

    // Click it
    fireEvent.click(clearBtn);

    // Search input should be empty
    expect(searchInput.value).toBe('');

    // All tools should be visible again
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('CSV Viewer')).toBeInTheDocument();
    expect(screen.getByText('JSON Viewer')).toBeInTheDocument();
    expect(screen.queryByTitle('Clear Search')).not.toBeInTheDocument();
  });
});
