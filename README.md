# Life Manager AI

> **AI-Powered Personal Productivity & Life Management System**

A comprehensive full-stack application built in 7 days as an MVP to help manage tasks, expenses, study goals, and daily life with AI-powered insights and memory system.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Tests](https://img.shields.io/badge/tests-39%20passed-success)
![Laravel](https://img.shields.io/badge/Laravel-10.x-red)
![Next.js](https://img.shields.io/badge/Next.js-15.1-black)

---

## 🎯 Features

### ✅ Task Management
- Create, read, update, delete tasks
- Priority levels (High, Medium, Low)
- Due date & time tracking
- Estimated time in minutes
- Quick toggle completion status
- Filter by priority and status
- Today's tasks view

### 💰 Expense Tracking
- Track daily expenses with categories
- 7-day expense overview
- Category-wise breakdown
- Interactive charts (Bar & Pie)
- Edit/Delete functionality
- Vietnamese currency formatting

### 📚 Study Goals
- Create and track learning goals
- Progress tracking (0-100%)
- Deadline management
- Visual progress bars with color indicators
- Days until deadline countdown

### 🤖 AI Assistant
- Chat interface with Groq AI (llama-3.3-70b-versatile)
- Context-aware responses
- Daily planning suggestions
- Daily summary generation
- Conversation history

### 🧠 Memory System
- Daily logs with AI feedback
- Long-term memory storage
- User preferences tracking
- Habit pattern analysis
- Productivity insights

### 📊 Dashboard
- Comprehensive overview
- KPI cards (Tasks, Completion Rate, Expenses, Memories)
- Pending tasks widget
- Expense trend charts
- Memory timeline
- Quick action buttons

---

## 🛠️ Tech Stack

### Backend
- **Framework:** Laravel 10.x
- **Database:** PostgreSQL
- **Testing:** PHPUnit (39 tests, 105 assertions)
- **AI Integration:** Groq API
- **API:** RESTful endpoints

### Frontend
- **Framework:** Next.js 15.1 (App Router)
- **UI Library:** Shadcn UI
- **Styling:** Tailwind CSS v4 (CSS-based config)
- **Charts:** Chart.js + react-chartjs-2
- **Icons:** Lucide React
- **Font:** Inter

### Design System
- Minimalist professional design (Linear/Notion-inspired)
- Dark mode support (class strategy)
- HSL color system for theming
- Consistent component patterns

---

## 📁 Project Structure

```
LIFE_MANAGER/
├── backend/                    # Laravel API
│   ├── app/
│   │   ├── Http/Controllers/  # API Controllers
│   │   ├── Models/            # Eloquent Models
│   │   └── Services/          # Business Logic
│   ├── database/
│   │   ├── migrations/        # Database schema
│   │   ├── seeders/           # Sample data
│   │   └── factories/         # Test data generators
│   ├── routes/api.php         # API routes
│   └── tests/Feature/         # 39 passing tests
│
├── frontend/                   # Next.js App
│   ├── src/
│   │   ├── app/               # App Router pages
│   │   │   ├── dashboard/
│   │   │   ├── tasks/
│   │   │   ├── expenses/
│   │   │   ├── study-goals/
│   │   │   └── assistant/
│   │   ├── components/        # Shadcn UI components
│   │   └── lib/               # Utilities & API client
│   └── public/
│
└── life_manager_docs/          # Documentation
    ├── MVP_TASKS_LIST.md
    ├── SYSTEM_ARCHITECTURE.md
    ├── DB_SCHEMA.md
    └── ...
```

---

## 🚀 Quick Start

### Prerequisites
- PHP 8.1+
- Composer
- PostgreSQL 14+
- Node.js 18+
- npm/yarn

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/DattruongRyan1912/LIFE-MANAGER.git
   cd LIFE-MANAGER/backend
   ```

2. **Install dependencies**
   ```bash
   composer install
   ```

3. **Environment configuration**
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

4. **Configure database in `.env`**
   ```env
   DB_CONNECTION=pgsql
   DB_HOST=127.0.0.1
   DB_PORT=5432
   DB_DATABASE=life_manager
   DB_USERNAME=your_username
   DB_PASSWORD=your_password
   ```

5. **Configure Groq API (optional)**
   ```env
   GROQ_API_KEY=your_groq_api_key
   ```

6. **Run migrations and seeders**
   ```bash
   php artisan migrate
   php artisan db:seed
   ```

7. **Start development server**
   ```bash
   php artisan serve
   # API will be available at http://localhost:8000
   ```

### Frontend Setup

1. **Navigate to frontend**
   ```bash
   cd ../frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   # App will be available at http://localhost:3000
   ```

---

## 🧪 Testing

Run backend tests:
```bash
cd backend
php artisan test
```

**Test Coverage:**
- ✅ 39 tests passed
- ✅ 105 assertions
- ✅ All features covered

---

## 📊 API Endpoints

### Tasks
- `GET /api/tasks/today` - Get today's tasks
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create task
- `PUT /api/tasks/{id}` - Update task
- `PATCH /api/tasks/{id}/toggle` - Toggle completion
- `DELETE /api/tasks/{id}` - Delete task

### Expenses
- `GET /api/expenses/7days` - Get last 7 days expenses
- `GET /api/expenses` - Get all expenses
- `POST /api/expenses` - Create expense
- `PUT /api/expenses/{id}` - Update expense
- `DELETE /api/expenses/{id}` - Delete expense

### Study Goals
- `GET /api/study-goals` - Get all goals
- `POST /api/study-goals` - Create goal
- `PUT /api/study-goals/{id}` - Update goal
- `DELETE /api/study-goals/{id}` - Delete goal

### AI Assistant
- `POST /api/assistant/chat` - Chat with AI
- `GET /api/assistant/daily-plan` - Get daily plan
- `GET /api/assistant/daily-summary` - Get daily summary

### Memory System
- `GET /api/memories/daily-logs` - Get daily logs
- `GET /api/memories/long-term` - Get all memories
- `GET /api/memories/long-term/{key}` - Get specific memory

### Dashboard
- `GET /api/dashboard/summary` - Get comprehensive summary

---

## 📅 Development Timeline (7 Days)

- **DAY 1:** Laravel + PostgreSQL setup, migrations
- **DAY 2:** Task CRUD, Shadcn UI integration, Design system
- **DAY 3:** Expense module, Chart.js visualization, Tests
- **DAY 4:** AI Assistant with Groq API, Tests with mocks
- **DAY 5:** Memory system (DailyLog, LongTermMemory)
- **DAY 6:** Dashboard with KPI cards, widgets, charts
- **DAY 7:** Study Goals, Polish, Edit/Delete UI, Toggle endpoint

---

## 🎨 Design Principles

- **Minimalism:** Clean, distraction-free interface
- **Consistency:** Uniform component patterns
- **Accessibility:** Proper contrast ratios, keyboard navigation
- **Responsiveness:** Mobile-first approach
- **Performance:** Optimistic UI updates, efficient queries

---

## 🔒 Security

- Laravel validation on all inputs
- CORS configuration
- API rate limiting (if needed in production)
- Environment variables for sensitive data
- SQL injection protection via Eloquent ORM

---

## 📝 License

MIT License - see LICENSE file for details

---

## 👨‍💻 Author

**Ryan Truong**
- GitHub: [@DattruongRyan1912](https://github.com/DattruongRyan1912)
- Email: dat01202642582@gmail.com

---

## 🙏 Acknowledgments

- [Laravel](https://laravel.com/) - Backend framework
- [Next.js](https://nextjs.org/) - React framework
- [Shadcn UI](https://ui.shadcn.com/) - Component library
- [Groq](https://groq.com/) - AI API
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Chart.js](https://www.chartjs.org/) - Data visualization

---

## 📸 Screenshots

_Coming soon - Add screenshots of your application here_

---

## 🚧 Future Enhancements

- [ ] User authentication & multi-user support
- [ ] Email notifications
- [ ] Mobile app (React Native)
- [ ] Export data (PDF/CSV)
- [ ] Calendar integration
- [ ] Pomodoro timer
- [ ] Habit tracker
- [ ] Budget planning
- [ ] Deployment guides

---

**Built with ❤️ in 7 days**
