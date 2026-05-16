import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import ImageToText from './pages/ImageToText';
import CsvViewer from './pages/CsvViewer';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="image-to-text" element={<ImageToText />} />
          <Route path="csv-viewer" element={<CsvViewer />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
