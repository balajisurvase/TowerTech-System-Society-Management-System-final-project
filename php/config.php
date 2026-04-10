<?php
// Supabase Configuration
$supabaseUrl = "https://mniarauxuzqcmdrplgiz.supabase.co";
$supabaseKey = "sb_publishable_lyGIIhz89nFb_vMNQVfLCA_HvJeEk_5";

/**
 * Helper function to make Supabase REST API requests using cURL
 */
function supabaseRequest($method, $endpoint, $data = null) {
    global $supabaseUrl, $supabaseKey;
    
    $url = $supabaseUrl . "/rest/v1/" . $endpoint;
    
    $headers = [
        "apikey: " . $supabaseKey,
        "Authorization: Bearer " . $supabaseKey,
        "Content-Type: application/json",
        "Prefer: return=representation"
    ];
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    
    if ($data) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    }
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return [
        "status" => $httpCode,
        "data" => json_decode($response, true)
    ];
}

// Session management
session_start();

function isLoggedIn() {
    return isset($_SESSION['user']);
}

function isAdmin() {
    return isset($_SESSION['user']) && isset($_SESSION['user']['admin_id']);
}

function redirect($url) {
    header("Location: " . $url);
    exit();
}
?>
