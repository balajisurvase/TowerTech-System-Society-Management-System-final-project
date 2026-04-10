<?php
require_once 'config.php';

if (!isLoggedIn()) {
    redirect('index.php');
}

$activeTab = 'complaints';
$user = $_SESSION['user'];
$isAdmin = isAdmin();
$message = '';

// Handle Status Update (Admin)
if ($isAdmin && isset($_POST['update_status'])) {
    $complaintId = $_POST['complaint_id'];
    $newStatus = $_POST['status'];
    
    $response = supabaseRequest('PATCH', 'complaint?complaint_id=eq.' . $complaintId, ['status' => $newStatus]);
    if ($response['status'] >= 200 && $response['status'] < 300) {
        $message = "Complaint status updated to $newStatus";
    }
}

// Handle New Complaint (Resident)
if (!$isAdmin && isset($_POST['file_complaint'])) {
    $complaintId = 'C' . time();
    $data = [
        'complaint_id' => $complaintId,
        'resident_id' => $user['resident_id'],
        'flat_no' => $user['flat'],
        'tower' => $user['tower'],
        'complaint_date' => date('Y-m-d'),
        'description' => $_POST['description'],
        'status' => 'Pending',
        'society_id' => $user['society_id']
    ];
    
    $response = supabaseRequest('POST', 'complaint', $data);
    if ($response['status'] >= 200 && $response['status'] < 300) {
        $message = "Complaint filed successfully!";
    }
}

// Fetch Complaints
if ($isAdmin) {
    $response = supabaseRequest('GET', 'complaint?select=*&order=created_at.desc');
} else {
    $response = supabaseRequest('GET', 'complaint?resident_id=eq.' . $user['resident_id'] . '&select=*&order=created_at.desc');
}
$complaints = $response['data'] ?? [];

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Complaints - TowerTech</title>
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
                        <h1 class="text-3xl font-black text-slate-900 tracking-tight mb-2">Complaints Management</h1>
                        <p class="text-slate-500 font-bold"><?php echo $isAdmin ? 'Manage and resolve resident issues.' : 'Track and file your complaints.'; ?></p>
                    </div>
                    <?php if (!$isAdmin): ?>
                    <button onclick="document.getElementById('complaintModal').classList.remove('hidden')" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-2xl transition-all shadow-lg shadow-indigo-100 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                        File New Complaint
                    </button>
                    <?php endif; ?>
                </div>

                <?php if ($message): ?>
                <div class="bg-emerald-50 text-emerald-600 p-4 rounded-2xl text-sm font-bold border border-emerald-100 mb-8 flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    <?php echo $message; ?>
                </div>
                <?php endif; ?>

                <!-- Complaints Table -->
                <div class="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-slate-50 border-b border-slate-100">
                                <th class="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID</th>
                                <th class="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Resident</th>
                                <th class="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                                <th class="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                <th class="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th class="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-50">
                            <?php foreach ($complaints as $c): ?>
                            <tr class="hover:bg-slate-50/50 transition-colors">
                                <td class="px-6 py-4 font-bold text-slate-900 text-sm"><?php echo $c['complaint_id']; ?></td>
                                <td class="px-6 py-4">
                                    <p class="text-sm font-bold text-slate-900"><?php echo $c['resident_id']; ?></p>
                                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Flat <?php echo $c['flat_no']; ?> • <?php echo $c['tower']; ?></p>
                                </td>
                                <td class="px-6 py-4">
                                    <p class="text-sm text-slate-600 line-clamp-1"><?php echo $c['description']; ?></p>
                                </td>
                                <td class="px-6 py-4 text-sm text-slate-500 font-medium"><?php echo $c['complaint_date']; ?></td>
                                <td class="px-6 py-4">
                                    <?php 
                                    $statusClass = 'bg-amber-50 text-amber-600 border-amber-100';
                                    if ($c['status'] === 'Process') $statusClass = 'bg-blue-50 text-blue-600 border-blue-100';
                                    if ($c['status'] === 'Done') $statusClass = 'bg-emerald-50 text-emerald-600 border-emerald-100';
                                    if ($c['status'] === 'Reject') $statusClass = 'bg-rose-50 text-rose-600 border-rose-100';
                                    ?>
                                    <span class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border <?php echo $statusClass; ?>">
                                        <?php echo $c['status']; ?>
                                    </span>
                                </td>
                                <td class="px-6 py-4 text-right">
                                    <?php if ($isAdmin && $c['status'] !== 'Done' && $c['status'] !== 'Reject'): ?>
                                    <form method="POST" class="inline-flex gap-2">
                                        <input type="hidden" name="complaint_id" value="<?php echo $c['complaint_id']; ?>">
                                        <input type="hidden" name="update_status" value="1">
                                        <select name="status" onchange="this.form.submit()" class="text-[10px] font-bold uppercase tracking-widest bg-slate-100 border-none rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-500">
                                            <option value="">Update</option>
                                            <option value="Process">Process</option>
                                            <option value="Done">Done</option>
                                            <option value="Reject">Reject</option>
                                        </select>
                                    </form>
                                    <?php else: ?>
                                    <button class="text-slate-400 hover:text-indigo-600 transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                    </button>
                                    <?php endif; ?>
                                </td>
                            </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    </div>

    <!-- New Complaint Modal (Resident) -->
    <div id="complaintModal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-[100] hidden">
        <div class="bg-white rounded-3xl shadow-2xl p-8 max-w-lg w-full relative border border-slate-100">
            <button onclick="document.getElementById('complaintModal').classList.add('hidden')" class="absolute right-8 top-8 text-slate-400 hover:text-slate-600 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <h3 class="text-2xl font-bold text-slate-900 mb-6">File New Complaint</h3>
            <form method="POST">
                <input type="hidden" name="file_complaint" value="1">
                <div class="space-y-4">
                    <div>
                        <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1">Description</label>
                        <textarea name="description" rows="4" class="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700 placeholder:text-slate-300 text-sm" placeholder="Describe your issue..." required></textarea>
                    </div>
                </div>
                <button type="submit" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-indigo-100 uppercase tracking-widest text-xs mt-6">
                    Submit Complaint
                </button>
            </form>
        </div>
    </div>
</body>
</html>
