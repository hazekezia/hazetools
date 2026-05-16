import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import JsonViewer from './JsonViewer';

describe('JsonViewer Page', () => {
  it('renders input section initially', () => {
    render(<JsonViewer />);
    expect(screen.getByText('JSON Viewer')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Paste your JSON here/)).toBeInTheDocument();
    expect(screen.getByText('Parse')).toBeInTheDocument();
  });

  it('parses valid JSON and shows tree view', async () => {
    render(<JsonViewer />);

    const textarea = screen.getByPlaceholderText(/Paste your JSON here/);
    fireEvent.change(textarea, { target: { value: '{"name":"John","age":30}' } });
    fireEvent.click(screen.getByText('Parse'));

    await waitFor(() => {
      expect(screen.getByText('Valid JSON')).toBeInTheDocument();
    });
  });

  it('shows error for invalid JSON', async () => {
    render(<JsonViewer />);

    const textarea = screen.getByPlaceholderText(/Paste your JSON here/);
    fireEvent.change(textarea, { target: { value: '{invalid}' } });
    fireEvent.click(screen.getByText('Parse'));

    await waitFor(() => {
      expect(screen.getByText(/Invalid JSON/)).toBeInTheDocument();
    });
  });

  it('beautify formats the JSON input', () => {
    render(<JsonViewer />);

    const textarea = screen.getByPlaceholderText(/Paste your JSON here/);
    fireEvent.change(textarea, { target: { value: '{"a":1}' } });
    fireEvent.click(screen.getByText('Beautify'));

    expect(textarea.value).toBe('{\n  "a": 1\n}');
  });

  it('minify compresses the JSON input', () => {
    render(<JsonViewer />);

    const textarea = screen.getByPlaceholderText(/Paste your JSON here/);
    fireEvent.change(textarea, { target: { value: '{\n  "a": 1\n}' } });
    fireEvent.click(screen.getByText('Minify'));

    expect(textarea.value).toBe('{"a":1}');
  });

  it('toggles back to input view when edit button is clicked', async () => {
    render(<JsonViewer />);

    const textarea = screen.getByPlaceholderText(/Paste your JSON here/);
    fireEvent.change(textarea, { target: { value: '{"test": true}' } });
    fireEvent.click(screen.getByText('Parse'));

    await waitFor(() => {
      expect(screen.getByText('Valid JSON')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTitle('Edit JSON'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Paste your JSON here/)).toBeInTheDocument();
    });
  });

  it('disables Parse button when input is empty', () => {
    render(<JsonViewer />);
    expect(screen.getByText('Parse')).toBeDisabled();
  });

  it('renders tree node values correctly for different types', async () => {
    render(<JsonViewer />);

    const textarea = screen.getByPlaceholderText(/Paste your JSON here/);
    fireEvent.change(textarea, { target: { value: '{"str":"hello","num":42,"bool":true,"nil":null}' } });
    fireEvent.click(screen.getByText('Parse'));

    await waitFor(() => {
      expect(screen.getByText('"hello"')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
      expect(screen.getByText('true')).toBeInTheDocument();
      expect(screen.getByText('null')).toBeInTheDocument();
    });
  });

  it('renders arrays with correct bracket notation', async () => {
    render(<JsonViewer />);

    const textarea = screen.getByPlaceholderText(/Paste your JSON here/);
    fireEvent.change(textarea, { target: { value: '{"items":[1,2,3]}' } });
    fireEvent.click(screen.getByText('Parse'));

    await waitFor(() => {
      expect(screen.getByText('[3]')).toBeInTheDocument();
    });
  });

  it('New File button resets to input view', async () => {
    render(<JsonViewer />);

    const textarea = screen.getByPlaceholderText(/Paste your JSON here/);
    fireEvent.change(textarea, { target: { value: '{"x":1}' } });
    fireEvent.click(screen.getByText('Parse'));

    await waitFor(() => {
      expect(screen.getByText('Valid JSON')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('New File'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Paste your JSON here/)).toBeInTheDocument();
    });
  });
});
