# Architectural Ledger - Real Estate CRM

A modern, high-fidelity real estate management platform built with React, Vite, and TypeScript. Manage property listings, track buyer pipelines, and coordinate agent activities with a beautiful, responsive interface.

## Features

- **Property Catalog**: Browse and manage property listings with detailed engagement logs
- **Pipeline Overview**: Track buyer journeys across multiple stages with visual status cards
- **Lead Management**: Manage leads with scoring, contact information, and timeline tracking
- **Agent Directory**: View and manage agent profiles and contact details
- **Tour Scheduling**: Schedule and track property tours with visitor information
- **Analytics Dashboard**: Key metrics and performance indicators

## Tech Stack

- **Frontend**: React 18+ with TypeScript
- **Build Tool**: Vite (lightning-fast dev server)
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **State Management**: Zustand (lightweight, ready to use)
- **Icons**: Lucide React

## Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm/yarn

### Installation

1. Clone the repository
```bash
git clone <repo-url>
cd architectural-ledger
```

2. Install dependencies
```bash
pnpm install
```

3. Create environment file
```bash
cp .env.example .env.local
```

4. Start development server
```bash
pnpm dev
```

The app will open at `http://localhost:5173`

## Project Structure

```
src/
├── components/
│   ├── layout/           # Main layout components (Sidebar, Header)
│   ├── property/         # Property catalog components
│   ├── pipeline/         # Pipeline overview components
│   └── common/           # Shared utilities (ErrorBoundary, etc)
├── pages/                # Page components (routed)
├── hooks/                # Custom React hooks
├── types/                # TypeScript type definitions
├── data/                 # Mock data
├── utils/                # Utility functions
└── App.tsx              # Main app router
```

## Available Routes

- `/properties` - Property Catalog (default)
- `/pipeline` - Pipeline Overview
- `/agents` - Agent Directory
- `/tours` - Tour Management
- `/analytics` - Analytics Dashboard

## Mock Data

The application comes with comprehensive mock data:
- 4 sample properties with images and engagement logs
- 42 leads across different pipeline stages
- 5 agent profiles with contact information

## Future Integrations

### Supabase
When ready to integrate Supabase for persistent storage:
1. Set environment variables in `.env.local`
2. Uncomment Supabase code in `hooks/useSupabaseData.ts`
3. Replace mock data with real database queries

### n8n Webhooks
To enable n8n workflow automation:
1. Configure n8n instance and create workflows
2. Set `VITE_N8N_WEBHOOK_BASE_URL` in environment
3. Uncomment webhook triggers in `hooks/useN8nWebhook.ts`

## Development

### Building
```bash
pnpm build
```

### Preview Production Build
```bash
pnpm preview
```

### Type Checking
```bash
tsc --noEmit
```

## Customization

### Colors
Edit `tailwind.config.ts` to customize the color scheme:
- Primary: Dark navy blue (#2C3E50)
- Accent: Orange (#FF6B47), Green (#52C41A)
- Neutrals: Comprehensive gray scale

### Typography
Fonts are configured in `tailwind.config.ts` and applied via `font-sans` class

## Component Library

The app uses a custom component library built with Tailwind CSS. No external UI library dependencies - keeps the bundle lean and allows full customization.

## Performance

- Lazy loading ready components with React Router
- Optimized images with proper sizing
- Minimal dependencies for fast load times
- Production build: ~150KB gzipped

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Error Handling

The app includes an ErrorBoundary component that catches React errors and provides user-friendly error messages. Check console logs prefixed with `[v0]` for debugging.

## Contributing

When adding new features:
1. Follow the existing folder structure
2. Use TypeScript for type safety
3. Add proper error handling
4. Update this README if adding new routes/features
5. Test responsive behavior (mobile, tablet, desktop)

## License

Proprietary - All rights reserved

## Support

For issues or questions, check the implementation plan at `/v0_plans/realistic-path.md`
