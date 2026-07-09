import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import AiKeyTester from '../jsx/AiKeyTester';

describe('AiKeyTester Page', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('renders the tester form with initial configurations', () => {
    render(<AiKeyTester />);
    
    expect(screen.getByText('AI Key Lab')).toBeInTheDocument();
    expect(screen.getByLabelText('AI Provider')).toBeInTheDocument();
    expect(screen.getByLabelText('API Key')).toBeInTheDocument();
    expect(screen.getByLabelText(/Model Name/i)).toBeInTheDocument();
    expect(screen.getByText('Use CORS Proxy (Bypass browser CORS restrictions)')).toBeInTheDocument();
    expect(screen.getByText('Test API Key')).toBeInTheDocument();
    expect(screen.getByText('Waiting for Test')).toBeInTheDocument();
  });

  it('changes default model when provider is switched', () => {
    render(<AiKeyTester />);
    
    const providerSelect = screen.getByLabelText('AI Provider');
    const modelInput = screen.getByLabelText(/Model Name/i);

    // Default should be OpenAI's gpt-5.5
    expect(modelInput.value).toBe('gpt-5.5');

    // Switch to Anthropic
    fireEvent.change(providerSelect, { target: { value: 'anthropic' } });
    expect(modelInput.value).toBe('claude-opus-4-8');

    // Switch to Gemini
    fireEvent.change(providerSelect, { target: { value: 'gemini' } });
    expect(modelInput.value).toBe('gemini-3.5-flash');
  });

  it('clears API key when provider is switched', () => {
    render(<AiKeyTester />);
    
    const providerSelect = screen.getByLabelText('AI Provider');
    const keyInput = screen.getByPlaceholderText('Enter OpenAI API Key');
    
    // Set a key
    fireEvent.change(keyInput, { target: { value: 'sk-testkey123' } });
    expect(keyInput.value).toBe('sk-testkey123');
    
    // Switch to Anthropic
    fireEvent.change(providerSelect, { target: { value: 'anthropic' } });
    
    // Key should be cleared
    const anthropicKeyInput = screen.getByPlaceholderText('Enter Anthropic API Key');
    expect(anthropicKeyInput.value).toBe('');
  });

  it('clears API key when clear button (X) is clicked', () => {
    render(<AiKeyTester />);
    
    const keyInput = screen.getByPlaceholderText('Enter OpenAI API Key');
    
    // Set a key
    fireEvent.change(keyInput, { target: { value: 'sk-testkey123' } });
    expect(keyInput.value).toBe('sk-testkey123');
    
    // The clear button should now be visible
    const clearButton = screen.getByTitle('Clear Key');
    expect(clearButton).toBeInTheDocument();
    
    // Click clear
    fireEvent.click(clearButton);
    
    // Key should be cleared
    expect(keyInput.value).toBe('');
    
    // Clear button should be hidden
    expect(screen.queryByTitle('Clear Key')).not.toBeInTheDocument();
  });

  it('shows error if API Key is empty for OpenAI', async () => {
    render(<AiKeyTester />);
    
    const testButton = screen.getByText('Test API Key');
    fireEvent.click(testButton);

    await waitFor(() => {
      expect(screen.getByText('API Key cannot be empty for this provider.')).toBeInTheDocument();
      expect(screen.getByText('API Key INVALID / ERROR')).toBeInTheDocument();
    });
  });

  it('shows success when API Key test succeeds', async () => {
    // Mock successful OpenAI response
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [
          {
            message: {
              content: 'Success Response!'
            }
          }
        ]
      })
    });

    render(<AiKeyTester />);

    const keyInput = screen.getByPlaceholderText('Enter OpenAI API Key');
    const testButton = screen.getByText('Test API Key');

    fireEvent.change(keyInput, { target: { value: 'sk-testkey123' } });
    fireEvent.click(testButton);

    // Should show "Testing..." during testing state
    expect(screen.getByText('Testing...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('API Key VALID')).toBeInTheDocument();
      expect(screen.getByText('"Success Response!"')).toBeInTheDocument();
      expect(screen.getByText('200')).toBeInTheDocument();
    });
  });

  it('shows unauthorized error when API Key is invalid (401)', async () => {
    // Mock 401 error response
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({
        error: {
          message: 'Invalid API Key'
        }
      })
    });

    render(<AiKeyTester />);

    const keyInput = screen.getByPlaceholderText('Enter OpenAI API Key');
    const testButton = screen.getByText('Test API Key');

    fireEvent.change(keyInput, { target: { value: 'sk-wrongkey' } });
    fireEvent.click(testButton);

    await waitFor(() => {
      expect(screen.getByText('API Key INVALID / ERROR')).toBeInTheDocument();
      expect(screen.getByText(/401 Unauthorized/)).toBeInTheDocument();
    });
  });

  it('shows CORS / Network Error when fetch fails with TypeError', async () => {
    // Mock network fetch failure (TypeError: Failed to fetch is standard browser CORS error)
    global.fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    render(<AiKeyTester />);

    const keyInput = screen.getByPlaceholderText('Enter OpenAI API Key');
    const testButton = screen.getByText('Test API Key');

    fireEvent.change(keyInput, { target: { value: 'sk-anykey' } });
    fireEvent.click(testButton);

    await waitFor(() => {
      expect(screen.getByText('API Key INVALID / ERROR')).toBeInTheDocument();
      expect(screen.getByText(/Network Error \/ CORS Blocked/)).toBeInTheDocument();
    });
  });

  it('toggles advanced settings and displays editable inputs', () => {
    render(<AiKeyTester />);
    
    // Endpoint URL should be visible initially (outside advanced)
    expect(screen.getByLabelText('Endpoint URL')).toBeInTheDocument();

    // Toggle advanced settings
    const advancedToggle = screen.getByText(/Advanced \/ Custom Payload/);
    fireEvent.click(advancedToggle);

    expect(screen.getByLabelText('Test Prompt')).toBeInTheDocument();
    expect(screen.getByText('Request Headers (JSON)')).toBeInTheDocument();
    expect(screen.getByText('Request Body (JSON)')).toBeInTheDocument();
  });

  it('shows proxy input field when proxy checkbox is checked', () => {
    render(<AiKeyTester />);
    
    const proxyCheckbox = screen.getByLabelText('Use CORS Proxy (Bypass browser CORS restrictions)');
    expect(screen.queryByPlaceholderText('Example: https://cors-anywhere.herokuapp.com/')).not.toBeInTheDocument();

    // Check it
    fireEvent.click(proxyCheckbox);
    expect(screen.getByPlaceholderText('Example: https://cors-anywhere.herokuapp.com/')).toBeInTheDocument();
  });
});
