import { Service, User, Booking, FeedPost, LoginLog, Visit } from '../types';
import { DEFAULT_SERVICES, DEFAULT_FEED_POSTS } from '../data/defaultServices';

// Local storage keys
const SERVICES_KEY = 'parahiyangan_services';
const USERS_KEY = 'parahiyangan_users';
const BOOKINGS_KEY = 'parahiyangan_bookings';
const FEED_POSTS_KEY = 'parahiyangan_feed_posts';
const LOGINS_KEY = 'parahiyangan_logins';
const VISITS_KEY = 'parahiyangan_visits';
const GOOGLE_SCRIPT_URL_KEY = 'parahiyangan_google_script_url';

// Initialize default data if not present
export function initializeDatabase() {
  if (!localStorage.getItem(SERVICES_KEY)) {
    localStorage.setItem(SERVICES_KEY, JSON.stringify(DEFAULT_SERVICES));
  }
  if (!localStorage.getItem(FEED_POSTS_KEY)) {
    localStorage.setItem(FEED_POSTS_KEY, JSON.stringify(DEFAULT_FEED_POSTS));
  }
  if (!localStorage.getItem(USERS_KEY)) {
    localStorage.setItem(USERS_KEY, JSON.stringify([]));
  }
  if (!localStorage.getItem(BOOKINGS_KEY)) {
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify([]));
  }
  if (!localStorage.getItem(LOGINS_KEY)) {
    localStorage.setItem(LOGINS_KEY, JSON.stringify([]));
  }
  if (!localStorage.getItem(VISITS_KEY)) {
    localStorage.setItem(VISITS_KEY, JSON.stringify([]));
  }
}

// Config management
export function isGoogleScriptUrlValid(url: string): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (trimmed.includes('...') || trimmed.includes('YOUR_') || rmdHasPlaceholder(trimmed)) {
    return false;
  }
  return trimmed.startsWith('https://script.google.com/macros/s/');
}

function rmdHasPlaceholder(str: string): boolean {
  return /<.*>/.test(str) || str.length < 50;
}

export function getGoogleScriptUrl(): string {
  const url = localStorage.getItem(GOOGLE_SCRIPT_URL_KEY) || (import.meta as any).env.VITE_GOOGLE_SCRIPT_URL || '';
  return url.trim();
}

export function saveGoogleScriptUrl(url: string) {
  localStorage.setItem(GOOGLE_SCRIPT_URL_KEY, url);
}

// Multi-fallback async fetch helper
async function makeGasRequest(action: string, payload?: any): Promise<any> {
  const url = getGoogleScriptUrl();
  if (!url || !isGoogleScriptUrlValid(url)) {
    return null;
  }

  try {
    const fetchOptions: RequestInit = {
      method: payload ? 'POST' : 'GET',
      mode: 'cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8', // GAS often works best with text/plain to avoid CORS preflight constraints
      },
    };

    if (payload) {
      fetchOptions.body = JSON.stringify({ action, ...payload });
    } else {
      const getUrl = new URL(url);
      getUrl.searchParams.append('action', action);
      return await fetch(getUrl.toString()).then(res => res.json());
    }

    const response = await fetch(url, fetchOptions);
    const data = await response.json();
    return data;
  } catch (error: any) {
    console.warn('Google Sheets GAS sync skipped/timed out (operating local-first):', error?.message || error);
    return null;
  }
}

// 1. SERVICES
export async function getServices(): Promise<Service[]> {
  initializeDatabase();
  
  // Try to load from Google Apps Script if available
  const gasData = await makeGasRequest('getServices');
  if (gasData && gasData.success && Array.isArray(gasData.data)) {
    localStorage.setItem(SERVICES_KEY, JSON.stringify(gasData.data));
    return gasData.data;
  }

  const local = localStorage.getItem(SERVICES_KEY);
  return local ? JSON.parse(local) : DEFAULT_SERVICES;
}

export async function saveService(service: Service): Promise<Service[]> {
  const current = await getServices();
  const index = current.findIndex(s => s.id === service.id);
  
  let updated: Service[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = service;
  } else {
    updated = [...current, service];
  }

  localStorage.setItem(SERVICES_KEY, JSON.stringify(updated));

  // Sync to GAS
  await makeGasRequest('saveService', { service });

  return updated;
}

