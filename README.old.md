# Life Manager AI

A smart personal assistant application built with Laravel, Next.js, and Groq AI to help you manage your daily life efficiently.

## Features

- ✅ **Task Management**: Organize and track your daily tasks
- 💰 **Expense Tracking**: Monitor your spending habits
- 📚 **Study Goals**: Set and track learning objectives
- 🤖 **AI Assistant**: Chat with an intelligent AI powered by Groq
- 📊 **Dashboard**: Get a comprehensive overview of your day

## Tech Stack

### Backend
- Laravel 10 (PHP Framework)
- PostgreSQL (Database)
- Groq AI (LLM Provider)

### Frontend
- Next.js 16 (React Framework)
- TypeScript
- Tailwind CSS

## Project Structure

```
LIFE_MANAGER/
├── backend/                 # Laravel API
│   ├── app/
│   │   ├── Http/Controllers/
│   │   ├── Models/
│   │   └── Services/
│   ├── database/migrations/
│   └── routes/api.php
│
├── frontend/               # Next.js App
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   └── lib/
│   └── .env.local
│
└── life_manager_docs/     # Documentation
```

## Setup Instructions

### Prerequisites
- PHP 8.1+
- Composer
- Node.js 18+
- PostgreSQL
- Groq API Key (Get from: https://console.groq.com)

### Backend Setup

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   composer install
   ```

3. Configure database:
   - Create a PostgreSQL database named `life_manager`
   - Update `.env` file with your database credentials:
     ```env
     DB_CONNECTION=pgsql
     DB_HOST=127.0.0.1
     DB_PORT=5432
     DB_DATABASE=life_manager
     DB_USERNAME=postgres
     DB_PASSWORD=your_password
     ```

4. Add Groq API key to `.env`:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   GROQ_MODEL=llama3-70b-8192
   ```

5. Run migrations:
   ```bash
   php artisan migrate
   ```

6. Start the server:
   ```bash
   php artisan serve
   ```
   
   Backend will run at: http://localhost:8000

### Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure API URL in `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000/api
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```
   
   Frontend will run at: http://localhost:3000

## API Endpoints

### Tasks
- `GET /api/tasks/today` - Get today's tasks
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create a task
- `PUT /api/tasks/{id}` - Update a task
- `DELETE /api/tasks/{id}` - Delete a task

### Expenses
- `GET /api/expenses/7days` - Get last 7 days expenses
- `GET /api/expenses` - Get all expenses
- `POST /api/expenses` - Create an expense
- `PUT /api/expenses/{id}` - Update an expense
- `DELETE /api/expenses/{id}` - Delete an expense

### Study Goals
- `GET /api/study-goals` - Get all study goals
- `POST /api/study-goals` - Create a study goal
- `PUT /api/study-goals/{id}` - Update a study goal
- `DELETE /api/study-goals/{id}` - Delete a study goal

### AI Assistant
- `POST /api/assistant/chat` - Chat with AI
- `GET /api/assistant/daily-plan` - Generate daily plan
- `GET /api/assistant/daily-summary` - Generate daily summary

## Development Roadmap

See `life_manager_docs/MVP_TASKS_LIST.md` for the complete development checklist.

## Documentation

- [System Architecture](life_manager_docs/SYSTEM_ARCHITECTURE.md)
- [Database Schema](life_manager_docs/DB_SCHEMA.md)
- [API Specification](life_manager_docs/API_SPEC.md)
- [UI Design Guide](life_manager_docs/UI_DESIGN_GUIDE.md)
- [Deployment Guide](life_manager_docs/DEPLOY_GUIDE.md)

## License

MIT

## Author

Built with ❤️ for efficient life management
