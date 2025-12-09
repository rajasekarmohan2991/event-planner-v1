# Event Planner

A full-stack event planning application with a React/Next.js frontend and Java Spring Boot backend.

## Features

- Modern, responsive UI built with Next.js and Tailwind CSS
- Smooth animations and transitions with Framer Motion
- State management with React Query
- TypeScript for type safety
- Docker support for easy deployment

## Prerequisites

- Node.js 18+ and npm 9+
- Java 21+
- Docker and Docker Compose (optional)

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd event-planner
```

### 2. Set up the backend

```bash
cd apps/api-java
./mvnw clean install
```

### 3. Set up the frontend

```bash
cd ../web
npm install
```

### 4. Environment Variables

Create a `.env` file in the root of the web app:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### 5. Start the development servers

In separate terminals:

```bash
# Start the backend
cd apps/api-java
./mvnw spring-boot:run

# Start the frontend
cd ../web
npm run dev
```

The application will be available at http://localhost:3000

## Available Scripts

In the `web` directory, you can run:

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm start` - Start the production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Check TypeScript types
- `npm run format` - Format code with Prettier
- `npm run fix:imports` - Fix Framer Motion imports
- `npm run fix:build` - Run build fix script

## Docker Support

### Build and run with Docker Compose

```bash
docker-compose up --build
```

### Build individual services

```bash
# Build the frontend
docker build -t event-planner-web -f apps/web/Dockerfile .

# Build the backend
docker build -t event-planner-api -f apps/api-java/Dockerfile .
```

## Project Structure

```
event-planner/
├── apps/
│   ├── api-java/         # Spring Boot backend
│   └── web/              # Next.js frontend
│       ├── app/          # App Router
│       ├── components/   # Reusable components
│       ├── lib/          # Utility functions
│       └── public/       # Static files
├── docs/                 # Documentation
└── scripts/              # Utility scripts
```

## Troubleshooting

### Build Errors

If you encounter build errors:

1. Clean the project:
   ```bash
   rm -rf node_modules .next package-lock.json
   ```

2. Reinstall dependencies:
   ```bash
   npm install
   ```

3. Fix Framer Motion imports:
   ```bash
   npm run fix:imports
   ```

4. Run the build fix script:
   ```bash
   npm run fix:build
   ```

### Common Issues

- **Invalid Hook Call**: Ensure all components using hooks have the `'use client'` directive
- **Type Errors**: Run `npm run type-check` to identify and fix TypeScript errors
- **Dependency Issues**: Delete `node_modules` and `package-lock.json`, then run `npm install`

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