export async function deleteService(id: string): Promise<Service[]> {
  const current = await getServices();
  const updated = current.filter(s => s.id !== id);
  localStorage.setItem(SERVICES_KEY, JSON.stringify(updated));

  // Sync to GAS
  await makeGasRequest('deleteService', { id });

  return updated;
}

// 2. USERS
export async function getUsers(): Promise<User[]> {
  initializeDatabase();
  
  const gasData = await makeGasRequest('getUsers');
  if (gasData && gasData.success && Array.isArray(gasData.data)) {
    localStorage.setItem(USERS_KEY, JSON.stringify(gasData.data));
    return gasData.data;
  }

  const local = localStorage.getItem(USERS_KEY);
  return local ? JSON.parse(local) : [];
}

export async function registerUser(user: User): Promise<{ success: boolean; message: string }> {
  const users = await getUsers();
  const exists = users.some(u => u.username.toLowerCase() === user.username.toLowerCase());
  
  if (exists) {
    return { success: false, message: 'Username sudah terdaftar! Sila gunakan username lain.' };
  }

  const updated = [...users, user];
  localStorage.setItem(USERS_KEY, JSON.stringify(updated));

  // Sync to GAS
  await makeGasRequest('registerUser', { user });

  return { success: true, message: 'Pendaftaran berhasil!' };
}

// 3. BOOKINGS
export async function getBookings(): Promise<Booking[]> {
  initializeDatabase();

  const gasData = await makeGasRequest('getBookings');
  if (gasData && gasData.success && Array.isArray(gasData.data)) {
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(gasData.data));
    return gasData.data;
  }

  const local = localStorage.getItem(BOOKINGS_KEY);
  return local ? JSON.parse(local) : [];
}

export async function createBooking(booking: Booking): Promise<Booking[]> {
  const current = await getBookings();
  const updated = [booking, ...current];
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(updated));

  // Sync to GAS
  await makeGasRequest('createBooking', { booking });

  return updated;
}

export async function updateBookingStatus(id: string, status: Booking['status']): Promise<Booking[]> {
  const current = await getBookings();
  const updated = current.map(b => b.id === id ? { ...b, status } : b);
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(updated));

  // Sync to GAS
  await makeGasRequest('updateBookingStatus', { id, status });

  return updated;
}

// 4. FEED POSTS
export async function getFeedPosts(): Promise<FeedPost[]> {
  initializeDatabase();

  const gasData = await makeGasRequest('getFeedPosts');
  if (gasData && gasData.success && Array.isArray(gasData.data)) {
    localStorage.setItem(FEED_POSTS_KEY, JSON.stringify(gasData.data));
    return gasData.data;
  }

  const local = localStorage.getItem(FEED_POSTS_KEY);
  return local ? JSON.parse(local) : DEFAULT_FEED_POSTS;
}

export async function createFeedPost(post: FeedPost): Promise<FeedPost[]> {
  const current = await getFeedPosts();
  const updated = [post, ...current];
  localStorage.setItem(FEED_POSTS_KEY, JSON.stringify(updated));

  // Sync to GAS
  await makeGasRequest('createFeedPost', { post });

  return updated;
}

export async function deleteFeedPost(id: string): Promise<FeedPost[]> {
  const current = await getFeedPosts();
  const updated = current.filter(p => p.id !== id);
  localStorage.setItem(FEED_POSTS_KEY, JSON.stringify(updated));

  // Sync to GAS
  await makeGasRequest('deleteFeedPost', { id });

  return updated;
}

export async function saveFeedPost(post: FeedPost): Promise<FeedPost[]> {
  const current = await getFeedPosts();
  const index = current.findIndex(p => p.id === post.id);
  
  let updated: FeedPost[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = post;
  } else {
    updated = [post, ...current];
  }

  localStorage.setItem(FEED_POSTS_KEY, JSON.stringify(updated));

  // Sync to GAS
  await makeGasRequest('saveFeedPost', { post });

  return updated;
}

// 5. LOGINS (riwayat masuk pelanggan "username, kata sandi, jam berapa")
export async function getLogins(): Promise<LoginLog[]> {
  initializeDatabase();
  const gasData = await makeGasRequest('getLogins');
  if (gasData && gasData.success && Array.isArray(gasData.data)) {
    localStorage.setItem(LOGINS_KEY, JSON.stringify(gasData.data));
    return gasData.data;
  }
  const local = localStorage.getItem(LOGINS_KEY);
  return local ? JSON.parse(local) : [];
}

