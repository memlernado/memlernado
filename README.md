# Memlernado

## Docker Quick Start

1. **Start the development environment with seed data:**
   ```bash
   npm run docker:dev
   ```
   ```bash
   npm run docker:db:push
   ```
   ```bash
   npm run docker:db:seed
   ```

   This will:
   - Start Docker containers
   - Push database schema
   - Seed with test data

2. **Access your application:**
   - **App**: http://localhost:5460
   - **Database**: localhost:5432 (postgres/postgres)

3. **Login with test credentials:**
   - **Facilitator**: sarah_johnson / password123
   - **Learner**: emma_johnson / password123

## Available Commands

- `npm run docker:dev` - Start with logs visible
- `npm run docker:dev:detached` - Start in background
- `npm run docker:stop` - Stop all services
- `npm run docker:clean` - Stop and remove all data
- `npm run docker:logs` - View logs
- `npm run docker:db:push` - Push database schema
- `npm run docker:db:studio` - Open Drizzle Studio
- `npm run docker:db:seed` - Seed with full realistic data
- `npm run docker:db:seed:minimal` - Seed with minimal test data

## Environment Variables

The Docker setup uses these environment variables (set in docker-compose.dev.yml):

- `DATABASE_URL=postgresql://postgres:postgres@postgres:5432/memlernado_dev`
- `SESSION_SECRET=local-dev-session-secret-change-in-production`
- `NODE_ENV=development`

## Database Management

```bash
# Connect to database directly
docker-compose -f docker-compose.dev.yml exec postgres psql -U postgres -d memlernado_dev

# View database logs
docker-compose -f docker-compose.dev.yml logs -f postgres

# Reset database (WARNING: deletes all data)
npm run docker:clean
npm run docker:dev:detached
npm run docker:db:push
```

## Seed Data

### Minimal Seed Data (Default)
- **1 Facilitator**: admin / admin123
- **1 Learner**: student / student123  
- **1 Workspace**: Test Workspace
- **1 Active Sprint**: Test Sprint
- **3 Sample Tasks**: Math, English, Science

### Full Seed Data
- **2 Facilitators**: sarah_johnson, mike_wilson / password123
- **3 Learners**: emma_johnson, alex_johnson, sophie_wilson / password123
- **3 Workspaces**: 2 family workspaces + 1 community workspace
- **4 Sprints**: 1 active, 1 past, 2 future
- **12 Tasks**: Mix of completed, in-progress, and todo tasks

```bash
# Use full seed data instead of minimal
npm run docker:db:seed
```

## Troubleshooting

1. **Port already in use:**
   ```bash
   # Kill process on port 5000
   lsof -ti:5000 | xargs kill -9
   ```

2. **Database connection issues:**
   ```bash
   # Check if PostgreSQL is running
   docker-compose -f docker-compose.dev.yml ps
   
   # View database logs
   docker-compose -f docker-compose.dev.yml logs postgres
   ```

3. **Application not starting:**
   ```bash
   # View application logs
   docker-compose -f docker-compose.dev.yml logs app
   
   # Rebuild containers
   npm run docker:clean
   npm run docker:dev:detached
   ```
