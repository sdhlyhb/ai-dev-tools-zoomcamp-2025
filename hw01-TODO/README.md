# TaskFlow - Task Management Application

A modern, responsive task management web application built with Django. TaskFlow helps you organize, track, and complete your tasks efficiently with a clean, intuitive interface.



https://github.com/user-attachments/assets/4f6431f0-039e-450d-a56d-ed160fa2152d


## Features

### Core Functionality

- ✅ **Create, Read, Update, Delete (CRUD) Operations** - Full task management capabilities
- 📅 **Due Date Assignment** - Set deadlines for your tasks
- ✓ **Task Resolution Tracking** - Mark tasks as complete/incomplete
- ⏱️ **Real-time Countdown Timer** - See time remaining until due dates
- 🚨 **Overdue Detection** - Visual alerts for overdue tasks with pulsing animations
- 📊 **Task Statistics** - Track total, resolved, and pending tasks

### User Interface

- 🎨 **Modern Apple-inspired Design** - Clean blue gradient theme
- 📱 **Fully Responsive** - Works seamlessly on desktop, tablet, and mobile devices
- 🎭 **Dual View Modes** - Switch between card view and list view
- ♿ **Accessibility Optimized** - WCAG compliant with ARIA labels and keyboard navigation
- 🎯 **Smart Sorting** - Tasks sorted by due date (earliest first)

### Technical Features

- 🕐 **Timezone Aware** - Configured for EST (America/New_York)
- 💾 **SQLite Database** - Simple, file-based database
- 🎨 **Bootstrap 5** - Responsive CSS framework
- ⚡ **Real-time Updates** - Live countdown and date/time display

## Screenshots

### Card View

Tasks displayed in an organized card layout with visual indicators for status and urgency.
<img width="773" height="479" alt="TODOAPP-desktop" src="https://github.com/user-attachments/assets/a223df61-ce49-4b09-9f7e-36af19acb283" />
<img width="839" height="806" alt="Screenshot 2025-11-26 at 3 26 41 PM" src="https://github.com/user-attachments/assets/117f8041-aa48-498b-934c-435fe037c046" />


### List View

Tabular view for quick scanning of multiple tasks with all key information.
<img width="1170" height="725" alt="Screenshot 2025-11-26 at 3 30 35 PM 2" src="https://github.com/user-attachments/assets/654e1df9-f993-40da-8a87-59b97a003eb3" />


## Installation

### Prerequisites

- Python 3.9 or higher
- pip (Python package installer)
- Virtual environment (recommended)

### Setup Instructions

1. **Clone the repository** (if applicable)

   ```bash
   cd hw01-TODO
   ```

2. **Create and activate a virtual environment**

   ```bash
   python -m venv ../.venv
   source ../.venv/bin/activate  # On Windows: ..\.venv\Scripts\activate
   ```

3. **Install dependencies**

   ```bash
   pip install django
   ```

4. **Apply database migrations**

   ```bash
   python manage.py migrate
   ```

5. **Create a superuser** (optional, for admin access)

   ```bash
   python manage.py createsuperuser
   ```

6. **Run the development server**

   ```bash
   python manage.py runserver
   ```

7. **Open your browser**
   Navigate to: `http://127.0.0.1:8000/`

## Usage

### Creating a Task

1. Click the **"➕ Create New TODO"** button
2. Fill in the task details:
   - **Title** (required)
   - **Description** (optional)
   - **Due Date** (optional)
3. Click **Save** to create the task

### Managing Tasks

- **Mark as Complete**: Click the **"✓ Resolve"** button on any task
- **Edit Task**: Click the **Edit** button to modify task details
- **Delete Task**: Click the **Delete** button and confirm

### View Modes

- **Card View**: Visual cards showing task details with countdown timers
- **List View**: Compact table format for viewing many tasks at once
- Toggle between views using the buttons in the header

### Task Status Indicators