export async function logUserLogin(username: string, password_masked: string): Promise<void> {
  const current = await getLogins();
  const log: LoginLog = {
    id: 'L-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
    username,
    password: password_masked,
    timestamp: new Date().toISOString()
  };
  const updated = [log, ...current];
  localStorage.setItem(LOGINS_KEY, JSON.stringify(updated));

  await makeGasRequest('logUserLogin', { login: log });
}

// 6. VISITING LOG (aktivitas trafik pengunjung)
export function getSessionId(): string {
  let sessionId = sessionStorage.getItem('parahiyangan_session_id');
  if (!sessionId) {
    sessionId = 'S-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    sessionStorage.setItem('parahiyangan_session_id', sessionId);
  }
  return sessionId;
}

export async function getVisits(): Promise<Visit[]> {
  initializeDatabase();
  const gasData = await makeGasRequest('getVisits');
  if (gasData && gasData.success && Array.isArray(gasData.data)) {
    localStorage.setItem(VISITS_KEY, JSON.stringify(gasData.data));
    return gasData.data;
  }
  const local = localStorage.getItem(VISITS_KEY);
  return local ? JSON.parse(local) : [];
}

export async function logVisit(username?: string): Promise<void> {
  const alreadyLoggedThisRun = sessionStorage.getItem('parahiyangan_visit_logged');
  if (alreadyLoggedThisRun) return;

  const sessionId = getSessionId();
  const visit: Visit = {
    id: 'V-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
    sessionId,
    username: username || 'Guest/Pengunjung',
    userAgent: navigator.userAgent.substring(0, 100),
    timestamp: new Date().toISOString()
  };

  const current = await getVisits();
  const updated = [visit, ...current];
  localStorage.setItem(VISITS_KEY, JSON.stringify(updated));
  sessionStorage.setItem('parahiyangan_visit_logged', 'true');

  await makeGasRequest('logVisit', { visit });
}

