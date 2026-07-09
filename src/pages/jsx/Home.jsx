import { Link } from 'react-router-dom';
import { ScanText, TableProperties, FileJson, Key, ArrowRight, Palette } from 'lucide-react';
import '../css/Home.css';

const Home = () => {
  const tools = [
    {
      id: 'image-to-text',
      title: 'Image to Text (OCR)',
      description: 'Extract text from any image quickly using advanced OCR technology.',
      icon: <ScanText size={22} className="tool-icon" />,
      path: '/image-to-text',
      color: 'purple'
    },
    {
      id: 'csv-viewer',
      title: 'CSV Viewer',
      description: 'Open, view, and analyze your CSV files instantly in a responsive grid.',
      icon: <TableProperties size={22} className="tool-icon" />,
      path: '/csv-viewer',
      color: 'blue'
    },
    {
      id: 'json-viewer',
      title: 'JSON Viewer',
      description: 'Format, validate, and explore JSON data with an interactive tree view.',
      icon: <FileJson size={22} className="tool-icon" />,
      path: '/json-viewer',
      color: 'green'
    },
    {
      id: 'ai-key-tester',
      title: 'AI Key Lab',
      description: 'Test and verify your AI provider keys (OpenAI, Anthropic, Gemini, Groq, etc.) locally and securely.',
      icon: <Key size={22} className="tool-icon" />,
      path: '/ai-key-tester',
      color: 'violet'
    },
    {
      id: 'color-toolkit',
      title: 'Color Toolkit',
      description: 'A comprehensive suite of color tools for designers and developers.',
      icon: <Palette size={22} className="tool-icon" />,
      path: '/color-toolkit',
      color: 'pink'
    }
  ];

  return (
    <div className="home-container">
      <h1 className="page-title">Welcome to hz.tools</h1>
      <p className="page-subtitle">Your all-in-one workspace for online utilities.</p>
      
      <div className="tools-grid">
        {tools.map((tool) => (
          <Link to={tool.path} key={tool.id} className={`tool-card glass-panel ${tool.color}`}>
            <div className="icon-wrapper">
              {tool.icon}
            </div>
            <div className="tool-info">
              <h3>{tool.title}</h3>
              <p>{tool.description}</p>
            </div>
            <div className="tool-arrow">
              <ArrowRight size={18} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Home;