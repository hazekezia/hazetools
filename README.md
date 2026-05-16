# hz.tools &middot; ![License](https://img.shields.io/badge/license-MIT-blue) ![Version](https://img.shields.io/badge/version-1.0.0-green)

A modern, client-side collection of developer utilities. Everything runs locally in your browser.

No server, no uploads, no data leaves your machine.

## Tools

| Tool | Description |
|------|-------------|
| **Image to Text (OCR)** | Extract text from images using Tesseract.js. Supports drag-and-drop, paste from clipboard, multi-pass OCR with automatic best-result selection, and image preprocessing for improved accuracy. Languages: English + Indonesian. |
| **CSV Viewer** | Parse and explore `.csv` files instantly. Full-text search across all columns, click-to-sort headers with numeric-aware ordering, and paginated results (50 rows/page). Powered by PapaParse. |
| **JSON Viewer** | Format, validate, and navigate JSON through an interactive collapsible tree. Includes beautify/minify, key/value search with path highlighting, copy to clipboard, and download as formatted file. |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18

### Installation

```bash
git clone https://github.com/hazekezia/hazetools.git
cd hazetools
npm install
```

### Development

```bash
npm run dev
```

Opens the app at `http://localhost:5173` with hot module replacement.

### Production Build

```bash
npm run build      # outputs to dist/
npm run preview    # preview the production build locally
```

## Author

Built by [hazekezia](https://github.com/hazekezia).

## License

MIT