// GOOGLE APPS SCRIPT CODE BLOCKS
export const GOOGLE_APPS_SCRIPT_KODE_GS = `/**
 * 1. FILE: Kode.gs
 * Google Apps Script Backend for Refleksi Massage Parahiyangan
 */

function doGet(e) {
  var action = e.parameter.action;
  if (!action) {
    return HtmlService.createTemplateFromFile('Index')
      .evaluate()
      .setTitle('Parahiyangan - Live Database Dashboard Monitor')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  
  var sheetResponse = handleAction(action, null);
  return ContentService.createTextOutput(JSON.stringify(sheetResponse))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var responseData;
  try {
    var rawData = e.postData.contents;
    var params = JSON.parse(rawData);
    var action = params.action;
    
    responseData = handleAction(action, params);
  } catch (err) {
    responseData = { success: false, error: err.toString() };
  }
  
  return ContentService.createTextOutput(JSON.stringify(responseData))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleAction(action, params) {
  var doc = SpreadsheetApp.getActiveSpreadsheet();
  if (!doc) {
    return { success: false, error: "No active spreadsheet database found" };
  }
  
  switch(action) {
    case 'getServices':
      return { success: true, data: getSheetData(doc, 'Services') };
    
    case 'saveService':
      var service = params.service;
      upsertRow(doc, 'Services', 'id', service.id, service);
      return { success: true };
      
    case 'deleteService':
      deleteRow(doc, 'Services', 'id', params.id);
      return { success: true };
      
    case 'getUsers':
      return { success: true, data: getSheetData(doc, 'Users') };
      
    case 'registerUser':
      var user = params.user;
      upsertRow(doc, 'Users', 'username', user.username, user);
      return { success: true };
      
    case 'getBookings':
      return { success: true, data: getSheetData(doc, 'Bookings') };
      
    case 'createBooking':
      var booking = params.booking;
      upsertRow(doc, 'Bookings', 'id', booking.id, booking);
      return { success: true };
      
    case 'updateBookingStatus':
      var id = params.id;
      var status = params.status;
      updateField(doc, 'Bookings', 'id', id, 'status', status);
      return { success: true };
      
    case 'getFeedPosts':
      return { success: true, data: getSheetData(doc, 'FeedPosts') };
      
    case 'createFeedPost':
    case 'saveFeedPost':
      var post = params.post;
      upsertRow(doc, 'FeedPosts', 'id', post.id, post);
      return { success: true };
      
    case 'deleteFeedPost':
      deleteRow(doc, 'FeedPosts', 'id', params.id);
      return { success: true };

    case 'getLogins':
      return { success: true, data: getSheetData(doc, 'Logins') };

    case 'logUserLogin':
      var login = params.login;
      upsertRow(doc, 'Logins', 'id', login.id, login);
      return { success: true };

    case 'getVisits':
      return { success: true, data: getSheetData(doc, 'Visits') };

    case 'logVisit':
      var visit = params.visit;
      upsertRow(doc, 'Visits', 'id', visit.id, visit);
      return { success: true };
      
    case 'getDashboardStats':
      var rawVisits = getSheetData(doc, 'Visits');
      var rawLogins = getSheetData(doc, 'Logins');
      var rawUsers = getSheetData(doc, 'Users');
      var rawBookings = getSheetData(doc, 'Bookings');
      
      var now = new Date().getTime();
      var tenMinsAgo = now - (10 * 60 * 1000);
      var onlineCount = 0;
      var uniqueSessions = {};
      
      for (var i = 0; i < rawVisits.length; i++) {
        var v = rawVisits[i];
        if (v.timestamp) {
          var t = new Date(v.timestamp).getTime();
          if (t >= tenMinsAgo) {
            if (!uniqueSessions[v.sessionId]) {
              uniqueSessions[v.sessionId] = true;
              onlineCount++;
            }
          }
        }
      }
      
      // Sort bookings descending by createdAt
      rawBookings.sort(function(a, b) {
        var tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        var tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tB - tA;
      });

      // Sort logins descending by timestamp
      rawLogins.sort(function(a, b) {
        var tA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        var tB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return tB - tA;
      });

      // Sort visits descending by timestamp
      rawVisits.sort(function(a, b) {
        var tA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        var tB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return tB - tA;
      });
      
      return {
        success: true,
        stats: {
          totalVisits: rawVisits.length,
          onlineCount: Math.max(1, onlineCount), // Always default to at least 1 (the admin viewing)
          totalUsers: rawUsers.length,
          totalBookings: rawBookings.length
        },
        bookings: rawBookings.slice(0, 15),
        logins: rawLogins.slice(0, 15),
        visits: rawVisits.slice(0, 15)
      };
      
    default:
      return { success: false, error: "Action not recognized: " + action };
  }
}

function getSheetData(doc, sheetName) {
  var sheet = doc.getSheetByName(sheetName);
  if (!sheet) {
    sheet = doc.insertSheet(sheetName);
  }
  
  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  
  var headers = rows[0];
  var data = [];
  
  for (var i = 1; i < rows.length; i++) {
    var rawRow = rows[i];
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      var headerVal = headers[j];
      var rawCellVal = rawRow[j];
      try {
        if (typeof rawCellVal === 'string' && (rawCellVal.startsWith('{') || rawCellVal.startsWith('['))) {
          obj[headerVal] = JSON.parse(rawCellVal);
        } else {
          obj[headerVal] = rawCellVal;
        }
      } catch(e) {
        obj[headerVal] = rawCellVal;
      }
    }
    data.push(obj);
  }
  return data;
}

function upsertRow(doc, sheetName, keyName, keyValue, objectData) {
  var sheet = doc.getSheetByName(sheetName);
  if (!sheet) {
    sheet = doc.insertSheet(sheetName);
  }
  
  var data = sheet.getDataRange().getValues();
  var headers = data[0] || [];
  
  if (headers.length === 0) {
    headers = Object.keys(objectData);
    sheet.appendRow(headers);
  } else {
    var objectKeys = Object.keys(objectData);
    var newKeys = objectKeys.filter(function(k) { return headers.indexOf(k) === -1; });
    if (newKeys.length > 0) {
      headers = headers.concat(newKeys);
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }
  }

  var keyColIndex = headers.indexOf(keyName);
  if (keyColIndex === -1) return;

  var targetRowIdx = -1;
  for (var i = 1; i < data.length; i++) {
    if (data[i][keyColIndex] == keyValue) {
      targetRowIdx = i + 1;
      break;
    }
  }

  var rowValues = headers.map(function(header) {
    var val = objectData[header];
    if (typeof val === 'object' && val !== null) {
      return JSON.stringify(val);
    }
    return val === undefined ? "" : val;
  });

  if (targetRowIdx !== -1) {
    sheet.getRange(targetRowIdx, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
}

function deleteRow(doc, sheetName, keyName, keyValue) {
  var sheet = doc.getSheetByName(sheetName);
  if (!sheet) return;
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var keyColIndex = headers.indexOf(keyName);
  if (keyColIndex === -1) return;

  for (var i = 1; i < data.length; i++) {
    if (data[i][keyColIndex] == keyValue) {
      sheet.deleteRow(i + 1);
      break;
    }
  }
}

function updateField(doc, sheetName, keyName, keyValue, fieldName, fieldValue) {
  var sheet = doc.getSheetByName(sheetName);
  if (!sheet) return;
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var keyColIndex = headers.indexOf(keyName);
  var fieldColIndex = headers.indexOf(fieldName);
  if (keyColIndex === -1 || fieldColIndex === -1) return;

  for (var i = 1; i < data.length; i++) {
    if (data[i][keyColIndex] == keyValue) {
      sheet.getRange(i + 1, fieldColIndex + 1).setValue(fieldValue);
      break;
    }
  }
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
`;

