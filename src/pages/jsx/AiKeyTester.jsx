import { useState, useEffect } from 'react';
import { 
  Key, 
  Cpu, 
  Send, 
  Globe, 
  Settings, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Copy, 
  Check, 
  Info,
  Clock,
  Terminal,
  Activity,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import '../css/AiKeyTester.css';

const PROVIDERS = {
  openai: {
    name: 'OpenAI',
    defaultModel: 'gpt-5.5',
    defaultUrl: 'https://api.openai.com/v1/chat/completions',
    modelListUrl: 'https://platform.openai.com/docs/models',
    placeholderModel: 'gpt-5.5',
    headers: (key) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    }),
    body: (model, prompt) => ({
      model: model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 10
    })
  },
  anthropic: {
    name: 'Anthropic',
    defaultModel: 'claude-opus-4-8',
    defaultUrl: 'https://api.anthropic.com/v1/messages',
    modelListUrl: 'https://docs.anthropic.com/en/docs/about-claude/models',
    placeholderModel: 'claude-opus-4-8',
    headers: (key) => ({
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01'
    }),
    body: (model, prompt) => ({
      model: model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 10
    })
  },
  gemini: {
    name: 'Google Gemini',
    defaultModel: 'gemini-3.5-flash',
    defaultUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent',
    modelListUrl: 'https://ai.google.dev/gemini-api/docs/models/gemini',
    placeholderModel: 'gemini-3.5-flash',
    headers: () => ({
      'Content-Type': 'application/json'
    }),
    body: (model, prompt) => ({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 10 }
    })
  },
  groq: {
    name: 'Groq',
    defaultModel: 'llama-3.3-70b-versatile',
    defaultUrl: 'https://api.groq.com/openai/v1/chat/completions',
    modelListUrl: 'https://console.groq.com/docs/models',
    headers: (key) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    }),
    body: (model, prompt) => ({
      model: model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 10
    })
  },
  openrouter: {
    name: 'OpenRouter',
    defaultModel: 'nvidia/nemotron-3-ultra-550b-a55b:free',
    defaultUrl: 'https://openrouter.ai/api/v1/chat/completions',
    modelListUrl: 'https://openrouter.ai/models',
    placeholderModel: 'nvidia/nemotron-3-ultra-550b-a55b:free',
    headers: (key) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': 'hz.tools'
    }),
    body: (model, prompt) => ({
      model: model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 10
    })
  },
  deepseek: {
    name: 'DeepSeek',
    defaultModel: 'deepseek-v4-pro',
    defaultUrl: 'https://api.deepseek.com/chat/completions',
    modelListUrl: 'https://api-docs.deepseek.com/quick_start/pricing',
    placeholderModel: 'deepseek-v4-pro',
    headers: (key) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    }),
    body: (model, prompt) => ({
      model: model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 10
    })
  },
  minimax: {
    name: 'MiniMax',
    defaultModel: 'MiniMax-M3',
    defaultUrl: 'https://api.minimax.io/v1/chat/completions',
    modelListUrl: 'https://www.minimaxi.com/document/fast-start/model-introduction',
    headers: (key) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    }),
    body: (model, prompt) => ({
      model: model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 10
    })
  },
  xiaomi_mimo: {
    name: 'Xiaomi MiMo',
    defaultModel: 'mimo-v2.5-pro',
    defaultUrl: 'https://api.xiaomimimo.com/v1/chat/completions',
    modelListUrl: 'https://mimo.mi.com/docs/en-US/quick-start/summary/model',
    headers: (key) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    }),
    body: (model, prompt) => ({
      model: model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 10
    })
  },
  custom: {
    name: 'Custom Endpoint',
    defaultModel: 'custom-model',
    defaultUrl: 'http://localhost:11434/v1/chat/completions',
    headers: (key) => ({
      'Content-Type': 'application/json',
      'Authorization': key ? `Bearer ${key}` : ''
    }),
    body: (model, prompt) => ({
      model: model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 10
    })
  }
};

