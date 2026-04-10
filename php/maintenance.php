<?php
require_once 'config.php';

if (!isLoggedIn()) {
    redirect('index.php');
}

$activeTab = 'maintenance';
$user = $_SESSION['user'];
$isAdmin = isAdmin();
$message = '';

// Handle Mark as Paid (Admin)
if ($isAdmin && isset($_POST['mark_paid'])) {
    $maintenanceId = $_POST['maintenance_id'];
    $response = supabaseRequest('PATCH', 'maintenance?maintenance_id=eq.' . $maintenanceId, ['status' => 'Paid']);
    if ($response['status'] >= 200 && $response['status'] < 300) {
        $message = "Maintenance marked as Paid";
    }
}

// Handle Generate Bill (Admin)
if ($isAdmin && isset($_POST['generate_bill'])) {
    $maintenanceId = 'M' . time();
    $data = [
        'maintenance_id' => $maintenanceId,
        'bill_no' => 'BILL-' . rand(1000, 9999),
        'resident_id' => $_POST['resident_id'],
        'month' => $_POST['month'],
        'amount' => (int)$_POST['amount'],
        'status' => 'Unpaid',
        'due_date' => $_POST['due_date'],
        'society_id' => $user['society_id'],
        'admin_id' => $user['admin_id']
    ];
    
    // Fetch resident details for flat/tower
    $res = supabaseRequest('GET', 'resident?resident_id=eq.' . $_POST['resident_id'] . '&select=flat,tower');
    if (!empty($res['data'])) {
        $data['flat_no'] = $res['data'][0]['flat'];
        $data['tower'] = $res['data'][0]['tower'];
    }

    $response = supabaseRequest('POST', 'maintenance', $data);
    if ($response['status'] >= 200 && $response['status'] < 300) {
        $message = "Bill generated successfully!";
    }
}

// Fetch Maintenance Records
if ($isAdmin) {
    $response = supabaseRequest('GET', 'maintenance?select=*&order=created_at.desc');
} else {
    $response = supabaseRequest('GET', 'maintenance?resident_id=eq.' . $user['resident_id'] . '&select=*&order=created_at.desc');
}
$records = $response['data'] ?? [];

// Fetch Residents for dropdown (Admin)
$residents = [];
if ($isAdmin) {
    $res = supabaseRequest('GET', 'resident?select=resident_id,name');
    $residents = $res['data'] ?? [];
}

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Maintenance - TowerTech</title>
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
                        <h1 class="text-3xl font-black text-slate-900 tracking-tight mb-2">Maintenance Bills</h1>
                        <p class="text-slate-500 font-bold"><?php echo $isAdmin ? 'Generate and track society maintenance fees.' : 'View and pay your maintenance bills.'; ?></p>
                    </div>
                    <?php if ($isAdmin): ?>
                    <button onclick="document.getElementById('billModal').classList.remove('hidden')" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-2xl transition-all shadow-lg shadow-indigo-100 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                        Generate New Bill
                    </button>
                    <?php endif; ?>
                </div>

                <?php if ($message): ?>
                <div class="bg-indigo-50 text-indigo-600 p-4 rounded-2xl text-sm font-bold border border-indigo-100 mb-8 flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    <?php echo $message; ?>
                </div>
                <?php endif; ?>

                <!-- Maintenance Table -->
                <div class="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-slate-50 border-b border-slate-100">
                                <th class="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Bill No</th>
                                <th class="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Resident</th>
                                <th class="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Month</th>
                                <th class="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                                <th class="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th class="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-50">
                            <?php foreach ($records as $r): ?>
                            <tr class="hover:bg-slate-50/50 transition-colors">
                                <td class="px-6 py-4 font-bold text-slate-900 text-sm"><?php echo $r['bill_no']; ?></td>
                                <td class="px-6 py-4">
                                    <p class="text-sm font-bold text-slate-900"><?php echo $r['resident_id']; ?></p>
                                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Flat <?php echo $r['flat_no']; ?> • <?php echo $r['tower']; ?></p>
                                </td>
                                <td class="px-6 py-4 text-sm text-slate-600 font-bold"><?php echo $r['month']; ?></td>
                                <td class="px-6 py-4 text-sm font-black text-slate-900">₹<?php echo number_format($r['amount']); ?></td>
                                <td class="px-6 py-4">
                                    <?php 
                                    $statusClass = $r['status'] === 'Paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100';
                                    ?>
                                    <span class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border <?php echo $statusClass; ?>">
                                        <?php echo $r['status']; ?>
                                    </span>
                                </td>
                                <td class="px-6 py-4 text-right">
                                    <?php if ($isAdmin && $r['status'] === 'Unpaid'): ?>
                                    <form method="POST" class="inline">
                                        <input type="hidden" name="maintenance_id" value="<?php echo $r['maintenance_id']; ?>">
                                        <input type="hidden" name="mark_paid" value="1">
                                        <button type="submit" class="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 transition-colors">Mark Paid</button>
                                    </form>
                                    <?php else: ?>
                                    <button class="text-slate-400 hover:text-indigo-600 transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
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

    <!-- Generate Bill Modal (Admin) -->
    <div id="billModal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-[100] hidden">
        <div class="bg-white rounded-3xl shadow-2xl p-8 max-w-lg w-full relative border border-slate-100">
            <button onclick="document.getElementById('billModal').classList.add('hidden')" class="absolute right-8 top-8 text-slate-400 hover:text-slate-600 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <h3 class="text-2xl font-bold text-slate-900 mb-6">Generate New Bill</h3>
            <form method="POST">
                <input type="hidden" name="generate_bill" value="1">
                <div class="space-y-4">
                    <div>
                        <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1">Select Resident</label>
                        <select name="resident_id" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700 text-sm" required>
                            <?php foreach ($residents as $res): ?>
                            <option value="<?php echo $res['resident_id']; ?>"><?php echo $res['name']; ?> (<?php echo $res['resident_id']; ?>)</option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    <div>
                        <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1">Month</label>
                        <input type="text" name="month" placeholder="e.g. April 2026" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700 text-sm" required>
                    </div>
                    <div>
                        <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1">Amount (₹)</label>
                        <input type="number" name="amount" value="2500" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700 text-sm" required>
                    </div>
                    <div>
                        <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1">Due Date</label>
                        <input type="date" name="due_date" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700 text-sm" required>
                    </div>
                </div>
                <button type="submit" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-indigo-100 uppercase tracking-widest text-xs mt-6">
                    Generate Bill
                </button>
            </form>
        </div>
    </div>
</body>
</html>
