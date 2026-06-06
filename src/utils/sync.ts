import { Service, User, Booking, FeedPost } from '../types';
import { DEFAULT_SERVICES, DEFAULT_FEED_POSTS } from '../data/defaultServices';

// Local storage keys
const SERVICES_KEY = 'parahiyangan_services';
const USERS_KEY = 'parahiyangan_users';
const BOOKINGS_KEY = 'parahiyangan_bookings';
const FEED_POSTS_KEY = 'parahiyangan_feed_posts';
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
}

// Config management
export function getGoogleScriptUrl(): string {
  return localStorage.getItem(GOOGLE_SCRIPT_URL_KEY) || '';
}

export function saveGoogleScriptUrl(url: string) {
  localStorage.setItem(GOOGLE_SCRIPT_URL_KEY, url);
}

// Multi-fallback async fetch helper
async function makeGasRequest(action: string, payload?: any): Promise<any> {
  const url = getGoogleScriptUrl();
  if (!url) return null;

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
  } catch (error) {
    console.error('Failed to sync with Google Sheets (GAS):', error);
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

/**
 * Generates the Google Apps Script code for the user to copy-paste.
 */
export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * Google Apps Script Backend for Refleksi Massage Parahiyangan
 * 
 * Instructions:
 * 1. Open Google Sheets (create a sheet named: "Parahiyangan_Database").
 * 2. Create 4 tabs named precisely: "Services", "Users", "Bookings", "FeedPosts"
 * 3. Go to Extension > Apps Script.
 * 4. Paste this code, and click Save.
 * 5. Click Deploy > New Deployment.
 * 6. Under "Select type" choose "Web app".
 * 7. Set "Execute as": "Me", and "Who has access": "Anyone".
 * 8. Click Deploy, authorize permissions, and COPY the Web App URL.
 * 9. Paste the URL inside the Parahiyangan Admin Settings!
 */

function doGet(e) {
  var action = e.parameter.action;
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
    return { success: false, error: "No active spreadsheet found" };
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
      var post = params.post;
      upsertRow(doc, 'FeedPosts', 'id', post.id, post);
      return { success: true };
      
    case 'deleteFeedPost':
      deleteRow(doc, 'FeedPosts', 'id', params.id);
      return { success: true };
      
    default:
      return { success: false, error: "Unknown action: " + action };
  }
}

// Helper: Get data from a sheet as array of objects
function getSheetData(doc, sheetName) {
  var sheet = doc.getSheetByName(sheetName);
  if (!sheet) {
    sheet = doc.insertSheet(sheetName);
  }
  
  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return []; // Empty or only header
  
  var headers = rows[0];
  var data = [];
  
  for (var i = 1; i < rows.length; i++) {
    var rawRow = rows[i];
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      var headerVal = headers[j];
      var rawCellVal = rawRow[j];
      // Autodetect JSON strings (e.g. nested settings) or numbers/booleans
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

// Helper: Upsert row matching a key/identifier
function upsertRow(doc, sheetName, keyName, keyValue, objectData) {
  var sheet = doc.getSheetByName(sheetName);
  if (!sheet) {
    sheet = doc.insertSheet(sheetName);
  }
  
  var data = sheet.getDataRange().getValues();
  var headers = data[0] || [];
  
  // Create headers if empty
  if (headers.length === 0) {
    headers = Object.keys(objectData);
    sheet.appendRow(headers);
  } else {
    // Check if new keys are present, and add them to headers
    var objectKeys = Object.keys(objectData);
    var newKeys = objectKeys.filter(function(k) { return headers.indexOf(k) === -1; });
    if (newKeys.length > 0) {
      headers = headers.concat(newKeys);
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }
  }

  // Find index of key Column
  var keyColIndex = headers.indexOf(keyName);
  if (keyColIndex === -1) {
    return; // Key not in headers
  }

  // Find row matching keyValue
  var targetRowIdx = -1;
  for (var i = 1; i < data.length; i++) {
    if (data[i][keyColIndex] == keyValue) {
      targetRowIdx = i + 1; // 1-based index including headers
      break;
    }
  }

  // Build row array
  var rowValues = headers.map(function(header) {
    var val = objectData[header];
    if (typeof val === 'object' && val !== null) {
      return JSON.stringify(val);
    }
    return val === undefined ? "" : val;
  });

  if (targetRowIdx !== -1) {
    // Update existing row
    sheet.getRange(targetRowIdx, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    // Append new row
    sheet.appendRow(rowValues);
  }
}

// Helper: Delete row matching key
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

// Helper: Update a single cell field
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
`;
