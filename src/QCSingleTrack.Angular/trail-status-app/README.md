# QC SingleTrack - Trail Status App

A modern Angular web application for viewing and managing mountain bike trail statuses in the Quad Cities area. This application provides real-time trail information, interactive maps, and a responsive user interface with dark mode support.

## 🎯 Project Description

The QC SingleTrack Trail Status App helps mountain bikers quickly check trail conditions before heading out. Users can view trail statuses (Open, Closed, Caution), see detailed trail information, and visualize trail locations on an interactive OpenStreetMap with Leaflet integration.

### Key Features

- **Real-time Trail Status**: View current trail conditions at a glance
- **Interactive Map**: OpenStreetMap integration with Leaflet showing precise trail locations
- **Trail Details**: Comprehensive information including descriptions, locations, and status updates
- **Dark Mode**: Seamless light/dark theme switching with system preference detection
- **Responsive Design**: Mobile-first design using Tailwind CSS
- **Deep Linking**: Direct navigation to specific trails via URL parameters
- **Photo Gallery**: Visual trail documentation and imagery

## 🛠️ Tech Stack

### Frontend Framework
- **Angular 17.3** - Modern TypeScript framework with standalone components
- **TypeScript** - Type-safe JavaScript development
- **RxJS** - Reactive programming for data streams

### UI & Styling
- **Tailwind CSS** - Utility-first CSS framework
- **SCSS** - Enhanced CSS with variables and mixins
- **Responsive Design** - Mobile-first approach

### Mapping
- **Leaflet** - Interactive map library
- **OpenStreetMap** - Open-source map tile provider
- **Custom SVG Markers** - Color-coded trail status indicators

### Development Tools
- **Angular CLI** - Project scaffolding and build tools
- **TypeScript Compiler** - Type checking and transpilation
- **Vite** (via Angular) - Fast development server

### API Integration
- **HTTP Client** - RESTful API communication
- **API Key Interceptor** - Secure API authentication

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **Angular CLI** (v17.3 or higher)

## 🚀 Getting Started

### Installation

```bash
# Install dependencies
npm install
```

### Development Server

```bash
# Start the development server
npm start

# Or use Angular CLI directly
ng serve
```

Navigate to `http://localhost:4200/`. The application will automatically reload when you make changes to source files.

### API Configuration

The app connects to a backend API. Configure the API endpoint in:
- `src/environments/environment.ts` (development)
- `src/environments/environment.prod.ts` (production)

Add your API key to the interceptor configuration in `src/app/interceptors/api-key.interceptor.ts`.

## 🔨 Build Commands

### Development Build

```bash
npm run build
```

### Production Build

```bash
npm run build -- --configuration production
```

Build artifacts will be stored in the `dist/` directory.

### Watch Mode (Development)

```bash
ng build --watch
```

## 🧪 Testing

### Run Unit Tests

```bash
npm test
# Or
ng test
```

Executes unit tests via [Karma](https://karma-runner.github.io).

## 📁 Project Structure

```
src/
├── app/
│   ├── components/          # UI components
│   │   ├── header.component.ts
│   │   ├── trail-list.component.ts
│   │   ├── trail-detail.component.ts
│   │   ├── gallery.component.ts
│   │   └── about.component.ts
│   ├── services/            # Business logic and API
│   │   ├── trail.service.ts
│   │   ├── map.service.ts
│   │   └── theme.service.ts
│   ├── models/              # TypeScript interfaces
│   │   └── trail-dto.model.ts
│   ├── interceptors/        # HTTP interceptors
│   │   └── api-key.interceptor.ts
│   ├── app.config.ts        # Application configuration
│   ├── app.routes.ts        # Routing configuration
│   └── app.component.ts     # Root component
├── assets/                  # Static assets
├── environments/            # Environment configurations
└── styles.scss             # Global styles
```

## 🎨 Features

### Trail List
- View all trails with status indicators
- Filter and search capabilities
- Click to view detailed trail information

### Trail Details
- Full trail descriptions
- Current status with timestamp
- Location information
- Interactive map with precise coordinates

### Interactive Map
- OpenStreetMap with Leaflet integration
- Color-coded markers (Green=Open, Red=Closed, Yellow=Caution)
- Automatic centering on selected trail
- Zoom controls and responsive behavior

### Theme Support
- Light and dark mode
- Automatic system preference detection
- Manual theme toggle
- Persistent user preference

## 🔧 Configuration

### Proxy Configuration

API requests are proxied through `proxy.conf.json` during development to avoid CORS issues.

### Tailwind CSS

Tailwind is configured in `tailwind.config.js` with custom theme extensions for dark mode support.

## 📦 Dependencies

Key packages:
- `@angular/core` - Angular framework
- `@angular/common` - Common Angular utilities
- `@angular/router` - Routing functionality
- `leaflet` - Map library
- `@types/leaflet` - TypeScript definitions for Leaflet
- `tailwindcss` - CSS framework

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 📝 Development Notes

- The application uses Angular standalone components (no NgModules)
- Routing is configured with functional guards and resolvers
- Services use dependency injection with `providedIn: 'root'`
- Map markers use custom SVG icons for trail status visualization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 17.3.17.

## 🆘 Support

For Angular CLI help:
```bash
ng help
```

Or visit the [Angular CLI Documentation](https://angular.io/cli).
