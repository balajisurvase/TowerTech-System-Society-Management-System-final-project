<?php
require_once 'config.php';

if (isLoggedIn()) {
    redirect('dashboard.php');
}

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $role = $_POST['role'];
    $loginId = $_POST['loginId'];
    $societyId = $_POST['societyId'];
    $password = $_POST['password'];

    $table = ($role === 'admin') ? 'admin' : 'resident';
    $idField = ($role === 'admin') ? 'admin_id' : 'resident_id';

    // Query Supabase
    $response = supabaseRequest('GET', $table . '?' . $idField . '=eq.' . $loginId . '&password=eq.' . $password . '&society_id=eq.' . $societyId . '&select=*');

    if ($response['status'] === 200 && !empty($response['data'])) {
        $_SESSION['user'] = $response['data'][0];
        redirect('dashboard.php');
    } else {
        $error = 'Invalid ID, Password or Society ID';
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - TowerTech</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; }
    </style>
</head>
<body class="bg-white selection:bg-indigo-100 selection:text-indigo-700">
    <div class="min-h-screen flex items-center justify-center relative overflow-hidden">
        <!-- Background Decorative Elements -->
        <div class="absolute inset-0 overflow-hidden pointer-events-none">
            <div class="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[100px]"></div>
            <div class="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[100px]"></div>
        </div>

        <div class="w-full min-h-screen grid md:grid-cols-2 bg-white overflow-hidden relative z-10">
            <!-- Left Side - Visual/Branding -->
            <div class="hidden md:flex flex-col justify-between p-12 lg:p-16 bg-slate-900 text-white relative overflow-hidden">
                <div class="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div class="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full -ml-24 -mb-24 blur-2xl"></div>
                
                <div class="relative z-10">
                    <div class="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-10 border border-white/10">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 6h.01"></path><path d="M16 6h.01"></path><path d="M8 10h.01"></path><path d="M16 10h.01"></path><path d="M8 14h.01"></path><path d="M16 14h.01"></path><path d="M8 18h.01"></path><path d="M16 18h.01"></path></svg>
                    </div>
                    <h1 class="text-4xl lg:text-5xl font-black leading-[1.1] tracking-tight mb-2">TowerTech</h1>
                    <h3 class="text-xl lg:text-2xl font-bold text-indigo-400 mb-8">Society Management System</h3>
                    
                    <div class="space-y-6">
                        <div>
                            <p class="text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-indigo-300">SMART COMMUNITY MANAGEMENT</p>
                            <p class="text-slate-400 text-base font-medium leading-relaxed max-w-sm">A simple digital platform to manage residential societies efficiently.</p>
                        </div>
                        <div class="pt-6 border-t border-white/5">
                            <p class="text-slate-300 text-sm font-bold leading-relaxed">Digital Solutions for Modern Communities</p>
                            <p class="text-slate-500 text-xs mt-2 leading-relaxed max-w-xs">Manage maintenance payments, resolve complaints, and book amenities in one place.</p>
                        </div>
                    </div>
                </div>

                <div class="relative z-10 space-y-8">
                    <div class="flex items-center gap-4">
                        <div class="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"></path></svg>
                        </div>
                        <p class="text-sm font-bold text-slate-300">Secure • Reliable • Encrypted</p>
                    </div>
                    <div class="pt-8 border-t border-white/5">
                        <p class="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em]">© 2026 TowerTech Technologies</p>
                    </div>
                </div>
            </div>

            <!-- Right Side - Login Form -->
            <div class="p-8 md:p-10 lg:p-12 flex flex-col justify-center">
                <div class="max-w-md mx-auto w-full">
                    <div class="mb-8">
                        <h2 class="text-3xl font-bold text-slate-900 tracking-tight mb-2" id="loginTitle">Resident Login</h2>
                        <p class="text-slate-500 text-sm font-medium">Welcome back! Please sign in to your account.</p>
                    </div>

                    <!-- Role Switcher -->
                    <div class="mb-8">
                        <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Select Mode</label>
                        <div class="flex bg-slate-50 p-1 rounded-2xl border border-slate-100">
                            <button onclick="setRole('resident')" id="residentBtn" class="flex-1 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all bg-white shadow-sm text-emerald-600">Resident</button>
                            <button onclick="setRole('admin')" id="adminBtn" class="flex-1 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all text-slate-400 hover:text-slate-600">Admin</button>
                        </div>
                    </div>

                    <form method="POST" class="space-y-6">
                        <input type="hidden" name="role" id="roleInput" value="resident">
                        <div class="space-y-6">
                            <div class="space-y-1.5">
                                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Society ID</label>
                                <div class="relative group">
                                    <input type="text" name="societyId" value="GV2026" placeholder="GV2026" class="w-full pl-4 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-semibold text-slate-700 placeholder:text-slate-300 text-sm" required>
                                </div>
                            </div>

                            <div class="space-y-1.5">
                                <label id="idLabel" class="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Resident ID</label>
                                <div class="relative group">
                                    <input type="text" name="loginId" placeholder="Enter ID" class="w-full pl-4 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-semibold text-slate-700 placeholder:text-slate-300 text-sm" required>
                                </div>
                            </div>
                            
                            <div class="space-y-1.5">
                                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
                                <div class="relative group">
                                    <input type="password" name="password" placeholder="••••••••" class="w-full pl-4 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-semibold text-slate-700 placeholder:text-slate-300 text-sm" required>
                                </div>
                            </div>
                        </div>

                        <?php if ($error): ?>
                        <div class="bg-rose-50 text-rose-600 p-3 rounded-xl text-xs font-bold border border-rose-100 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            <?php echo $error; ?>
                        </div>
                        <?php endif; ?>

                        <button type="submit" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 uppercase tracking-widest text-xs mt-2">
                            Sign In
                        </button>
                    </form>

                    <div class="mt-10 pt-8 border-t border-slate-100 flex flex-col items-center gap-4">
                        <a href="register.php" class="w-full group flex flex-col items-center gap-2 p-6 bg-gradient-to-r from-slate-50 to-white rounded-3xl border border-slate-100 hover:border-indigo-200 transition-all shadow-sm hover:shadow-md text-center">
                            <div class="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm mb-1">
                                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="19" y1="8" x2="19" y2="14"></line><line x1="16" y1="11" x2="22" y2="11"></line></svg>
                            </div>
                            <span class="text-sm font-bold text-indigo-600 uppercase tracking-widest">Register Your Society</span>
                            <p class="text-slate-400 text-[10px] font-medium">Create a new society account to start managing residents and services.</p>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        function setRole(role) {
            document.getElementById('roleInput').value = role;
            const residentBtn = document.getElementById('residentBtn');
            const adminBtn = document.getElementById('adminBtn');
            const loginTitle = document.getElementById('loginTitle');
            const idLabel = document.getElementById('idLabel');

            if (role === 'resident') {
                residentBtn.className = "flex-1 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all bg-white shadow-sm text-emerald-600";
                adminBtn.className = "flex-1 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all text-slate-400 hover:text-slate-600";
                loginTitle.innerText = "Resident Login";
                idLabel.innerText = "Resident ID";
            } else {
                adminBtn.className = "flex-1 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all bg-white shadow-sm text-indigo-600";
                residentBtn.className = "flex-1 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all text-slate-400 hover:text-slate-600";
                loginTitle.innerText = "Admin Login";
                idLabel.innerText = "Admin ID";
            }
        }
    </script>
</body>
</html>
