# Sidr Lite - Family Tree Builder

A modern, fast, and intuitive family tree builder built with React, TypeScript, and TanStack Router.

## Features

### Core Functionality
- **Visual Family Tree**: Interactive tree visualization with drag-and-drop support
- **Quick Entry**: Fast person and relationship creation with smart suggestions
- **Batch Entry**: Spreadsheet-like interface for bulk data entry
- **Family Templates**: Pre-built patterns for common family structures
- **Data Import/Export**: JSON format for data portability

### Advanced Features
- **Incomplete Parent Marriages**: Support for single-parent families and step-families
- **Smart Validation**: Real-time validation with helpful error messages
- **Data Quality Warnings**: Non-intrusive warnings for data quality issues
- **Name Autocomplete**: Intelligent name suggestions based on common names
- **Keyboard Navigation**: Full keyboard support for accessibility

### Family Tree Operations
- **Create Persons**: Add family members with name, gender, and relationships
- **Create Marriages**: Link spouses with support for incomplete marriages
- **Add Children**: Link children to parent marriages
- **Add Siblings**: Quickly add siblings to existing children
- **Add Parents**: Add parents to orphaned children or complete parent pairs
- **Complete Parent Pairs**: Add second parent to incomplete marriages

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
```

### Testing

This project uses [Vitest](https://vitest.dev/) for testing:

```bash
npm run test
```

## Technology Stack

- **Frontend**: React 18, TypeScript, TanStack Router
- **Styling**: Tailwind CSS, Headless UI
- **Components**: Shadcn/ui components
- **State Management**: Zustand
- **Testing**: Vitest, React Testing Library
- **Build Tool**: Vite

## Project Structure

```
src/
├── components/          # Reusable UI components
├── routes/             # File-based routing
├── store/              # State management
├── utils/              # Utility functions
├── types/              # TypeScript definitions
└── hooks/              # Custom React hooks
```

## Domain Rules

The application follows strict domain rules for family tree data integrity:

### Data Model
- **Persons**: Unique ID, name, gender (M/F only), root status
- **Marriages**: Can be complete (both spouses) or incomplete (single parent)
- **Child Links**: Connect children to parent marriages
- **Validation**: Hard invariants prevent invalid relationships

### Supported Relationships
- **Complete Marriages**: Traditional two-parent families
- **Incomplete Marriages**: Single-parent families, step-families
- **Siblings**: Children of the same parents
- **Ancestry**: Multi-generation family trees

### Validation Rules
- **Gender Rules**: Strict M/F gender system
- **Polygamy Limits**: 4 active marriages for males, 1 for females
- **Ancestry Rules**: No parent-child cycles or ancestor-descendant marriages
- **Data Quality**: Warnings for isolated persons, orphaned children, etc.

## Usage

### Quick Entry
1. Navigate to the Quick Entry page
2. Select relationship type (spouse, child, parent, sibling)
3. Choose target person (if applicable)
4. Enter name and gender
5. Submit to create the relationship

### Tree View
1. Navigate to the Tree page
2. View your family tree visualization
3. Click on persons or marriages for details
4. Use context menus for quick actions

### Batch Entry
1. Switch to Batch Entry mode
2. Add multiple persons in spreadsheet format
3. Use templates for common family structures
4. Process all entries at once

## Development

### Adding Components

Use the latest version of [Shadcn](https://ui.shadcn.com/):

```bash
pnpx shadcn@latest add button
```

### Adding Routes

Routes are managed as files in `src/routes/`. Add new files to create routes.

### State Management

The application uses Zustand for state management with a centralized family tree store.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details.