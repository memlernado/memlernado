# Overview

Memlernado is a homeschool SCRUM platform designed as a simplified Jira/Trello for families and homeschool groups. The MVP focuses on core functionality including user management, workspace collaboration, sprint planning, and Kanban-style task management with drag-and-drop functionality. The application enables families to organize learning tasks into sprints, track progress on a visual Kanban board, and monitor learner achievements through an intuitive dashboard.

## Key Features

### ✅ Completed Features (September 2025)
- **Role-based Authentication**: Facilitators and learners with distinct permissions
- **Workspace Management**: Create and manage family/group learning environments  
- **Interactive Kanban Board**: Drag-and-drop task management with visual feedback
- **Task Details Modal**: Comprehensive task view/edit capabilities with form validation
- **Sprint Planning**: Create and manage learning sprints with task organization
- **Real-time UI Updates**: Optimistic updates with React Query integration
- **Dashboard**: Overview of workspace activity and learner progress

### 🔄 Current Status
- All core MVP features implemented and tested
- Drag-and-drop functionality working across all columns (To Do, In Progress, Done)
- Workspace functionality fully operational with real-time sync
- Task creation, editing, and status management complete

# Getting Started

## Developer Setup

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database (Neon is recommended for cloud hosting)
- Git for version control

### Installation & Environment Setup
1. **Clone the repository** and navigate to the project directory
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Environment Configuration**: Set up the following environment variables:
   ```bash
   DATABASE_URL=your_postgresql_connection_string
   SESSION_SECRET=your_session_secret_key
   ```
4. **Database Setup**: 
   - Create your PostgreSQL database (Neon recommended)
   - Run database migrations to set up the schema:
   ```bash
   npm run db:push
   ```

### Running the Application
- **Development mode**: Start both backend and frontend servers:
  ```bash
  npm run dev
  ```
  This runs the Express backend and Vite frontend on the same port (5000)
- **Access the application**: Open http://localhost:5000 in your browser

### Development Scripts
- `npm run dev` - Start development servers (backend + frontend)
- `npm run build` - Build frontend for production  
- `npm run db:push` - Sync database schema with Drizzle migrations
- `npm run db:generate` - Generate new migration files for schema changes

### Architecture Notes
- Backend and frontend run on the same port (5000) via Vite configuration
- No separate proxy setup needed - Vite handles API route forwarding
- Hot reload enabled for both frontend and backend during development

## User Setup Instructions
1. **Authentication**: Login with your facilitator or learner credentials
2. **Workspace Creation**: Create a new workspace for your family/group or join an existing one
3. **Sprint Setup**: Navigate to sprint planning to create your first learning sprint
4. **Task Management**: Add learning tasks, assign them to learners, and track progress

## User Roles & Workflows

### Facilitator (Parent/Teacher)
- **Primary Responsibilities**: Workspace management, sprint planning, task oversight
- **Key Actions**:
  - Create and manage workspaces
  - Plan learning sprints with educational objectives
  - Create and assign tasks to learners
  - Monitor progress and provide guidance
  - Move tasks between status columns as needed

### Learner (Student)
- **Primary Responsibilities**: Complete assigned tasks, update progress
- **Key Actions**:
  - View assigned tasks on the Kanban board
  - Update task status by moving cards (To Do → In Progress → Done)
  - Add comments and progress notes to tasks
  - View their learning dashboard and achievements

# Feature Documentation

## Interactive Kanban Board
- **Drag & Drop**: Move tasks between columns (To Do, In Progress, Done) with visual feedback
- **Real-time Updates**: Changes sync immediately across all users in the workspace  
- **Task Filtering**: Filter by assignee, subject, or priority
- **Visual Indicators**: Progress bars, due dates, and priority markers

## Task Management
- **Task Creation**: Rich form with title, description, subject, assignee, and due dates
- **Task Details Modal**: Click any task card to view/edit comprehensive details
- **Form Validation**: Required fields enforced with helpful error messages
- **Status Tracking**: Automatic progress tracking as tasks move through workflow

## Workspace Features
- **Multi-workspace Support**: Create separate environments for different families or groups
- **Member Management**: Add family members with appropriate roles (facilitator/learner)
- **Workspace Switching**: Use navigation dropdown to switch between workspaces
- **Real-time Sync**: Workspace list updates immediately when new workspaces are created

