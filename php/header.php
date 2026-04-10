<?php
// header.php
$user = $_SESSION['user'];
$userName = $user['name'];
$userRole = isAdmin() ? 'Administrator' : 'Resident';
?>
<header class="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-40">
    <div class="flex items-center gap-4">
        <h2 class="text-xl font-bold text-slate-800 tracking-tight capitalize"><?php echo $activeTab; ?></h2>
    </div>

    <div class="flex items-center gap-6">
        <div class="flex items-center gap-3 pl-6 border-l border-slate-200">
            <div class="text-right hidden sm:block">
                <p class="text-sm font-bold text-slate-900 leading-none mb-1"><?php echo $userName; ?></p>
                <p class="text-[10px] font-bold text-indigo-600 uppercase tracking-widest"><?php echo $userRole; ?></p>
            </div>
            <div class="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 border border-slate-200">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            </div>
        </div>
    </div>
</header>
