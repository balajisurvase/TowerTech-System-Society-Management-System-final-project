<?php
require_once 'config.php';

if (!isLoggedIn()) {
    redirect('index.php');
}

$activeTab = 'dashboard';
$user = $_SESSION['user'];
$isAdmin = isAdmin();

// Fetch Stats
$stats = [
    'residents' => 0,
    'complaints' => 0,
    'bookings' => 0,
    'maintenance' => 0
];

if ($isAdmin) {
    $res = supabaseRequest('GET', 'resident?select=count', null);
    $stats['residents'] = $res['data'][0]['count'] ?? 0;
    
    $res = supabaseRequest('GET', 'complaint?status=eq.Pending&select=count', null);
    $stats['complaints'] = $res['data'][0]['count'] ?? 0;

    $res = supabaseRequest('GET', 'booking?status=eq.Pending&select=count', null);
    $stats['bookings'] = $res['data'][0]['count'] ?? 0;
} else {
    $res = supabaseRequest('GET', 'complaint?resident_id=eq.' . $user['resident_id'] . '&select=count', null);
    $stats['complaints'] = $res['data'][0]['count'] ?? 0;

    $res = supabaseRequest('GET', 'booking?resident_id=eq.' . $user['resident_id'] . '&select=count', null);
    $stats['bookings'] = $res['data'][0]['count'] ?? 0;

    $res = supabaseRequest('GET', 'maintenance?resident_id=eq.' . $user['resident_id'] . '&status=eq.Unpaid&select=count', null);
    $stats['maintenance'] = $res['data'][0]['count'] ?? 0;
}

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - TowerTech</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; }
    </style>
</head>
<body class="bg-[#F8FAFC] text-slate-900">
    <div class="flex min-h-screen">
        <?php include 'sidebar.php'; ?>

        <main class="flex-1 flex flex-col min-w-0">
            <?php include 'header.php'; ?>

            <div class="flex-1 p-8">
                <div class="mb-10">
                    <h1 class="text-3xl font-black text-slate-900 tracking-tight mb-2">
                        Hello, <span class="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600"><?php echo $user['name']; ?>!</span>
                    </h1>
                    <p class="text-slate-500 font-bold">Welcome to your TowerTech <?php echo $isAdmin ? 'Admin' : 'Resident'; ?> Dashboard.</p>
                </div>

                <!-- Stats Grid -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    <?php if ($isAdmin): ?>
                    <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                        <div class="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><polyline points="16 11 18 13 22 9"></polyline></svg>
                        </div>
                        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Residents</p>
                        <p class="text-2xl font-black text-slate-900"><?php echo $stats['residents']; ?></p>
                    </div>
                    <?php endif; ?>

                    <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                        <div class="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 21 1.9-1.9"></path><path d="M20.2 20.2 22 22"></path><path d="m20 7 2 2"></path><path d="M2 9.5V2h7.5"></path><path d="m10.5 22.5.3-3.9c.1-.6.3-1.1.7-1.5l7.2-7.2c.8-.8 2.1-.8 2.9 0l1.3 1.3c.8.8.8 2.1 0 2.9l-7.2 7.2c-.4.4-.9.6-1.5.7l-3.9.3c-.3 0-.6-.1-.8-.3-.2-.2-.3-.5-.3-.8Z"></path></svg>
                        </div>
                        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1"><?php echo $isAdmin ? 'Pending Complaints' : 'My Complaints'; ?></p>
                        <p class="text-2xl font-black text-slate-900"><?php echo $stats['complaints']; ?></p>
                    </div>

                    <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                        <div class="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path></svg>
                        </div>
                        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1"><?php echo $isAdmin ? 'Pending Bookings' : 'My Bookings'; ?></p>
                        <p class="text-2xl font-black text-slate-900"><?php echo $stats['bookings']; ?></p>
                    </div>

                    <?php if (!$isAdmin): ?>
                    <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                        <div class="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                        </div>
                        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Unpaid Bills</p>
                        <p class="text-2xl font-black text-slate-900"><?php echo $stats['maintenance']; ?></p>
                    </div>
                    <?php endif; ?>
                </div>

                <!-- Quick Actions / Recent Activity -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div class="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                        <h3 class="text-xl font-bold text-slate-900 mb-6">Quick Actions</h3>
                        <div class="grid grid-cols-2 gap-4">
                            <?php if ($isAdmin): ?>
                            <a href="residents.php" class="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all group">
                                <div class="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm mb-3 group-hover:scale-110 transition-transform">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="19" y1="8" x2="19" y2="14"></line><line x1="16" y1="11" x2="22" y2="11"></line></svg>
                                </div>
                                <p class="text-sm font-bold text-slate-700">Add Resident</p>
                            </a>
                            <a href="maintenance.php" class="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all group">
                                <div class="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm mb-3 group-hover:scale-110 transition-transform">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                                </div>
                                <p class="text-sm font-bold text-slate-700">Generate Bill</p>
                            </a>
                            <?php else: ?>
                            <a href="complaints.php" class="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all group">
                                <div class="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm mb-3 group-hover:scale-110 transition-transform">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                                </div>
                                <p class="text-sm font-bold text-slate-700">File Complaint</p>
                            </a>
                            <a href="amenities.php" class="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all group">
                                <div class="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm mb-3 group-hover:scale-110 transition-transform">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                </div>
                                <p class="text-sm font-bold text-slate-700">Book Amenity</p>
                            </a>
                            <?php endif; ?>
                        </div>
                    </div>

                    <div class="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                        <h3 class="text-xl font-bold text-slate-900 mb-6">System Status</h3>
                        <div class="space-y-4">
                            <div class="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                                <div class="flex items-center gap-3">
                                    <div class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                    <span class="text-sm font-bold text-emerald-700">Database Connected</span>
                                </div>
                                <span class="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Supabase</span>
                            </div>
                            <div class="flex items-center justify-between p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                                <div class="flex items-center gap-3">
                                    <div class="w-2 h-2 bg-indigo-500 rounded-full"></div>
                                    <span class="text-sm font-bold text-indigo-700">API Gateway Active</span>
                                </div>
                                <span class="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">REST v1</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </div>
</body>
</html>
