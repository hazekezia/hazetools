import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/jsx/Home';
import ImageToText from './pages/jsx/ImageToText';
import CsvViewer from './pages/jsx/CsvViewer';
import JsonViewer from './pages/jsx/JsonViewer';
import AiKeyTester from './pages/jsx/AiKeyTester';
import ColorToolkit from './pages/jsx/ColorToolkit';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="image-to-text" element={<ImageToText />} />
          <Route path="csv-viewer" element={<CsvViewer />} />
          <Route path="json-viewer" element={<JsonViewer />} />
          <Route path="ai-key-tester" element={<AiKeyTester />} />
          <Route path="color-toolkit" element={<ColorToolkit />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