export const GOOGLE_APPS_SCRIPT_INDEX_HTML = `<!DOCTYPE html>
<html>
  <head>
    <base target="_top">
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
    <?!= include('CSS'); ?>
  </head>
  <body class="bg-[#faf8f6] text-[#2c231a] antialiased">
    <header class="bg-white border-b border-[#e6dfd5] sticky top-0 z-50 shadow-sm">
      <div class="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div class="flex items-center gap-3">
          <div class="h-10 w-10 bg-[#a47a4d] rounded-xl flex items-center justify-center font-bold text-white text-lg shadow-sm">P</div>
          <div>
            <h1 class="text-base font-extrabold tracking-tight">Parahiyangan</h1>
            <p class="text-[10px] uppercase font-mono tracking-wider text-[#a47a4d]">Google Active Monitor Dashboard</p>
          </div>
        </div>
        
        <div class="flex items-center gap-2">
          <div class="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span class="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">Live Sheets Sync Active</span>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-6 py-8 space-y-8">
      
      <!-- Stats Row -->
      <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="bg-white p-6 rounded-2xl border border-[#e6dfd5] shadow-xs flex items-center justify-between">
          <div>
            <span class="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider block">Kunjungan Total</span>
            <h3 id="stat-visits" class="text-3xl font-extrabold font-mono text-[#a47a4d] mt-1">-</h3>
            <p class="text-[10px] text-neutral-450 mt-1">Hits trafik website</p>
          </div>
        </div>
        
        <div class="bg-white p-6 rounded-2xl border border-[#e6dfd5] shadow-xs flex items-center justify-between">
          <div>
            <span class="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider block">Pengunjung Aktif</span>
            <h3 id="stat-online" class="text-3xl font-extrabold font-mono text-emerald-600 mt-1">-</h3>
            <p class="text-[10px] text-emerald-605 mt-1">&#x25CF; Online 10 menit terakhir</p>
          </div>
        </div>
        
        <div class="bg-white p-6 rounded-2xl border border-[#e6dfd5] shadow-xs flex items-center justify-between">
          <div>
            <span class="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider block">Pelanggan Terdaftar</span>
            <h3 id="stat-users" class="text-3xl font-extrabold font-mono text-neutral-850 mt-1">-</h3>
            <p class="text-[10px] text-neutral-450 mt-1">Akun Baru di spreadsheet</p>
          </div>
        </div>
        
        <div class="bg-white p-6 rounded-2xl border border-[#e6dfd5] shadow-xs flex items-center justify-between">
          <div>
            <span class="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider block">Laporan Order Terapi</span>
            <h3 id="stat-bookings" class="text-3xl font-extrabold font-mono text-neutral-850 mt-1">-</h3>
            <p class="text-[10px] text-neutral-450 mt-1">Rekap daftar pesanan masuk</p>
          </div>
        </div>
      </section>

      <!-- Tables Grid section -->
      <section class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <!-- Recent Bookings Table -->
        <div class="lg:col-span-8 bg-white rounded-3xl border border-[#e6dfd5] shadow-xs p-6 space-y-4">
          <div class="border-b border-neutral-100 pb-3">
            <h3 class="text-sm font-bold text-[#2c231a]">Laporan Booking Sesi Terapi Terbaru</h3>
            <p class="text-[10.5px] text-neutral-400">Pemesanan yang masuk dan tersimpan pada Google Sheets</p>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr class="border-b border-[#e6dfd5] text-neutral-400 font-semibold uppercase tracking-wider text-[9px]">
                  <th class="py-2.5">Pelanggan / ID</th>
                  <th class="py-2.5">Layanan / Harga</th>
                  <th class="py-2.5">Waktu Booking</th>
                  <th class="py-2.5">Status</th>
                </tr>
              </thead>
              <tbody id="bookings-list" class="divide-y divide-neutral-100">
                <tr>
                  <td colspan="4" class="text-center py-8 text-neutral-400 text-xs">Memuat laporan dari spreadsheet...</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Recent Login sessions -->
        <div class="lg:col-span-4 bg-white rounded-3xl border border-[#e6dfd5] shadow-xs p-6 space-y-4">
          <div class="border-b border-neutral-100 pb-3">
            <h3 class="text-sm font-bold text-[#2c231a]">Aktivitas Sesi Login</h3>
            <p class="text-[10.5px] text-neutral-400">Riwayat login pelanggan terbaru</p>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr class="border-b border-[#e6dfd5] text-neutral-400 font-semibold uppercase tracking-wider text-[9px]">
                  <th class="py-2.5">User</th>
                  <th class="py-2.5">Sandi</th>
                  <th class="py-2.5">Jam Masuk</th>
                </tr>
              </thead>
              <tbody id="logins-list" class="divide-y divide-neutral-100">
                <tr>
                  <td colspan="3" class="text-center py-8 text-neutral-400 text-xs">Memuat riwayat login...</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- Visitor Session Table -->
      <section class="bg-white rounded-3xl border border-[#e6dfd5] shadow-xs p-6 space-y-4">
        <div class="border-b border-neutral-100 pb-3">
          <h3 class="text-sm font-bold text-[#2c231a]">Riwayat Aktivitas Trafik & Gawai Pengunjung</h3>
          <p class="text-[10.5px] text-neutral-400">Memantau metadata device browser yang mengakses situs Parahiyangan</p>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="border-b border-[#e6dfd5] text-neutral-400 font-semibold uppercase tracking-wider text-[9px]">
                <th class="py-2.5">ID Visit</th>
                <th class="py-2.5">Session ID</th>
                <th class="py-2.5">Sistem Peramban / User Agent</th>
                <th class="py-2.5">Akun Aktif</th>
                <th class="py-2.5">Tepat Jam</th>
              </tr>
            </thead>
            <tbody id="visits-list" class="divide-y divide-neutral-100">
              <tr>
                <td colspan="5" class="text-center py-8 text-neutral-400 text-xs">Memuat riwayat trafik...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

    </main>

    <footer class="bg-white text-neutral-450 border-t border-[#e6dfd5] py-8 text-center text-[11px]">
      <p class="font-mono text-neutral-500">&copy; 2026 Refleksi Massage Parahiyangan. Live Database Monitor Engine.</p>
    </footer>

    <?!= include('JS'); ?>
  </body>
</html>`;