# Recent Changes (September 2025)

## Sprint Development Session - Major Feature Completion

### ✅ Drag & Drop Implementation
- **@dnd-kit Integration**: Implemented full drag-and-drop functionality using @dnd-kit/core and @dnd-kit/sortable
- **Visual Feedback**: Added drag overlay with visual indicators during task movement
- **Cross-column Support**: Tasks can be moved between all Kanban columns (To Do, In Progress, Done)
- **Bug Fix**: Resolved critical issue where dropping tasks over other tasks sent invalid status payloads
- **Collision Detection**: Enhanced drop detection logic to properly determine destination columns

### ✅ Task Details Modal
- **Comprehensive View**: Created modal component for viewing/editing complete task information
- **Form Integration**: React Hook Form with Zod validation for robust form handling
- **Real-time Updates**: Changes save immediately and update across all UI components
- **Click Handler**: Task cards now open detailed view when clicked (separate from drag actions)
- **Edit Mode**: Toggle between view and edit modes with proper form validation

### ✅ Workspace Functionality Fixes
- **Real API Integration**: Removed mock data, enabled real workspace queries in navigation
- **CreateWorkspaceModal**: Built comprehensive workspace creation form with validation
- **Navigation Sync**: Fixed critical bug where navigation didn't update with newly created workspaces
- **apiRequest Integration**: Standardized API calls for consistent auth and error handling
- **Immediate UI Updates**: React Query cache invalidation ensures instant workspace list updates

### 🔧 Technical Improvements
- **TypeScript Enhancements**: Added proper typing throughout components
- **Error Handling**: Improved error states and user feedback across all features
- **Performance**: Optimized rendering with proper dependency arrays and memoization
- **Security**: Standardized authenticated API requests with proper error normalization
- **Testing**: End-to-end testing coverage for all major user workflows

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client is built with React and TypeScript using Vite as the build tool. The application follows a component-based architecture with:

- **UI Framework**: shadcn/ui components built on top of Radix UI primitives for consistent, accessible design
- **Styling**: Tailwind CSS with custom theme variables for consistent branding and child-friendly design
- **State Management**: TanStack Query (React Query) for server state management with optimistic updates
- **Routing**: Wouter for lightweight client-side routing
- **Authentication**: Context-based auth provider with protected routes
- **Layout**: Modular layout system with navigation, sidebar, and main content areas

The frontend is organized into logical directories: components (reusable UI), pages (route components), hooks (custom React hooks), and lib (utilities and configuration).

## Backend Architecture
The server uses Express.js with TypeScript in an ESM module setup. Key architectural decisions include:

- **Authentication**: Passport.js with local strategy using session-based auth stored in PostgreSQL
- **Password Security**: Scrypt-based password hashing with salt for secure credential storage
- **API Design**: RESTful endpoints with consistent error handling and request/response logging
- **Session Management**: Express sessions with PostgreSQL session store for persistence
- **Middleware**: Custom logging middleware for API request tracking

## Data Storage Solutions
The application uses PostgreSQL as the primary database with Drizzle ORM for type-safe database operations:

- **Database**: Neon PostgreSQL for cloud hosting and scalability
- **ORM**: Drizzle with schema-first approach providing full TypeScript integration
- **Migrations**: Drizzle Kit for database schema management and migrations
- **Connection**: Connection pooling via @neondatabase/serverless for optimal performance

## Database Schema Design
The schema supports multi-tenant workspaces with role-based access:

- **Users**: Core user data with role distinction (facilitator/learner)
- **Workspaces**: Family or group learning environments
- **Workspace Members**: Many-to-many relationship with role assignments
- **Sprints**: Time-boxed learning periods with active/inactive states
- **Tasks**: Learning activities with status tracking, assignment, and progress monitoring

## External Dependencies

- **Database**: Neon PostgreSQL serverless database
- **UI Components**: Radix UI primitives for accessible component foundation
- **Drag & Drop**: @dnd-kit for Kanban board task manipulation
- **Development Tools**: Replit-specific plugins for development environment integration
- **Form Handling**: React Hook Form with Zod validation for type-safe form management
