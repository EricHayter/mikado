# Mikado Method Tool

A visual graph-based tool for applying the Mikado Method to software refactoring and project planning.

## Features

- **Visual Graph Editor**: Create and manage hierarchical task graphs
- **Multiple Graphs**: Organize different refactoring projects
- **Node Management**: Add, edit, and delete nodes with status tracking
- **Keyboard Shortcuts**: Fast navigation and editing with keyboard controls
- **Import/Export**: Save and share graphs as JSON files
- **Local Storage**: Automatic persistence of your work

## Controls

### Mouse
- **Scroll Wheel**: Zoom in/out
- **Left-click + Drag**: Pan the canvas
- **Click Node**: Select node
- **Double-click Text**: Edit node title/description

### Keyboard
- **Arrow Keys**: Pan the canvas (Shift for faster)
- **Delete/Backspace**: Delete selected node
- **Safe Mode**: Keyboard shortcuts disabled when typing

### Node Actions
- **Hover**: Show add child (+) and delete (×) buttons
- **Click Badge**: Cycle through TODO → In Progress → Done

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Documentation

See [CHANGELOG.md](CHANGELOG.md) for detailed information about features, bug fixes, and technical implementation.

## Tech Stack

- React + TypeScript
- ReactFlow - Graph visualization
- Mantine UI - Component library
- Vite - Build tool
- Dagre - Graph layout algorithm

## License

MIT