- **Green**: Task due in more than 3 days
- **Yellow**: Task due within 3 days
- **Red**: Task due within 24 hours
- **Pulsing Red**: Task is overdue (with alarmed animation)
- **Strikethrough**: Task is marked as resolved

## Project Structure

```
hw01-TODO/
├── manage.py                 # Django management script
├── myproject/               # Project configuration
│   ├── settings.py          # Django settings (TIME_ZONE: America/New_York)
│   ├── urls.py              # Main URL routing
│   └── wsgi.py              # WSGI configuration
├── myapp/                   # Main application
│   ├── models.py            # Todo data model
│   ├── views.py             # View functions
│   ├── forms.py             # TodoForm definition
│   ├── urls.py              # App URL patterns
│   ├── admin.py             # Admin interface configuration
│   ├── templates/myapp/     # HTML templates
│   │   ├── base.html        # Base template with navigation
│   │   ├── todo_list.html   # Main task list page
│   │   ├── todo_form.html   # Create/edit form
│   │   └── todo_confirm_delete.html  # Delete confirmation
│   └── migrations/          # Database migrations
└── db.sqlite3              # SQLite database
```

## Database Schema

### Todo Model

| Field       | Type          | Description                          |
| ----------- | ------------- | ------------------------------------ |
| id          | Integer       | Primary key (auto-generated)         |
| title       | CharField     | Task title (max 200 characters)      |
| description | TextField     | Detailed description (optional)      |
| due_date    | DateTimeField | Task deadline (optional)             |
| is_resolved | BooleanField  | Completion status (default: False)   |
| created_at  | DateTimeField | Creation timestamp (auto-generated)  |
| updated_at  | DateTimeField | Last update timestamp (auto-updated) |

## Configuration

### Timezone Settings

The application is configured for Eastern Time (EST/EDT):

```python
TIME_ZONE = 'America/New_York'
USE_TZ = True
```

### Admin Interface

Access the Django admin panel at `http://127.0.0.1:8000/admin/` to:

- View all tasks in a searchable, filterable interface
- Bulk edit tasks
- View creation and update timestamps
- Filter by resolved status and due date

## Accessibility Features

TaskFlow is built with accessibility in mind:

- ✓ **Semantic HTML5** landmarks (nav, main, footer)
- ✓ **ARIA labels** on all interactive elements
- ✓ **Keyboard navigation** support
- ✓ **Skip to content** link for screen readers
- ✓ **High contrast** colors (WCAG AA compliant)
- ✓ **Focus indicators** for keyboard users
- ✓ **Live regions** for dynamic content updates

## Browser Support

TaskFlow works on all modern browsers:

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Technologies Used

- **Backend**: Django 4.2.26
- **Database**: SQLite 3
- **Frontend**: HTML5, CSS3, JavaScript (ES6)
- **CSS Framework**: Bootstrap 5.3.0
- **Icons**: Unicode emoji and SVG
- **Fonts**: System fonts (-apple-system, BlinkMacSystemFont, Segoe UI)

## Development

### Running Tests

```bash
python manage.py test
```

### Creating Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### Clearing Database

```bash
python manage.py shell -c "from myapp.models import Todo; Todo.objects.all().delete()"
```

## Future Enhancements

Potential features for future versions:

- 🔐 User authentication and multi-user support
- 🏷️ Task categories and tags
- 🔍 Search and filtering capabilities
- 📧 Email notifications for upcoming deadlines
- 📱 Progressive Web App (PWA) support
- 🌙 Dark mode toggle
- 📊 Analytics and productivity insights
- 🔄 Task recurrence/repeat functionality

## Contributing

This is a homework project for AI Dev Tools Zoomcamp 2025. Feel free to fork and modify for your own use.

## License

This project is created for educational purposes as part of the AI Dev Tools Zoomcamp 2025.

## Acknowledgments

- Built with ❤️ for AI Dev Tools Zoomcamp 2025
- Design inspired by Apple's Human Interface Guidelines
- Bootstrap for responsive components

---

**TaskFlow** - Streamline your tasks, amplify your productivity