const AiKeyTester = () => {
  const [provider, setProvider] = useState('openai');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [model, setModel] = useState(PROVIDERS.openai.defaultModel);
  const [endpointUrl, setEndpointUrl] = useState(PROVIDERS.openai.defaultUrl);
  const [prompt, setPrompt] = useState("Respond with 'Pong!' and nothing else.");
  const [corsProxy, setCorsProxy] = useState('');
  const [useProxy, setUseProxy] = useState(false);

  // Advanced configurations
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customHeaders, setCustomHeaders] = useState('');
  const [customBody, setCustomBody] = useState('');

  // Status & logs
  const [status, setStatus] = useState('idle'); // idle, testing, success, error
  const [timeline, setTimeline] = useState([]);
  const [responseTime, setResponseTime] = useState(null);
  const [httpStatus, setHttpStatus] = useState(null);
  const [rawResponse, setRawResponse] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [errorDetails, setErrorDetails] = useState('');
  const [copiedLog, setCopiedLog] = useState(false);

  // Sync endpoint, model, and payloads when provider changes
  useEffect(() => {
    const config = PROVIDERS[provider];
    setModel(config.defaultModel);
    setEndpointUrl(config.defaultUrl);
    setCustomHeaders(JSON.stringify(config.headers('YOUR_API_KEY_HERE'), null, 2));
    setCustomBody(JSON.stringify(config.body(config.defaultModel, prompt), null, 2));
  }, [provider]);

  // Sync custom body when model or prompt changes (if not in advanced mode or body matches default structure)
  useEffect(() => {
    if (!showAdvanced) {
      const config = PROVIDERS[provider];
      setCustomBody(JSON.stringify(config.body(model, prompt), null, 2));
    }
  }, [model, prompt, provider, showAdvanced]);

  // Sync custom headers when apiKey changes (if not in advanced mode)
  useEffect(() => {
    if (!showAdvanced) {
      const config = PROVIDERS[provider];
      setCustomHeaders(JSON.stringify(config.headers(apiKey || 'YOUR_API_KEY_HERE'), null, 2));
    }
  }, [apiKey, provider, showAdvanced]);

  const addTimelineStep = (label, statusMsg, stepStatus) => {
    setTimeline(prev => [...prev, { label, message: statusMsg, status: stepStatus }]);
  };

  const handleTestKey = async () => {
    if (!apiKey.trim() && provider !== 'custom') {
      setErrorDetails('API Key cannot be empty for this provider.');
      setStatus('error');
      return;
    }

    // Reset status
    setStatus('testing');
    setTimeline([]);
    setResponseTime(null);
    setHttpStatus(null);
    setRawResponse(null);
    setResponseText('');
    setErrorDetails('');

    const startTime = performance.now();

    // Step 1: Validating inputs
    addTimelineStep('Input Validation', 'Verifying configuration validity...', 'success');

    // Prepare Request Details
    let headersObj = {};
    let bodyObj = {};

    try {
      if (showAdvanced) {
        headersObj = JSON.parse(customHeaders);
        // Replace placeholder api key with real one in custom headers
        Object.keys(headersObj).forEach(key => {
          if (typeof headersObj[key] === 'string' && headersObj[key].includes('YOUR_API_KEY_HERE')) {
            headersObj[key] = headersObj[key].replace('YOUR_API_KEY_HERE', apiKey);
          }
        });
        bodyObj = JSON.parse(customBody);
      } else {
        const config = PROVIDERS[provider];
        headersObj = config.headers(apiKey);
        bodyObj = config.body(model, prompt);
      }
    } catch (e) {
      addTimelineStep('JSON Validation', 'Invalid JSON format in Header/Body!', 'error');
      setErrorDetails(`JSON Parsing Error: ${e.message}`);
      setStatus('error');
      return;
    }

    // Handle Gemini specific URL structuring
    let targetUrl = endpointUrl;
    if (provider === 'gemini') {
      // Endpoint format: https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}
      const geminiModel = model || 'gemini-2.5-flash';
      targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`;
    }

    // Prepend proxy if active
    let finalUrl = targetUrl;
    if (useProxy && corsProxy.trim()) {
      const proxyBase = corsProxy.trim();
      finalUrl = `${proxyBase}${targetUrl}`;
    }

    // Step 2: Preparing connection
    addTimelineStep(
      'Preparing Connection',
      `Connecting to ${new URL(targetUrl).hostname}...${useProxy ? ' (via CORS Proxy)' : ''}`,
      'success'
    );

    // Step 3: Sending request
    addTimelineStep('Sending Request', `Sending request payload...`, 'pending');

    try {
      const fetchOptions = {
        method: 'POST',
        headers: headersObj,
        body: JSON.stringify(bodyObj)
      };

      const response = await fetch(finalUrl, fetchOptions);
      const endTime = performance.now();
      const latency = Math.round(endTime - startTime);
      setResponseTime(latency);
      setHttpStatus(response.status);

      // Update send request step to success
      setTimeline(prev => {
        const updated = [...prev];
        updated[2] = { ...updated[2], status: 'success', message: `Request completed in ${latency}ms` };
        return updated;
      });

      // Step 4: Parse response
      addTimelineStep('Parsing Response', `Parsing response data from server...`, 'pending');
      const responseData = await response.json();
      setRawResponse(responseData);

      setTimeline(prev => {
        const updated = [...prev];
        updated[3] = { ...updated[3], status: 'success', message: 'Response parsed successfully.' };
        return updated;
      });

      if (response.ok) {
        // Success criteria check depending on provider
        let extractedText = '';
        let isValid = false;

        if (
          provider === 'openai' || 
          provider === 'groq' || 
          provider === 'openrouter' || 
          provider === 'deepseek' || 
          provider === 'minimax' || 
          provider === 'xiaomi_mimo' || 
          provider === 'custom'
        ) {
          extractedText = responseData.choices?.[0]?.message?.content || JSON.stringify(responseData);
          isValid = true;
        } else if (provider === 'anthropic') {
          extractedText = responseData.content?.[0]?.text || JSON.stringify(responseData);
          isValid = true;
        } else if (provider === 'gemini') {
          extractedText = responseData.candidates?.[0]?.content?.parts?.[0]?.text || JSON.stringify(responseData);
          isValid = true;
        }

        setResponseText(extractedText);
        setStatus('success');
      } else {
        // Bad response status
        setStatus('error');
        let errorMsg = responseData.error?.message || responseData.error || JSON.stringify(responseData);
        if (response.status === 401) {
          setErrorDetails(`401 Unauthorized: Your API Key is invalid or expired. (${errorMsg})`);
        } else if (response.status === 429) {
          setErrorDetails(`429 Too Many Requests: API Key quota exceeded or rate limited. (${errorMsg})`);
        } else if (response.status === 404) {
          setErrorDetails(`404 Not Found: Model '${model}' or Endpoint URL not found. (${errorMsg})`);
        } else {
          setErrorDetails(`HTTP Error ${response.status}: ${errorMsg}`);
        }
      }

    } catch (err) {
      const endTime = performance.now();
      setResponseTime(Math.round(endTime - startTime));
      
      // Update send request step to error
      setTimeline(prev => {
        const updated = [...prev];
        if (updated[2]) {
          updated[2] = { ...updated[2], status: 'error', message: 'Failed to send request.' };
        }
        return updated;
      });

      setStatus('error');
      
      // Detailed error analysis
      if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
        setErrorDetails(
          'Network Error / CORS Blocked. This is very common when accessing APIs directly from the browser. ' +
          'Please enable the CORS Proxy in advanced settings, install a CORS bypass browser extension, or check your internet connection.'
        );
      } else {
        setErrorDetails(`Connection Error: ${err.message}`);
      }
    }
  };

  const copyRawResponse = () => {
    if (rawResponse) {
      navigator.clipboard.writeText(JSON.stringify(rawResponse, null, 2)).then(() => {
        setCopiedLog(true);
        setTimeout(() => setCopiedLog(false), 2000);
      });
    }
  };

  return (
    <div className="tool-page-container">
      <div className="tool-page-header">
        <h1 className="page-title">AI Key Lab</h1>
        <p className="page-subtitle">Test the validity and latency of your AI provider API keys securely directly from the browser.</p>
      </div>

      <div className="tester-grid">
        {/* Input Panel */}
        <div className="tester-panel glass-panel">
          <div className="panel-header">
            <h3><Key size={18} /> Tester Configuration</h3>
          </div>

          <div className="panel-body">
            {/* Provider Selector */}
            <div className="form-group">
              <label htmlFor="provider-select">AI Provider</label>
              <select 
                id="provider-select" 
                className="input-field" 
                value={provider} 
                onChange={(e) => setProvider(e.target.value)}
              >
                {Object.entries(PROVIDERS).map(([key, val]) => (
                  <option key={key} value={key}>{val.name}</option>
                ))}
              </select>
            </div>

            {/* Endpoint URL */}
            <div className="form-group">
              <label htmlFor="endpoint-input">Endpoint URL</label>
              <input
                id="endpoint-input"
                type="text"
                className="input-field"
                value={endpointUrl}
                onChange={(e) => setEndpointUrl(e.target.value)}
                placeholder="https://api.openai.com/v1/chat/completions"
              />
            </div>

            {/* API Key Input */}
            {provider !== 'custom' && (
              <div className="form-group">
                <label htmlFor="api-key-input">API Key</label>
                <div className="api-key-input-wrapper">
                  <input
                    id="api-key-input"
                    type={showKey ? 'text' : 'password'}
                    className="input-field key-input"
                    placeholder={`Enter ${PROVIDERS[provider].name} API Key`}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                  <button 
                    type="button"
                    className="toggle-key-btn" 
                    onClick={() => setShowKey(!showKey)}
                    title={showKey ? "Hide Key" : "Show Key"}
                  >
                    {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            {/* Model Name Override */}
            <div className="form-group">
              <div className="label-row">
                <label htmlFor="model-input">Model Name</label>
                {PROVIDERS[provider]?.modelListUrl && (
                  <span className="models-link-wrapper">
                    (see{' '}
                    <a
                      href={PROVIDERS[provider].modelListUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="models-link"
                    >
                      models here
                    </a>
                    )
                  </span>
                )}
              </div>
              <div className="model-input-wrapper">
                <Cpu size={16} className="input-icon" />
                <input
                  id="model-input"
                  type="text"
                  className="input-field icon-padding"
                  placeholder={`Model name, e.g. ${PROVIDERS[provider]?.placeholderModel || PROVIDERS[provider]?.defaultModel}`}
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                />
              </div>
            </div>

            {/* CORS Proxy Toggle */}
            <div className="proxy-section">
              <label className="checkbox-container">
                <input 
                  type="checkbox" 
                  checked={useProxy} 
                  onChange={(e) => setUseProxy(e.target.checked)} 
                />
                <span className="checkmark"></span>
                Use CORS Proxy (Bypass browser CORS restrictions)
              </label>

              {useProxy && (
                <div className="form-group proxy-input-group">
                  <div className="proxy-input-wrapper">
                    <Globe size={16} className="input-icon" />
                    <input
                      type="text"
                      className="input-field icon-padding"
                      placeholder="Example: https://cors-anywhere.herokuapp.com/"
                      value={corsProxy}
                      onChange={(e) => setCorsProxy(e.target.value)}
                    />
                  </div>
                  <small className="help-text">
                    The target URL will be appended to the proxy. Ensure your proxy allows POST requests.
                  </small>
                </div>
              )}
            </div>

            {/* Advanced Settings Toggle */}
            <div className="advanced-toggle" onClick={() => setShowAdvanced(!showAdvanced)}>
              <span className="toggle-label">
                <Settings size={16} /> Advanced / Custom Payload
              </span>
              {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>

            {showAdvanced && (
              <div className="advanced-fields">
                {/* Prompt Test Override */}
                <div className="form-group">
                  <label htmlFor="prompt-override-input">Test Prompt</label>
                  <input
                    id="prompt-override-input"
                    type="text"
                    className="input-field"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Respond with 'Pong!' and nothing else."
                  />
                </div>

                {/* Custom Headers */}
                <div className="form-group">
                  <label htmlFor="headers-input">Request Headers (JSON)</label>
                  <textarea
                    id="headers-input"
                    className="input-field code-textarea"
                    rows={4}
                    value={customHeaders}
                    onChange={(e) => setCustomHeaders(e.target.value)}
                    spellCheck={false}
                  />
                </div>

                {/* Custom Body */}
                <div className="form-group">
                  <label htmlFor="body-input">Request Body (JSON)</label>
                  <textarea
                    id="body-input"
                    className="input-field code-textarea"
                    rows={6}
                    value={customBody}
                    onChange={(e) => setCustomBody(e.target.value)}
                    spellCheck={false}
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button 
              className="btn-primary test-btn" 
              onClick={handleTestKey}
              disabled={status === 'testing'}
            >
              {status === 'testing' ? (
                <>
                  <Loader2 size={18} className="spinner" /> Testing...
                </>
              ) : (
                <>
                  <Send size={18} /> Test API Key
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results & Diagnostics Panel */}
        <div className="tester-panel glass-panel">
          <div className="panel-header">
            <h3><Activity size={18} /> Results & Diagnostics</h3>
          </div>

          <div className="panel-body results-body">
            {/* Status Summary Banner */}
            {status === 'idle' && (
              <div className="result-banner info">
                <Info size={24} />
                <div>
                  <h4>Waiting for Test</h4>
                  <p>Enter your API key and click "Test API Key" to begin the test process.</p>
                </div>
              </div>
            )}

            {status === 'testing' && (
              <div className="result-banner warning animate-pulse">
                <Loader2 size={24} className="spinner" />
                <div>
                  <h4>Testing in Progress...</h4>
                  <p>Sending and verifying request payload with the API provider.</p>
                </div>
              </div>
            )}

            {status === 'success' && (
              <div className="result-banner success">
                <CheckCircle2 size={24} />
                <div>
                  <h4>API Key VALID</h4>
                  <p>Connection successful! Your key is active and ready to process requests.</p>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="result-banner danger">
                <XCircle size={24} />
                <div>
                  <h4>API Key INVALID / ERROR</h4>
                  <p>Connection failed or rejected. Please check the error details below.</p>
                </div>
              </div>
            )}

            {/* Timeline Progress */}
            {status !== 'idle' && timeline.length > 0 && (
              <div className="timeline-section">
                <h5>Processing Timeline</h5>
                <div className="timeline-steps">
                  {timeline.map((step, idx) => (
                    <div key={idx} className={`timeline-step ${step.status}`}>
                      <div className="step-marker">
                        {step.status === 'success' && <CheckCircle2 size={16} />}
                        {step.status === 'error' && <XCircle size={16} />}
                        {step.status === 'pending' && <Loader2 size={16} className="spinner" />}
                      </div>
                      <div className="step-content">
                        <span className="step-title">{step.label}</span>
                        <span className="step-desc">{step.message}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Diagnostics Stats */}
            {status !== 'idle' && status !== 'testing' && (
              <div className="diagnostics-row">
                {responseTime !== null && (
                  <div className="stat-card">
                    <span className="stat-label"><Clock size={14} /> Latency</span>
                    <span className="stat-value">{responseTime} ms</span>
                  </div>
                )}
                {httpStatus !== null && (
                  <div className="stat-card">
                    <span className="stat-label">HTTP Status</span>
                    <span className={`stat-value status-${httpStatus >= 200 && httpStatus < 300 ? 'ok' : 'bad'}`}>
                      {httpStatus}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Text Preview / Content Response */}
            {status === 'success' && responseText && (
              <div className="response-preview-box">
                <h5>AI Model Response</h5>
                <div className="preview-text">
                  "{responseText}"
                </div>
              </div>
            )}

            {/* Error Message Details */}
            {status === 'error' && errorDetails && (
              <div className="error-details-box">
                <div className="error-header">
                  <AlertCircle size={16} /> Error Detected
                </div>
                <div className="error-body">
                  {errorDetails}
                </div>
              </div>
            )}

            {/* Raw JSON Logger Accordion */}
            {rawResponse && (
              <div className="raw-response-section">
                <div className="raw-response-header" onClick={copyRawResponse}>
                  <span><Terminal size={14} /> Raw JSON Response Log</span>
                  <button className="copy-btn-small" title="Copy full response">
                    {copiedLog ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
                <pre className="raw-response-code">
                  {JSON.stringify(rawResponse, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info notice about CORS */}
      <div className="info-notice-card glass-panel">
        <AlertCircle size={20} className="notice-icon" />
        <div className="notice-text">
          <h5>Disclaimer</h5>
          <p>
            All API keys you test here are processed locally directly in your browser and are never sent or stored on any server. However, for security reasons, most major AI providers (like OpenAI and Anthropic) restrict direct client-side requests by default (CORS block). If you are concerned about your API keys being exposed or leaked, please do not use this service.
          </p>
          <p className="sub-notice">
            To test them, enable the <strong>"Use CORS Proxy"</strong> option in the left panel, or use a CORS bypass browser extension (such as <em>Allow CORS: Access-Control-Allow-Origin</em>).
          </p>
        </div>
      </div>
    </div>
  );
};

export default AiKeyTester;