export const GOOGLE_APPS_SCRIPT_CSS_HTML = `<style>
  body {
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .font-mono {
    font-family: 'Space Mono', monospace;
  }
</style>`;

export const GOOGLE_APPS_SCRIPT_JS_HTML = `<script>
  window.addEventListener('load', function() {
    loadDashboardData();
    setInterval(loadDashboardData, 10000); // refresh every 10 seconds
  });

  function loadDashboardData() {
    google.script.run
      .withSuccessHandler(function(response) {
        if (response && response.success) {
          document.getElementById('stat-visits').innerText = response.stats.totalVisits || 0;
          document.getElementById('stat-online').innerText = response.stats.onlineCount || 0;
          document.getElementById('stat-users').innerText = response.stats.totalUsers || 0;
          document.getElementById('stat-bookings').innerText = response.stats.totalBookings || 0;

          // Bookings Table
          var bookingsList = document.getElementById('bookings-list');
          if (response.bookings && response.bookings.length > 0) {
            bookingsList.innerHTML = response.bookings.map(function(b) {
              var badgeClass = '';
              var statusLabel = b.status || 'pending';
              if (statusLabel === 'pending') {
                badgeClass = 'bg-amber-100 text-amber-800 border-amber-200';
              } else if (statusLabel === 'confirmed') {
                badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-200';
              } else if (statusLabel === 'completed') {
                badgeClass = 'bg-blue-100 text-blue-800 border-blue-200';
              } else {
                badgeClass = 'bg-red-100 text-red-800 border-red-200';
              }
              
              var formattedDate = b.bookingDate ? b.bookingDate : '-';
              var formattedPrice = typeof b.price === 'number' ? 'Rp ' + b.price.toLocaleString('id-ID') : 'Rp ' + Number(b.price || 0).toLocaleString('id-ID');

              return '<tr class="hover:bg-neutral-50/55">' +
                '<td class="py-3 pr-3"><span class="font-mono font-bold text-[#a47a4d] block text-[10.5px]">' + (b.id || '-') + '</span><span class="font-bold text-neutral-800 block text-xs">' + (b.fullName || '-') + '</span></td>' +
                '<td class="py-3 pr-3"><span class="font-medium text-neutral-900 block">' + (b.serviceName || '-') + '</span><span class="font-mono text-[#a47a4d] text-[10.5px] block">' + formattedPrice + '</span></td>' +
                '<td class="py-3 pr-3"><div class="font-medium text-neutral-800">' + formattedDate + '</div><div class="text-[10px] text-neutral-450 font-mono">' + (b.bookingTime || '-') + ' WIB</div></td>' +
                '<td class="py-3"><span class="px-2 py-0.5 rounded text-[10px] font-bold border ' + badgeClass + '">' + statusLabel.toUpperCase() + '</span></td>' +
                '</tr>';
            }).join('');
          } else {
            bookingsList.innerHTML = '<tr><td colspan="4" class="text-center py-8 text-neutral-400">Belum ada transaksi di database.</td></tr>';
          }

          // Logins Table
          var loginsList = document.getElementById('logins-list');
          if (response.logins && response.logins.length > 0) {
            loginsList.innerHTML = response.logins.map(function(l) {
              var timeStr = l.timestamp ? new Date(l.timestamp).toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'}) + ' WIB' : '-';
              return '<tr class="hover:bg-neutral-50/55">' +
                '<td class="py-3 pr-2 font-bold text-neutral-800 text-xs">' + (l.username || '-') + '</td>' +
                '<td class="py-3 pr-2 font-mono text-neutral-500 text-[10px]">' + (l.password ? l.password.replace(/./g, '*') : '-') + '</td>' +
                '<td class="py-3 font-mono text-neutral-450 text-[10.5px]">' + timeStr + '</td>' +
                '</tr>';
            }).join('');
          } else {
            loginsList.innerHTML = '<tr><td colspan="3" class="text-center py-8 text-neutral-450">Belum ada user login.</td></tr>';
          }

          // Visits Table
          var visitsList = document.getElementById('visits-list');
          if (response.visits && response.visits.length > 0) {
            visitsList.innerHTML = response.visits.map(function(v) {
              var val = v.timestamp ? new Date(v.timestamp).toLocaleString('id-ID', {hour12: false, hour: '2-digit', minute: '2-digit'}) : '-';
              return '<tr class="hover:bg-neutral-50/55 text-[10.5px]">' +
                '<td class="py-3 pr-3 font-mono text-[#a47a4d]">' + (v.id || '-') + '</td>' +
                '<td class="py-3 pr-3 font-mono text-neutral-400">' + (v.sessionId || '-') + '</td>' +
                '<td class="py-3 pr-3 text-neutral-500 font-mono truncate max-w-[120px]" title="' + (v.userAgent || '') + '">' + (v.userAgent || '-') + '</td>' +
                '<td class="py-3 pr-3"><span class="px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-700 font-bold">' + (v.username || 'Guest') + '</span></td>' +
                '<td class="py-3 font-mono text-neutral-450">' + val + ' WIB</td>' +
                '</tr>';
            }).join('');
          } else {
            visitsList.innerHTML = '<tr><td colspan="5" class="text-center py-8 text-neutral-450">Belum ada kunjungan.</td></tr>';
          }
        }
      })
      .withFailureHandler(function(err) {
        console.error("Failed to load GAS stats: ", err);
      })
      .getDashboardStats();
  }
</script>`;

// Backward compatible single sheet script code (legacy fallback)
export const GOOGLE_APPS_SCRIPT_CODE = GOOGLE_APPS_SCRIPT_KODE_GS;

