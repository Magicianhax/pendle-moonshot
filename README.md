# Pendle Moonshot Calculator

A high-contrast calculator for evaluating potential returns using Pendle Finance's market-order API.

## Features

- 🎯 Real-time moonshot calculations
- 🖥️ High contrast white/black design
- 📱 Responsive layout
- 🔄 Live reload development server
- 📦 Modular JavaScript architecture

## Project Structure

```
pendle-moonshot-calculator/
├── index.html          # Main HTML file
├── api.js              # Pendle API integration module
├── main.js             # Main application logic
├── package.json        # NPM configuration
└── README.md          # Project documentation
```

## Development Setup

### Prerequisites
- Node.js (v14 or higher)
- npm

### Installation

1. Clone or download the project
2. Install dependencies:
   ```bash
   npm install
   ```

### Running the Development Server

Start the live reload server:
```bash
npm start
```

Or use the dev command for enhanced watching:
```bash
npm run dev
```

The application will automatically open in your browser at `http://localhost:3000`.

## Usage

1. Enter an amount in alUSD (e.g., 20)
2. Click "Calculate Moonshot" or press Enter
3. View the results including:
   - Input amount in alUSD
   - Net from/to taker values (alUSD/YT)
   - Transaction fees in alUSD
   - Potential return percentage

## API Integration

The calculator integrates with Pendle Finance's APIs:
- **Market Order API**: `https://api-v2.pendle.finance/limit-order/v2/limit-order/market-order`
- **Market Data API**: `https://api-v2.pendle.finance/core/v2/1/markets/{address}/data`
- **Method**: POST (order), GET (data)
- **Chain**: Ethereum (chainId: 1)
- **Market**: `0x79f06a8dc564717a9ad418049d0be9a60f2646c0`
- **Maturity**: October 23, 2025

## File Descriptions

### `api.js`
Contains all Pendle API integration logic:
- API configuration constants
- Wei conversion utilities
- API call functions
- Response formatting

### `main.js`
Main application logic:
- DOM manipulation
- Event handling
- Input validation
- UI state management

### `index.html`
Single-page application with:
- High contrast CSS styling
- Form inputs and result display
- Responsive design

## Development

The project uses live-server for development with automatic reload on file changes. Edit any `.html`, `.js`, or `.css` files and see changes instantly in the browser.

## License

ISC
