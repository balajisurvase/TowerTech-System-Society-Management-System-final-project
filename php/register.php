<?php
require_once 'config.php';

$message = '';
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $societyId = 'S' . date('Y') . rand(100, 999);
    $adminId = 'A001';
    
    // 1. Create Admin
    $adminData = [
        'admin_id' => $adminId,
        'name' => $_POST['admin_name'],
        'email' => $_POST['admin_email'],
        'phone' => $_POST['phone'],
        'password' => $_POST['password'],
        'society_id' => $societyId,
        'role' => 'admin'
    ];
    
    $response = supabaseRequest('POST', 'admin', $adminData);
    
    if ($response['status'] >= 200 && $response['status'] < 300) {
        // 2. Create Initial Amenities
        $amenities = [
            ['amenity_id' => 'AM001', 'name' => 'Clubhouse', 'type' => 'Indoor', 'charges' => 5000, 'society_id' => $societyId],
            ['amenity_id' => 'AM002', 'name' => 'Swimming Pool', 'type' => 'Outdoor', 'charges' => 2000, 'society_id' => $societyId],
            ['amenity_id' => 'AM003', 'name' => 'Gymnasium', 'type' => 'Indoor', 'charges' => 1000, 'society_id' => $societyId]
        ];
        
        foreach ($amenities as $a) {
            supabaseRequest('POST', 'amenity', $a);
        }
        
        $message = "Society Registered Successfully! Society ID: $societyId, Admin ID: $adminId. Please login now.";
    } else {
        $error = "Registration failed: " . ($response['data']['message'] ?? 'Unknown error');
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Register Society - TowerTech</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; }
    </style>
</head>
<body class="bg-white selection:bg-indigo-100 selection:text-indigo-700">
    <div class="min-h-screen flex items-center justify-center relative overflow-hidden">
        <div class="absolute inset-0 overflow-hidden pointer-events-none">
            <div class="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[100px]"></div>
            <div class="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[100px]"></div>
        </div>

        <div class="w-full min-h-screen bg-white overflow-hidden relative z-10 flex flex-col">
            <div class="p-8 md:p-12 overflow-y-auto">
                <div class="max-w-4xl mx-auto w-full">
                    <a href="index.php" class="group flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-all mb-8 font-black uppercase tracking-widest text-[10px]">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 group-hover:-translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                        Back to Login
                    </a>

                    <div class="mb-10">
                        <div class="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-indigo-200">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 6h.01"></path><path d="M16 6h.01"></path><path d="M8 10h.01"></path><path d="M16 10h.01"></path><path d="M8 14h.01"></path><path d="M16 14h.01"></path><path d="M8 18h.01"></path><path d="M16 18h.01"></path></svg>
                        </div>
                        <h2 class="text-4xl font-black text-slate-900 tracking-tight mb-2">Create Society Account</h2>
                        <p class="text-slate-500 font-bold">Register your society and start managing your community.</p>
                    </div>

                    <?php if ($message): ?>
                    <div class="bg-emerald-50 text-emerald-600 p-4 rounded-2xl text-sm font-bold border border-emerald-100 mb-8 flex items-center gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                        <?php echo $message; ?>
                    </div>
                    <?php endif; ?>

                    <?php if ($error): ?>
                    <div class="bg-rose-50 text-rose-600 p-4 rounded-2xl text-sm font-bold border border-rose-100 mb-8 flex items-center gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        <?php echo $error; ?>
                    </div>
                    <?php endif; ?>

                    <form method="POST" class="space-y-8">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            <div class="md:col-span-2">
                                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1">Society Name</label>
                                <input type="text" name="society_name" placeholder="e.g. Green Valley Apartments" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700 text-sm" required>
                            </div>
                            <div>
                                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1">Admin Name</label>
                                <input type="text" name="admin_name" placeholder="Full Name" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700 text-sm" required>
                            </div>
                            <div>
                                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1">Admin Email</label>
                                <input type="email" name="admin_email" placeholder="admin@example.com" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700 text-sm" required>
                            </div>
                            <div>
                                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1">Phone Number</label>
                                <input type="text" name="phone" placeholder="+91 98765 43210" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700 text-sm" required>
                            </div>
                            <div>
                                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1">Password</label>
                                <input type="password" name="password" placeholder="••••••••" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700 text-sm" required>
                            </div>
                        </div>
                        <button type="submit" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-indigo-100 uppercase tracking-widest text-xs mt-8">
                            Register Society
                        </button>
                    </form>
                </div>
            </div>
            
            <div class="p-6 bg-slate-50 border-t border-slate-100 flex justify-center items-center mt-auto">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">© 2026 TowerTech-Society Management System</p>
            </div>
        </div>
    </div>
</body>
</html>
