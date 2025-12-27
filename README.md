# GearGuard - Maintenance Management System

![GearGuard Logo](https://via.placeholder.com/150x150.png?text=GearGuard)

A comprehensive web-based Maintenance Management System built with core PHP, MySQL, HTML/CSS, and vanilla JavaScript. Designed for hackathon-grade quality with enterprise-level features.

## 🚀 Features

### 📋 Core Functionality
- **Role-Based Access Control**: Admin, Manager, Technician, and Normal User roles
- **Equipment Management**: Complete CRUD operations with detailed tracking
- **Maintenance Teams**: Team creation and technician assignment
- **Maintenance Requests**: Corrective (breakdown) and Preventive (scheduled) maintenance
- **State Flow Management**: Strict workflow (New → In Progress → Repaired/Scrap)
- **Auto-fill Logic**: Automatic team and technician assignment based on equipment defaults

### 🎨 User Interface
- **Kanban Board**: Drag-and-drop interface with real-time AJAX updates
- **Calendar View**: Visual scheduling for preventive maintenance
- **Dashboard**: Role-specific overview with statistics and quick actions
- **Responsive Design**: Clean, modern interface that works on all devices

### 🔒 Security & Best Practices
- **Prepared Statements**: Protection against SQL injection
- **Password Hashing**: Secure password storage with PHP password_hash
- **Session Management**: Secure authentication and authorization
- **Input Validation**: Server-side validation for all user inputs
- **Sanitization**: XSS protection through input sanitization

### 🔧 Advanced Features
- **Equipment Scrap Logic**: Automatic status updates and request blocking
- **Overdue Indicators**: Visual alerts for late maintenance on Kanban board
- **Duration Tracking**: Automatic calculation of maintenance duration
- **Open Request Badge**: Live count of pending maintenance per equipment
- **Team Restrictions**: Only assigned technicians can work on related requests

## 📁 Project Structure

```
Oddo heckathon/
├── assets/
│   └── css/
│       └── style.css          # Main stylesheet
├── config/
│   ├── config.php             # Application configuration
│   └── database.php           # Database connection (singleton)
├── database/
│   └── schema.sql             # Database schema and sample data
├── models/
│   ├── Equipment.php          # Equipment model
│   ├── MaintenanceRequest.php # Request model with state flow
│   ├── MaintenanceTeam.php    # Team model
│   └── User.php               # User model with authentication
├── views/
│   ├── auth/
│   │   ├── login.php          # Login page
│   │   └── logout.php         # Logout handler
│   ├── equipment/
│   │   ├── create.php         # Add equipment
│   │   ├── edit.php           # Edit equipment
│   │   ├── list.php           # Equipment list with filters
│   │   └── view.php           # Equipment details + maintenance button
│   ├── requests/
│   │   ├── calendar.php       # Calendar view (preventive only)
│   │   ├── create.php         # Create request with auto-fill
│   │   ├── kanban.php         # Kanban board with drag-drop
│   │   ├── update_state.php   # AJAX state update handler
│   │   └── view.php           # Request details with state change
│   ├── teams/
│   │   ├── create.php         # Create team
│   │   ├── edit.php           # Edit team
│   │   ├── list.php           # Team list
│   │   └── view.php           # Team details + member management
│   ├── includes/
│   │   ├── header.php         # Common header
│   │   └── footer.php         # Common footer
│   └── dashboard.php          # Main dashboard
└── index.php                  # Entry point
```

## 🛠️ Installation Guide

### Prerequisites
- XAMPP (or LAMP/WAMP/MAMP)
- PHP 7.4 or higher
- MySQL 5.7 or higher
- Modern web browser

### Step 1: Install XAMPP
1. Download XAMPP from [https://www.apachefriends.org](https://www.apachefriends.org)
2. Install XAMPP to default location (e.g., `C:\xampp` on Windows)
3. Start Apache and MySQL from XAMPP Control Panel

### Step 2: Setup Database
1. Open phpMyAdmin: [http://localhost/phpmyadmin](http://localhost/phpmyadmin)
2. Click "New" to create a database or use the SQL tab
3. Copy the entire content of `database/schema.sql`
4. Paste into phpMyAdmin SQL tab and execute
5. This creates the `gearguard` database with sample data

### Step 3: Configure Application
1. The project is already in `C:\Users\HP\Downloads\Oddo heckathon`
2. Open `config/database.php` and verify settings:
   ```php
   private $host = "localhost";
   private $db_name = "gearguard";
   private $username = "root";
   private $password = "";
   ```

### Step 4: Access Application
1. Open your browser and navigate to:
   ```
   http://localhost/Oddo%20heckathon/
   ```
2. You'll be redirected to the login page

## 👥 Demo Credentials

### Administrator
- **Username**: `admin`
- **Password**: `admin123`
- **Access**: Full system access including user management

### Manager
- **Username**: `manager1`
- **Password**: `admin123`
- **Access**: Equipment, teams, and request management

### Technician
- **Username**: `tech1` or `tech2`
- **Password**: `admin123`
- **Access**: View assignments, update request states

### Normal User
- **Username**: `user1`
- **Password**: `admin123`
- **Access**: View equipment and create requests

## 📊 Database Schema

### Users Table
- Stores user credentials and role information
- Fields: id, username, email, password, full_name, role, avatar_initials

### Equipment Table
- Complete equipment tracking with all required fields
- Fields: name, serial_number (unique), category, department, assigned_employee, purchase_date, warranty_expiry, physical_location, default_maintenance_team_id, default_technician_id, status

### Maintenance Teams Table
- Team management for organized maintenance
- Fields: id, name, description

### Team Members Table
- Junction table for many-to-many relationship
- Fields: team_id, user_id (only technicians)

### Maintenance Requests Table
- Core request management with state flow
- Fields: equipment_id, request_type, title, description, priority, state, maintenance_team_id, assigned_technician_id, scheduled_date, started_at, completed_at, duration_minutes, notes

## 🎯 Key Workflows

### Creating Equipment
1. Navigate to Equipment → Add Equipment
2. Fill required fields (name, serial number, category, department)
3. Assign default maintenance team and technician
4. Equipment is now trackable in the system

### Creating Maintenance Request
1. Click "New Request" from dashboard or equipment detail page
2. Select equipment (team and technician auto-fill)
3. Choose type: Corrective (breakdown) or Preventive (scheduled)
4. For preventive, select scheduled date
5. Request enters "New" state

### State Flow Management
1. **New → In Progress**: Technician starts work (auto-records start time)
2. **In Progress → Repaired**: Work completed successfully (auto-calculates duration)
3. **In Progress → Scrap**: Equipment beyond repair (auto-marks equipment as scrapped)

**Validation Rules:**
- Cannot skip states
- Cannot close without starting
- Scrapped equipment blocks future requests

### Using Kanban Board
1. View all requests organized by state columns
2. Drag and drop cards between columns (validates transitions)
3. Red highlight indicates overdue scheduled maintenance
4. Technician avatars show assignments
5. Click any card to view full details

### Calendar Scheduling
1. Navigate to Calendar view (shows preventive maintenance only)
2. Browse months using navigation arrows
3. Click any date to schedule new preventive maintenance
4. Select equipment from dropdown
5. Request is created with selected date

## 🔐 Security Features

### Authentication
- Password hashing using `PASSWORD_DEFAULT` (bcrypt)
- Session-based authentication
- Automatic logout on session expiry

### Authorization
- Role-based access control (RBAC)
- Middleware functions: `requireLogin()`, `requireRole()`
- Page-level access restrictions

### Data Protection
- Prepared statements for all database queries
- Input sanitization using `htmlspecialchars()` and `strip_tags()`
- SQL injection prevention
- XSS attack prevention

## 🎨 UI/UX Highlights

### Design Principles
- Clean, modern interface with consistent styling
- Intuitive navigation with breadcrumbs
- Color-coded badges for quick status recognition
- Responsive layout for mobile and desktop

### User Experience
- Auto-fill logic reduces data entry
- Inline validation with helpful error messages
- Confirmation dialogs for destructive actions
- Toast notifications for success/error feedback
- Loading states for async operations

## 🚀 Performance Optimizations

- Singleton database connection pattern
- Efficient SQL queries with proper indexing
- Minimal JavaScript for fast page loads
- CSS organized by component
- Lazy loading for calendar events

## 📝 Code Quality

### Best Practices
- Clear, descriptive function and variable names
- Comprehensive inline comments
- Consistent code formatting
- Separation of concerns (MVC pattern)
- DRY (Don't Repeat Yourself) principle

### Documentation
- PHPDoc comments for all functions
- SQL schema with descriptive comments
- README with complete setup instructions
- Inline explanations for complex logic

## 🧪 Testing Recommendations

### Manual Testing Checklist
1. ✅ Login with all user roles
2. ✅ Create equipment with all fields
3. ✅ Create both corrective and preventive requests
4. ✅ Test state flow transitions (valid and invalid)
5. ✅ Drag-drop on Kanban board
6. ✅ Schedule maintenance via calendar
7. ✅ Verify equipment scrap logic
8. ✅ Check open request badge count
9. ✅ Test team member assignments
10. ✅ Verify auto-fill on request creation

## 🔧 Troubleshooting

### Database Connection Issues
- Verify MySQL is running in XAMPP Control Panel
- Check database credentials in `config/database.php`
- Ensure database name is `gearguard`

### Page Not Found (404)
- Verify URL: `http://localhost/Oddo%20heckathon/`
- Check that files are in correct htdocs location
- Ensure Apache is running in XAMPP

### Login Not Working
- Verify database was created with schema.sql
- Check that users table has sample data
- Clear browser cache and cookies

### Permission Denied
- Check user role in database
- Verify session is active
- Try logging out and logging back in

## 📚 Technology Stack

- **Backend**: Core PHP 7.4+
- **Database**: MySQL 5.7+ with InnoDB engine
- **Frontend**: HTML5, CSS3 (custom design)
- **JavaScript**: Vanilla JS (no frameworks)
- **Server**: Apache (via XAMPP)
- **Architecture**: MVC pattern with separation of concerns

## 🎓 Learning Outcomes

This project demonstrates:
- Enterprise-level PHP application architecture
- Secure authentication and authorization
- Complex state machine implementation
- Real-time UI updates with AJAX
- Drag-and-drop functionality
- Calendar integration
- Normalized database design
- RESTful-style routing
- Clean code practices

## 🏆 Hackathon-Ready Features

✅ **Complete Functionality**: All requirements implemented
✅ **Professional UI**: Modern, intuitive design
✅ **Production-Ready Code**: Security, validation, error handling
✅ **Comprehensive Documentation**: README, inline comments
✅ **Demo Data**: Pre-populated for immediate testing
✅ **Role-Based Demo**: Multiple user types for presentation
✅ **Visual Appeal**: Kanban board, calendar, dashboard
✅ **Business Logic**: Real-world workflow validation

## 📞 Support

For issues or questions:
1. Check this README for troubleshooting
2. Verify all installation steps were followed
3. Check XAMPP error logs in `xampp/apache/logs/error.log`
4. Review inline code comments for logic explanations

## 📄 License

This project is created for educational and hackathon purposes.

---

**Built with ❤️ for GearGuard Maintenance Management System**

*A complete, production-ready maintenance management solution demonstrating modern PHP development practices and enterprise-level features.*
