# 🚀 GearGuard Quick Setup Guide

## Step-by-Step Installation (5 Minutes)

### 1️⃣ Start XAMPP
1. Open XAMPP Control Panel
2. Click **Start** next to Apache
3. Click **Start** next to MySQL
4. Wait for both to show green "Running" status

### 2️⃣ Create Database
1. Open browser and go to: `http://localhost/phpmyadmin`
2. Click **SQL** tab at the top
3. Open the file: `database/schema.sql` in Notepad
4. Copy ALL the content (Ctrl+A, Ctrl+C)
5. Paste into the SQL box in phpMyAdmin
6. Click **Go** button
7. You should see "Database gearguard created successfully"

### 3️⃣ Access the Application
1. Open browser and navigate to:
   ```
   http://localhost/Oddo%20heckathon/
   ```
2. You will see the login page

### 4️⃣ Login
Use any of these credentials:

**Admin Access:**
- Username: `admin`
- Password: `admin123`

**Manager Access:**
- Username: `manager1`
- Password: `admin123`

**Technician Access:**
- Username: `tech1`
- Password: `admin123`

---

## ✅ Verification Checklist

After setup, verify these features work:

- [ ] Login with admin credentials
- [ ] Dashboard shows statistics
- [ ] Equipment list displays 5 sample items
- [ ] Kanban board shows requests in columns
- [ ] Calendar view displays (use arrow buttons to navigate)
- [ ] Create new equipment works
- [ ] Create new maintenance request works
- [ ] Drag-drop on Kanban updates state

---

## 🎯 Quick Feature Tour

### Dashboard
- **Location**: First page after login
- **Features**: Statistics, quick actions, recent requests
- **Try**: Click on any stat card to navigate to that section

### Equipment Management
1. Click **Equipment** in top menu
2. See list with filters for status, category, department
3. Click **View** on any equipment
4. Notice the **Maintenance** button with badge showing open requests

### Kanban Board
1. Click **Kanban Board** in menu
2. See 4 columns: New, In Progress, Repaired, Scrap
3. **Try dragging** a card from "New" to "In Progress"
4. Notice red highlight on overdue requests
5. Click any card to see full details

### Calendar View
1. Click **Calendar** in menu
2. See only Preventive maintenance requests
3. Click any empty date
4. Modal opens to schedule new preventive maintenance
5. Select equipment and click Schedule

### Create Request (Auto-fill Demo)
1. Go to Equipment → View any equipment
2. Click **+ New Request** button
3. Notice team and technician are pre-filled
4. Change equipment and watch fields update automatically

---

## 🎨 Key UI Elements

### Color-Coded Badges
- 🔵 Blue = Preventive maintenance / New requests
- 🟡 Yellow = Corrective maintenance / In Progress
- 🟢 Green = Repaired / Active
- 🔴 Red = Scrapped / Critical

### Technician Avatars
- Small circles with initials
- Appear on Kanban cards
- Show who's assigned to each request

### State Flow Indicators
The system enforces this workflow:
```
New → In Progress → Repaired
                 → Scrap (marks equipment as scrapped)
```

---

## 🔥 Demo Scenarios

### Scenario 1: Complete Maintenance Flow
1. Login as `tech1` (technician)
2. Go to Kanban Board
3. Find request #3 (should be "In Progress")
4. Drag it to "Repaired" column
5. View the request to see auto-calculated duration

### Scenario 2: Equipment Scrap Flow
1. Login as `admin`
2. Go to Kanban Board
3. Create a new request for any equipment
4. Move the request from New → In Progress → Scrap
5. Go to Equipment list
6. Notice that equipment is now marked as "Scrapped"
7. Try to create a new request for it (should be blocked)

### Scenario 3: Calendar Scheduling
1. Click Calendar in menu
2. Navigate to next month
3. Click on a future date (e.g., 15th)
4. Select an equipment
5. Click Schedule
6. See the event appear on calendar

---

## 🛠️ Troubleshooting

### "Can't connect to database"
- ✅ Check MySQL is running in XAMPP (green light)
- ✅ Verify database name is `gearguard` in phpMyAdmin
- ✅ Check config/database.php has correct credentials

### "Page not found"
- ✅ Verify URL is exactly: `http://localhost/Oddo%20heckathon/`
- ✅ Check files are in `C:\xampp\htdocs\Oddo heckathon\`
- ✅ Ensure Apache is running

### "Invalid username or password"
- ✅ Use exact credentials from above (case-sensitive)
- ✅ Verify users table exists in database
- ✅ Check you ran the schema.sql completely

### Drag-drop not working
- ✅ Make sure you're logged in
- ✅ Only valid transitions are allowed (see state flow above)
- ✅ Try refreshing the page

---

## 📊 Sample Data Included

The database comes pre-loaded with:
- ✅ 5 users (all roles)
- ✅ 4 maintenance teams
- ✅ 5 pieces of equipment
- ✅ 5 maintenance requests in different states
- ✅ Team member assignments

This lets you test immediately without creating data!

---

## 🎯 What to Showcase

For demos/presentations, highlight:

1. **Role-based Access**: Login as different users to show permissions
2. **Kanban Board**: Drag-and-drop with validation
3. **Auto-fill Logic**: Create request and watch team auto-populate
4. **State Flow Enforcement**: Try invalid transitions to show validation
5. **Scrap Workflow**: Move request to scrap and show equipment blocking
6. **Calendar View**: Visual scheduling for preventive maintenance
7. **Equipment Detail**: Maintenance button with live badge count
8. **Dashboard**: Role-specific views and statistics

---

## 📈 System Capabilities

- ✅ Multi-user with 4 distinct roles
- ✅ Complete equipment lifecycle management
- ✅ Dual maintenance types (Corrective + Preventive)
- ✅ Strict workflow enforcement with validation
- ✅ Real-time AJAX updates
- ✅ Drag-and-drop interface
- ✅ Calendar-based scheduling
- ✅ Team-based work assignment
- ✅ Automatic duration calculation
- ✅ Overdue request indicators
- ✅ Equipment scrap tracking
- ✅ Comprehensive reporting

---

## 🎓 Technical Highlights

**Architecture:**
- MVC pattern (Model-View-Controller)
- Singleton database connection
- Prepared statements (SQL injection protection)
- Session-based authentication
- Role-based authorization

**Frontend:**
- Vanilla JavaScript (no frameworks)
- CSS Grid and Flexbox
- Responsive design
- AJAX for async operations

**Backend:**
- Core PHP (no frameworks)
- Object-oriented models
- Clean separation of concerns
- RESTful-style endpoints

---

## 💡 Tips for Best Demo

1. **Start with Dashboard** - Shows overview
2. **Show Kanban** - Most visual feature
3. **Demo Auto-fill** - Unique functionality
4. **Try Calendar** - Interactive scheduling
5. **Explain State Flow** - Business logic enforcement
6. **Show Scrap Logic** - Complete workflow
7. **Highlight Security** - Prepared statements, validation

---

## 📞 Need Help?

1. Read the full README.md
2. Check inline code comments
3. Review database schema comments
4. Test with sample data first
5. Verify XAMPP services are running

---

**🎉 You're ready to go! Start by logging in as `admin` with password `admin123`**

The system is fully functional with sample data, so you can immediately explore all features without any additional setup!
