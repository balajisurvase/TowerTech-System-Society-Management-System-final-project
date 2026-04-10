<?php
require_once 'config.php';

if (!isLoggedIn()) {
    redirect('index.php');
}

$activeTab = 'amenities';
$user = $_SESSION['user'];
$isAdmin = isAdmin();
$message = '';

// Handle Booking Approval (Admin)
if ($isAdmin && isset($_POST['approve_booking'])) {
    $bookingId = $_POST['booking_id'];
    $status = $_POST['status'];
    
    $response = supabaseRequest('PATCH', 'booking?booking_id=eq.' . $bookingId, ['status' => $status]);
    if ($response['status'] >= 200 && $response['status'] < 300) {
        $message = "Booking $status successfully!";
    }
}

// Handle New Booking (Resident)
if (!$isAdmin && isset($_POST['book_amenity'])) {
    $bookingId = 'B' . time();
    $data = [
        'booking_id' => $bookingId,
        'resident_id' => $user['resident_id'],
        'name' => $user['name'],
        'tower' => $user['tower'],
        'flat' => $user['flat'],
        'amenity_name' => $_POST['amenity_name'],
        'amenity_type' => $_POST['amenity_type'],
        'event_name' => $_POST['event_name'],
        'booking_date' => $_POST['booking_date'],
        'start_time' => $_POST['start_time'],
        'end_time' => $_POST['end_time'],
        'charges' => (int)$_POST['charges'],
        'status' => 'Pending',
        'society_id' => $user['society_id']
    ];
    
    $response = supabaseRequest('POST', 'booking', $data);
    if ($response['status'] >= 200 && $response['status'] < 300) {
        $message = "Booking request submitted successfully!";
    }
}

// Fetch Amenities
$res = supabaseRequest('GET', 'amenity?select=*');
$amenities = $res['data'] ?? [];

