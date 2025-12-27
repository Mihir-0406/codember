<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo isset($page_title) ? $page_title . ' - ' : ''; ?><?php echo APP_NAME; ?></title>
    <link rel="stylesheet" href="<?php echo BASE_URL; ?>assets/css/style.css">
</head>
<body>
    <header class="main-header">
        <div class="header-content">
            <a href="<?php echo BASE_URL; ?>views/dashboard.php" class="logo">⚙️ <?php echo APP_NAME; ?></a>
            
            <nav>
                <ul class="nav-menu">
                    <li><a href="<?php echo BASE_URL; ?>views/dashboard.php">Dashboard</a></li>
                    <li><a href="<?php echo BASE_URL; ?>views/equipment/list.php">Equipment</a></li>
                    <li><a href="<?php echo BASE_URL; ?>views/requests/kanban.php">Kanban Board</a></li>
                    <li><a href="<?php echo BASE_URL; ?>views/requests/calendar.php">Calendar</a></li>
                    <?php if (hasRole(ROLE_ADMIN) || hasRole(ROLE_MANAGER)): ?>
                        <li><a href="<?php echo BASE_URL; ?>views/teams/list.php">Teams</a></li>
                    <?php endif; ?>
                </ul>
            </nav>
            
            <div class="user-info">
                <div class="user-avatar"><?php echo $_SESSION['avatar_initials']; ?></div>
                <div>
                    <div style="font-weight: 600;"><?php echo $_SESSION['full_name']; ?></div>
                    <div style="font-size: 0.85rem; opacity: 0.8;"><?php echo ucfirst(str_replace('_', ' ', $_SESSION['role'])); ?></div>
                </div>
                <a href="<?php echo BASE_URL; ?>views/auth/logout.php" class="btn btn-secondary btn-sm">Logout</a>
            </div>
        </div>
    </header>
    
    <main>
