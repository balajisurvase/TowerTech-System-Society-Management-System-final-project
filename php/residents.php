<?php
require_once 'config.php';

if (!isAdmin()) {
    redirect('dashboard.php');
}

$activeTab = 'residents';
$user = $_SESSION['user'];
$message = '';

// Handle Add Resident
if (isset($_POST['add_resident'])) {
    $residentId = 'R' . date('Y') . rand(1000, 9999);
    $data = [
        'resident_id' => $residentId,
        'name' => $_POST['name'],
        'tower' => $_POST['tower'],
        'floor' => (int)$_POST['floor'],
        'flat' => $_POST['flat'],
        'email' => $_POST['email'],
        'phone' => $_POST['phone'],
        'password' => $_POST['password'],
        'society_id' => $user['society_id']
    ];
    
    $response = supabaseRequest('POST', 'resident', $data);
    if ($response['status'] >= 200 && $response['status'] < 300) {
        $message = "Resident added successfully! ID: $residentId";
    } else {
        $message = "Error: " . ($response['data']['message'] ?? 'Unknown error');
    }
}

// Handle Delete Resident
if (isset($_GET['delete'])) {
    $residentId = $_GET['delete'];
    $response = supabaseRequest('DELETE', 'resident?resident_id=eq.' . $residentId);
    if ($response['status'] >= 200 && $response['status'] < 300) {
        $message = "Resident deleted successfully!";
    }
}

// Fetch Residents
$response = supabaseRequest('GET', 'resident?select=*&order=created_at.desc');
$residents = $response['data'] ?? [];

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Residents - TowerTech</title>
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
                <div class="flex justify-between items-center mb-8">
                    <div>
                        <h1 class="text-3xl font-black text-slate-900 tracking-tight mb-2">Resident Management</h1>
                        <p class="text-slate-500 font-bold">Manage society members and their details.</p>
                    </div>
                    <button onclick="document.getElementById('residentModal').classList.remove('hidden')" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-2xl transition-all shadow-lg shadow-indigo-100 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="19" y1="8" x2="19" y2="14"></line><line x1="16" y1="11" x2="22" y2="11"></line></svg>
                        Add New Resident
                    </button>
                </div>

                <?php if ($message): ?>
                <div class="bg-indigo-50 text-indigo-600 p-4 rounded-2xl text-sm font-bold border border-indigo-100 mb-8 flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    <?php echo $message; ?>
                </div>
                <?php endif; ?>

                <!-- Residents Table -->
                <div class="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-slate-50 border-b border-slate-100">
                                <th class="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID</th>
                                <th class="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Name</th>
                                <th class="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Flat</th>
                                <th class="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact</th>
                                <th class="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-50">
                            <?php foreach ($residents as $r): ?>
                            <tr class="hover:bg-slate-50/50 transition-colors">
                                <td class="px-6 py-4 font-bold text-slate-900 text-sm"><?php echo $r['resident_id']; ?></td>
                                <td class="px-6 py-4">
                                    <p class="text-sm font-bold text-slate-900"><?php echo $r['name']; ?></p>
                                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Joined <?php echo date('M Y', strtotime($r['created_at'])); ?></p>
                                </td>
                                <td class="px-6 py-4">
                                    <span class="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                        <?php echo $r['tower']; ?>-<?php echo $r['flat']; ?>
                                    </span>
                                </td>
                                <td class="px-6 py-4">
                                    <p class="text-sm text-slate-600 font-medium"><?php echo $r['email']; ?></p>
                                    <p class="text-xs text-slate-400"><?php echo $r['phone']; ?></p>
                                </td>
                                <td class="px-6 py-4 text-right">
                                    <div class="flex justify-end gap-2">
                                        <button class="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                                        </button>
                                        <a href="?delete=<?php echo $r['resident_id']; ?>" onclick="return confirm('Are you sure?')" class="p-2 text-slate-400 hover:text-rose-600 transition-colors">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                                        </a>
                                    </div>
                                </td>
                            </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    </div>

    <!-- Add Resident Modal -->
    <div id="residentModal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-[100] hidden">
        <div class="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl w-full relative border border-slate-100 overflow-y-auto max-h-[90vh]">
            <button onclick="document.getElementById('residentModal').classList.add('hidden')" class="absolute right-8 top-8 text-slate-400 hover:text-slate-600 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <h3 class="text-2xl font-bold text-slate-900 mb-6">Add New Resident</h3>
            <form method="POST">
                <input type="hidden" name="add_resident" value="1">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1">Full Name</label>
                        <input type="text" name="name" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700 text-sm" required>
                    </div>
                    <div>
                        <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1">Email</label>
                        <input type="email" name="email" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700 text-sm" required>
                    </div>
                    <div>
                        <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1">Phone</label>
                        <input type="text" name="phone" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700 text-sm" required>
                    </div>
                    <div>
                        <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1">Tower</label>
                        <input type="text" name="tower" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700 text-sm" required>
                    </div>
                    <div>
                        <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1">Floor</label>
                        <input type="number" name="floor" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700 text-sm" required>
                    </div>
                    <div>
                        <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1">Flat No</label>
                        <input type="text" name="flat" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700 text-sm" required>
                    </div>
                    <div class="md:col-span-2">
                        <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1">Initial Password</label>
                        <input type="password" name="password" value="resident123" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700 text-sm" required>
                    </div>
                </div>
                <button type="submit" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-indigo-100 uppercase tracking-widest text-xs mt-8">
                    Create Account
                </button>
            </form>
        </div>
    </div>
</body>
</html>
