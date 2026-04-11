<?php
// sidebar.php
$activeTab = isset($activeTab) ? $activeTab : 'dashboard';
$isAdmin = isAdmin();
?>
<aside class="w-64 bg-slate-900 text-slate-400 flex flex-col h-screen sticky top-0">
    <div class="p-6">
        <div class="flex items-center gap-3 mb-10">
            <div class="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-900/20">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 6h.01"></path><path d="M16 6h.01"></path><path d="M8 10h.01"></path><path d="M16 10h.01"></path><path d="M8 14h.01"></path><path d="M16 14h.01"></path><path d="M8 18h.01"></path><path d="M16 18h.01"></path></svg>
            </div>
            <span class="text-xl font-black text-white tracking-tight">TowerTech</span>
        </div>

        <nav class="space-y-1">
            <a href="dashboard.php" class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all <?php echo $activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'hover:bg-white/5 hover:text-white' ?>">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                <span class="text-sm font-bold">Dashboard</span>
            </a>

            <?php if ($isAdmin): ?>
            <a href="residents.php" class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all <?php echo $activeTab === 'residents' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'hover:bg-white/5 hover:text-white' ?>">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><polyline points="16 11 18 13 22 9"></polyline></svg>
                <span class="text-sm font-bold">Residents</span>
            </a>
            <?php endif; ?>

            <a href="maintenance.php" class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all <?php echo $activeTab === 'maintenance' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'hover:bg-white/5 hover:text-white' ?>">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                <span class="text-sm font-bold">Maintenance</span>
            </a>

            <a href="complaints.php" class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all <?php echo $activeTab === 'complaints' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'hover:bg-white/5 hover:text-white' ?>">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 21 1.9-1.9"></path><path d="M20.2 20.2 22 22"></path><path d="m20 7 2 2"></path><path d="M2 9.5V2h7.5"></path><path d="m10.5 22.5.3-3.9c.1-.6.3-1.1.7-1.5l7.2-7.2c.8-.8 2.1-.8 2.9 0l1.3 1.3c.8.8.8 2.1 0 2.9l-7.2 7.2c-.4.4-.9.6-1.5.7l-3.9.3c-.3 0-.6-.1-.8-.3-.2-.2-.3-.5-.3-.8Z"></path></svg>
                <span class="text-sm font-bold">Complaints</span>
            </a>

            <a href="amenities.php" class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all <?php echo $activeTab === 'amenities' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'hover:bg-white/5 hover:text-white' ?>">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path></svg>
                <span class="text-sm font-bold">Amenities</span>
            </a>

            <a href="profile.php" class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all <?php echo $activeTab === 'profile' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'hover:bg-white/5 hover:text-white' ?>">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                <span class="text-sm font-bold">Profile</span>
            </a>
        </nav>
    </div>

    <div class="mt-auto p-6">
        <a href="logout.php" class="flex items-center gap-3 px-4 py-3 rounded-xl text-rose-400 hover:bg-rose-400/10 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            <span class="text-sm font-bold">Logout</span>
        </a>
    </div>
</aside>