// Fetch Bookings
if ($isAdmin) {
    $response = supabaseRequest('GET', 'booking?select=*&order=created_at.desc');
} else {
    $response = supabaseRequest('GET', 'booking?resident_id=eq.' . $user['resident_id'] . '&select=*&order=created_at.desc');
}
$bookings = $response['data'] ?? [];

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Amenities - TowerTech</title>
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
                        <h1 class="text-3xl font-black text-slate-900 tracking-tight mb-2">Amenities & Bookings</h1>
                        <p class="text-slate-500 font-bold"><?php echo $isAdmin ? 'Manage society amenities and resident bookings.' : 'Book society amenities for your events.'; ?></p>
                    </div>
                </div>

                <?php if ($message): ?>
                <div class="bg-indigo-50 text-indigo-600 p-4 rounded-2xl text-sm font-bold border border-indigo-100 mb-8 flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    <?php echo $message; ?>
                </div>
                <?php endif; ?>

                <!-- Amenities Grid -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                    <?php foreach ($amenities as $a): ?>
                    <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                        <div class="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path></svg>
                        </div>
                        <h3 class="text-lg font-bold text-slate-900 mb-1"><?php echo $a['name']; ?></h3>
                        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4"><?php echo $a['type']; ?></p>
                        <div class="flex items-center justify-between">
                            <span class="text-sm font-black text-slate-900">₹<?php echo number_format($a['charges']); ?> <span class="text-[10px] font-bold text-slate-400 uppercase">/ Event</span></span>
                            <?php if (!$isAdmin): ?>
                            <button onclick="openBookingModal('<?php echo $a['name']; ?>', '<?php echo $a['type']; ?>', <?php echo $a['charges']; ?>)" class="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 transition-colors">Book Now</button>
                            <?php endif; ?>
                        </div>
                    </div>
                    <?php endforeach; ?>
                </div>

                <!-- Bookings Table -->
                <h2 class="text-2xl font-bold text-slate-900 mb-6"><?php echo $isAdmin ? 'All Booking Requests' : 'My Bookings'; ?></h2>
                <div class="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-slate-50 border-b border-slate-100">
                                <th class="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amenity</th>
                                <th class="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Resident</th>
                                <th class="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date & Time</th>
                                <th class="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Charges</th>
                                <th class="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th class="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-50">
                            <?php foreach ($bookings as $b): ?>
                            <tr class="hover:bg-slate-50/50 transition-colors">
                                <td class="px-6 py-4">
                                    <p class="text-sm font-bold text-slate-900"><?php echo $b['amenity_name']; ?></p>
                                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest"><?php echo $b['event_name']; ?></p>
                                </td>
                                <td class="px-6 py-4">
                                    <p class="text-sm font-bold text-slate-900"><?php echo $b['name']; ?></p>
                                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest"><?php echo $b['tower']; ?>-<?php echo $b['flat']; ?></p>
                                </td>
                                <td class="px-6 py-4">
                                    <p class="text-sm text-slate-900 font-bold"><?php echo $b['booking_date']; ?></p>
                                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest"><?php echo $b['start_time']; ?> - <?php echo $b['end_time']; ?></p>
                                </td>
                                <td class="px-6 py-4 text-sm font-black text-slate-900">₹<?php echo number_format($b['charges']); ?></td>
                                <td class="px-6 py-4">
                                    <?php 
                                    $statusClass = 'bg-amber-50 text-amber-600 border-amber-100';
                                    if ($b['status'] === 'Approved') $statusClass = 'bg-emerald-50 text-emerald-600 border-emerald-100';
                                    if ($b['status'] === 'Cancelled') $statusClass = 'bg-rose-50 text-rose-600 border-rose-100';
                                    ?>
                                    <span class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border <?php echo $statusClass; ?>">
                                        <?php echo $b['status']; ?>
                                    </span>
                                </td>
                                <td class="px-6 py-4 text-right">
                                    <?php if ($isAdmin && $b['status'] === 'Pending'): ?>
                                    <form method="POST" class="inline-flex gap-2">
                                        <input type="hidden" name="booking_id" value="<?php echo $b['booking_id']; ?>">
                                        <input type="hidden" name="approve_booking" value="1">
                                        <button type="submit" name="status" value="Approved" class="text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-800 transition-colors">Approve</button>
                                        <button type="submit" name="status" value="Cancelled" class="text-[10px] font-black uppercase tracking-widest text-rose-600 hover:text-rose-800 transition-colors">Reject</button>
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

    <!-- Booking Modal (Resident) -->
    <div id="bookingModal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-[100] hidden">
        <div class="bg-white rounded-3xl shadow-2xl p-8 max-w-lg w-full relative border border-slate-100">
            <button onclick="document.getElementById('bookingModal').classList.add('hidden')" class="absolute right-8 top-8 text-slate-400 hover:text-slate-600 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <h3 class="text-2xl font-bold text-slate-900 mb-2">Book <span id="modalAmenityName"></span></h3>
            <p class="text-slate-500 text-sm font-bold mb-6">Charges: ₹<span id="modalCharges"></span> per event</p>
            <form method="POST">
                <input type="hidden" name="book_amenity" value="1">
                <input type="hidden" name="amenity_name" id="inputAmenityName">
                <input type="hidden" name="amenity_type" id="inputAmenityType">
                <input type="hidden" name="charges" id="inputCharges">
                
                <div class="space-y-4">
                    <div>
                        <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1">Event Name</label>
                        <input type="text" name="event_name" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700 text-sm" placeholder="e.g. Birthday Party" required>
                    </div>
                    <div>
                        <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1">Date</label>
                        <input type="date" name="booking_date" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700 text-sm" required>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1">Start Time</label>
                            <input type="time" name="start_time" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700 text-sm" required>
                        </div>
                        <div>
                            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1">End Time</label>
                            <input type="time" name="end_time" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700 text-sm" required>
                        </div>
                    </div>
                </div>
                <button type="submit" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-indigo-100 uppercase tracking-widest text-xs mt-8">
                    Confirm Booking
                </button>
            </form>
        </div>
    </div>

    <script>
        function openBookingModal(name, type, charges) {
            document.getElementById('modalAmenityName').innerText = name;
            document.getElementById('modalCharges').innerText = charges;
            document.getElementById('inputAmenityName').value = name;
            document.getElementById('inputAmenityType').value = type;
            document.getElementById('inputCharges').value = charges;
            document.getElementById('bookingModal').classList.remove('hidden');
        }
    </script>
</body>
</html>
