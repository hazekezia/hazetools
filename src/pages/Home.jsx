import { Link } from 'react-router-dom';
import { ScanText, TableProperties, ArrowRight } from 'lucide-react';
import './Home.css';

const Home = () => {
  const tools = [
    {
      id: 'image-to-text',
      title: 'Image to Text (OCR)',
      description: 'Extract text from any image quickly using advanced OCR technology right in your browser.',
      icon: <ScanText size={32} className="tool-icon" />,
      path: '/image-to-text',
      color: 'purple'
    },
    {
      id: 'csv-viewer',
      title: 'CSV Viewer',
      description: 'Open, view, and analyze your CSV files instantly in a responsive data grid.',
      icon: <TableProperties size={32} className="tool-icon" />,
      path: '/csv-viewer',
      color: 'blue'
    }
  ];

  return (
    <div className="home-container">
      <h1 className="page-title">Welcome to Haze Tools</h1>
      <p className="page-subtitle">Your all-in-one workspace for online utilities.</p>
      
      <div className="tools-grid">
        {tools.map((tool) => (
          <Link to={tool.path} key={tool.id} className={`tool-card glass-panel ${tool.color}`}>
            <div className="tool-header">
              <div className="icon-wrapper">
                {tool.icon}
              </div>
            </div>
            <h3>{tool.title}</h3>
            <p>{tool.description}</p>
            <div className="tool-footer">
              <span>Launch Tool</span>
              <ArrowRight size={16} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Home;
