<?php
require_once 'config.php';

if (!isLoggedIn()) {
    redirect('index.php');
}

$activeTab = 'profile';
$user = $_SESSION['user'];
$isAdmin = isAdmin();
$error = '';
$success = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['update_profile'])) {
        $name = $_POST['name'];
        $phone = $_POST['phone'];
        $email = $_POST['email'];

        $table = $isAdmin ? 'admin' : 'resident';
        $idField = $isAdmin ? 'admin_id' : 'resident_id';
        $idValue = $user[$idField];

        $data = [
            'name' => $name,
            'phone' => $phone,
            'email' => $email
        ];

        $res = supabaseRequest('PATCH', "$table?$idField=eq.$idValue", $data);
        
        if (isset($res['error'])) {
            $error = "Failed to update profile: " . ($res['error']['message'] ?? 'Unknown error');
        } else {
            $success = "Profile updated successfully!";
            // Update session user
            $_SESSION['user']['name'] = $name;
            $_SESSION['user']['phone'] = $phone;
            $_SESSION['user']['email'] = $email;
            $user = $_SESSION['user'];
        }
    } elseif (isset($_POST['change_password'])) {
        $oldPassword = $_POST['old_password'];
        $newPassword = $_POST['new_password'];
        $confirmPassword = $_POST['confirm_password'];

        if ($newPassword !== $confirmPassword) {
            $error = "New passwords do not match!";
        } elseif (strlen($newPassword) < 6) {
            $error = "Password must be at least 6 characters!";
        } elseif ($oldPassword !== $user['password']) {
            $error = "Incorrect old password!";
        } else {
            $table = $isAdmin ? 'admin' : 'resident';
            $idField = $isAdmin ? 'admin_id' : 'resident_id';
            $idValue = $user[$idField];

            $data = ['password' => $newPassword];
            $res = supabaseRequest('PATCH', "$table?$idField=eq.$idValue", $data);

            if (isset($res['error'])) {
                $error = "Failed to update password: " . ($res['error']['message'] ?? 'Unknown error');
            } else {
                $success = "Password updated successfully!";
                $_SESSION['user']['password'] = $newPassword;
                $user = $_SESSION['user'];
            }
        }
    }
}

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Profile - TowerTech</title>
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
                <div class="max-w-4xl mx-auto">
                    <?php if ($error): ?>
                        <div class="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl font-bold text-sm flex items-center gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                            <?php echo $error; ?>
                        </div>
                    <?php endif; ?>

                    <?php if ($success): ?>
                        <div class="mb-6 p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-2xl font-bold text-sm flex items-center gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                            <?php echo $success; ?>
                        </div>
                    <?php endif; ?>

                    <div class="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden group mb-8">
                        <div class="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 transition-transform duration-700 group-hover:scale-110"></div>
                        <div class="relative z-10">
                            <div class="flex items-center gap-6 mb-8">
                                <div class="w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center border border-white/30 shadow-inner">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                </div>
                                <div>
                                    <h3 class="text-3xl font-black tracking-tight"><?php echo $user['name']; ?></h3>
                                    <p class="text-indigo-100 font-bold uppercase tracking-widest text-[10px] mt-1"><?php echo $isAdmin ? 'Administrator' : 'Resident'; ?> Profile • <?php echo $isAdmin ? $user['admin_id'] : $user['resident_id']; ?></p>
                                </div>
                            </div>
                            <div class="grid grid-cols-2 gap-6">
                                <div class="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
                                    <p class="text-[9px] font-black text-indigo-100 uppercase tracking-widest opacity-70">Society ID</p>
                                    <p class="text-xl font-black"><?php echo $user['society_id']; ?></p>
                                </div>
                                <?php if (!$isAdmin): ?>
                                <div class="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
                                    <p class="text-[9px] font-black text-indigo-100 uppercase tracking-widest opacity-70">Tower / Flat</p>
                                    <p class="text-xl font-black">T-<?php echo $user['tower']; ?> / <?php echo $user['flat']; ?></p>
                                </div>
                                <?php endif; ?>
                            </div>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <!-- Edit Profile -->
                        <div class="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                            <h4 class="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                Edit Information
                            </h4>
                            <form method="POST" class="space-y-6">
                                <div class="space-y-2">
                                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                                    <input type="text" name="name" value="<?php echo $user['name']; ?>" required class="w-full px-5 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm transition-all">
                                </div>
                                <div class="space-y-2">
                                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                                    <input type="tel" name="phone" value="<?php echo $user['phone']; ?>" required class="w-full px-5 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm transition-all">
                                </div>
                                <div class="space-y-2">
                                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                                    <input type="email" name="email" value="<?php echo $user['email']; ?>" required class="w-full px-5 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm transition-all">
                                </div>
                                <button type="submit" name="update_profile" class="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 uppercase tracking-widest text-xs">
                                    Save Changes
                                </button>
                            </form>
                        </div>

                        <!-- Change Password -->
                        <div class="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                            <h4 class="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                Change Password
                            </h4>
                            <form method="POST" class="space-y-6">
                                <div class="space-y-2">
                                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Old Password</label>
                                    <input type="password" name="old_password" required class="w-full px-5 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm transition-all">
                                </div>
                                <div class="space-y-2">
                                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Password</label>
                                    <input type="password" name="new_password" required class="w-full px-5 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm transition-all">
                                </div>
                                <div class="space-y-2">
                                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm New Password</label>
                                    <input type="password" name="confirm_password" required class="w-full px-5 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm transition-all">
                                </div>
                                <button type="submit" name="change_password" class="w-full bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-100 uppercase tracking-widest text-xs">
                                    Update Password
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </div>
</body>
</html>
