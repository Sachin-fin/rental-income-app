/**
 * Supabase Cloud Persistence & Two-Way Realtime Sync Service
 */

import {
  STORAGE_KEY_SUPABASE_URL,
  STORAGE_KEY_SUPABASE_KEY,
  STORAGE_KEY_SUPABASE_AUTOSYNC
} from '../config/constants.js';
import { toast } from '../ui/toast.js';

let supabaseClient = null;

export function isSupabaseAutoSyncEnabled() {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEY_SUPABASE_AUTOSYNC) === "true";
}

export function updateSupabaseUIStatus(status) {
  if (typeof document === 'undefined') return;
  const dot = document.getElementById("supabaseNavDot");
  const navLabel = document.getElementById("supabaseStatusNavLabel");
  const badge = document.getElementById("supabaseModalStatusBadge");

  if (status === "connected") {
    if (dot) dot.className = "w-2 h-2 rounded-full bg-emerald-500 animate-pulse";
    if (navLabel) navLabel.textContent = "Supabase: Connected";
    if (badge) {
      badge.className = "text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800";
      badge.textContent = "Active & Synced";
    }
  } else if (status === "syncing") {
    if (dot) dot.className = "w-2 h-2 rounded-full bg-amber-400 animate-ping";
    if (navLabel) navLabel.textContent = "Syncing...";
    if (badge) {
      badge.className = "text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800";
      badge.textContent = "Syncing in Progress...";
    }
  } else if (status === "error") {
    if (dot) dot.className = "w-2 h-2 rounded-full bg-rose-500";
    if (navLabel) navLabel.textContent = "Supabase: Error";
    if (badge) {
      badge.className = "text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700";
      badge.textContent = "Connection Failed";
    }
  } else {
    // disconnected
    if (dot) dot.className = "w-2 h-2 rounded-full bg-slate-400";
    if (navLabel) navLabel.textContent = "Supabase Sync";
    if (badge) {
      badge.className = "text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600";
      badge.textContent = "Not Connected";
    }
  }
}

export function normalizeSupabaseUrl(raw) {
  if (!raw) return "";
  let u = String(raw).trim().replace(/^["']|["']$/g, "");
  const dashMatch = u.match(/supabase\.com\/dashboard\/project\/([a-zA-Z0-9_-]+)/i);
  if (dashMatch) {
    return "https://" + dashMatch[1] + ".supabase.co";
  }
  if (!/^https?:\/\//i.test(u)) {
    u = "https://" + u;
  }
  u = u.replace(/\/+$/, "");
  u = u.replace(/\/rest\/v1\/?$/i, "");
  u = u.replace(/\/rest\/?$/i, "");
  u = u.replace(/\/settings\/api\/?$/i, "");
  u = u.replace(/\/+$/, "");
  return u;
}

export function normalizeSupabaseKey(raw) {
  if (!raw) return "";
  return String(raw).trim().replace(/^["']|["']$/g, "").replace(/\s+/g, "");
}

export function initSupabaseClient() {
  if (typeof localStorage === 'undefined') return false;
  let url = (localStorage.getItem(STORAGE_KEY_SUPABASE_URL) || "").trim();
  let key = (localStorage.getItem(STORAGE_KEY_SUPABASE_KEY) || "").trim();

  url = normalizeSupabaseUrl(url);
  key = normalizeSupabaseKey(key);

  if (url && key && typeof window !== 'undefined' && window.supabase && typeof window.supabase.createClient === "function") {
    try {
      supabaseClient = window.supabase.createClient(url, key);
      updateSupabaseUIStatus("connected");
      return true;
    } catch (e) {
      console.warn("Failed to initialize Supabase client", e);
      supabaseClient = null;
      updateSupabaseUIStatus("error");
      return false;
    }
  } else {
    supabaseClient = null;
    updateSupabaseUIStatus("disconnected");
    return false;
  }
}

export function showSupabaseFeedback(msg, type = "info") {
  if (typeof document === 'undefined') return;
  const fb = document.getElementById("supabaseFeedback");
  if (!fb) return;
  fb.classList.remove("hidden", "bg-rose-50", "text-rose-800", "border-rose-200", "bg-emerald-50", "text-emerald-800", "border-emerald-200", "bg-indigo-50", "text-indigo-800", "border-indigo-200");
  if (type === "error") {
    fb.classList.add("bg-rose-50", "text-rose-800", "border", "border-rose-200");
  } else if (type === "success") {
    fb.classList.add("bg-emerald-50", "text-emerald-800", "border", "border-emerald-200");
  } else {
    fb.classList.add("bg-indigo-50", "text-indigo-800", "border", "border-indigo-200");
  }
  fb.textContent = msg;
}

export async function testSupabaseConnection() {
  if (typeof document === 'undefined') return false;
  const urlInput = document.getElementById("supabaseUrlInput");
  const keyInput = document.getElementById("supabaseKeyInput");
  let url = normalizeSupabaseUrl(urlInput?.value || "");
  let key = normalizeSupabaseKey(keyInput?.value || "");

  if (urlInput && url) urlInput.value = url;
  if (keyInput && key) keyInput.value = key;

  if (!url || !key) {
    showSupabaseFeedback("Please provide both Supabase Project URL and Anon Key.", "error");
    toast.error("Please enter both Supabase URL and Anon Key");
    return false;
  }

  if (typeof window === 'undefined' || !window.supabase || typeof window.supabase.createClient !== "function") {
    showSupabaseFeedback("Supabase library not loaded. Check internet connection.", "error");
    toast.error("Supabase CDN not loaded");
    return false;
  }

  try {
    showSupabaseFeedback("Testing connection to Supabase...", "info");
    const testClient = window.supabase.createClient(url, key);
    const { error } = await testClient.from("properties").select("id").limit(1);
    if (error) throw error;
    showSupabaseFeedback("✓ Supabase connection verified successfully! Schema tables are online.", "success");
    toast.success("Connected to Supabase successfully!", "Cloud Connected");
    return true;
  } catch (err) {
    console.error("Test connection failed:", err);
    showSupabaseFeedback("✗ Connection failed: " + (err.message || "Ensure tables are created using supabase-schema.sql"), "error");
    toast.error(err.message || "Connection failed", "Supabase Error");
    return false;
  }
}

export function saveSupabaseCredentials(onSuccess = null) {
  if (typeof document === 'undefined') return;
  let url = normalizeSupabaseUrl(document.getElementById("supabaseUrlInput")?.value || "");
  let key = normalizeSupabaseKey(document.getElementById("supabaseKeyInput")?.value || "");
  const autoSync = document.getElementById("supabaseAutoSyncToggle")?.checked ? "true" : "false";

  const urlInput = document.getElementById("supabaseUrlInput");
  const keyInput = document.getElementById("supabaseKeyInput");
  if (urlInput && url) urlInput.value = url;
  if (keyInput && key) keyInput.value = key;

  if (!url || !key) {
    showSupabaseFeedback("Please provide both Supabase URL and Anon Key before saving.", "error");
    toast.error("URL and Anon Key required");
    return;
  }

  localStorage.setItem(STORAGE_KEY_SUPABASE_URL, url);
  localStorage.setItem(STORAGE_KEY_SUPABASE_KEY, key);
  localStorage.setItem(STORAGE_KEY_SUPABASE_AUTOSYNC, autoSync);

  initSupabaseClient();
  showSupabaseFeedback("✓ Supabase configuration saved securely in local session.", "success");
  toast.success("Credentials saved to local storage");
  if (onSuccess) onSuccess();
}

export function disconnectSupabase(onDisconnect = null) {
  if (typeof window !== 'undefined' && !window.confirm("Disconnect Supabase cloud sync? Your local data will remain safe and intact.")) return;
  localStorage.removeItem(STORAGE_KEY_SUPABASE_URL);
  localStorage.removeItem(STORAGE_KEY_SUPABASE_KEY);
  localStorage.removeItem(STORAGE_KEY_SUPABASE_AUTOSYNC);
  supabaseClient = null;
  updateSupabaseUIStatus("disconnected");

  const urlInput = document.getElementById("supabaseUrlInput");
  const keyInput = document.getElementById("supabaseKeyInput");
  const autoSyncToggle = document.getElementById("supabaseAutoSyncToggle");
  if (urlInput) urlInput.value = "";
  if (keyInput) keyInput.value = "";
  if (autoSyncToggle) autoSyncToggle.checked = false;

  showSupabaseFeedback("Disconnected from Supabase. Working in offline local mode.", "info");
  toast.info("Supabase disconnected. Operating offline.");
  if (onDisconnect) onDisconnect();
}

export async function pushToSupabase(state, isSilent = false) {
  if (!supabaseClient) {
    initSupabaseClient();
  }
  if (!supabaseClient) {
    if (!isSilent) {
      showSupabaseFeedback("Supabase is not connected. Enter credentials and click 'Save Credentials'.", "error");
      toast.error("Supabase not connected");
    }
    return false;
  }

  try {
    if (!isSilent) showSupabaseFeedback("⬆️ Pushing local data to Supabase...", "info");
    updateSupabaseUIStatus("syncing");

    // 1. Properties
    const propRows = (state.properties || []).map(p => ({
      id: p.id,
      building: p.building || "Sagarpur",
      building_type: p.buildingType || p.building_type || "Residential",
      name: p.name || "",
      address: p.address || "",
      type: p.type || "1 BHK Residential Flat",
      super_area: Number(p.superArea !== undefined ? p.superArea : p.super_area) || 0,
      carpet_area: Number(p.carpetArea !== undefined ? p.carpetArea : p.carpet_area) || 0,
      common_area: Number(p.commonArea !== undefined ? p.commonArea : p.common_area) || 0,
      rent: Number(p.rent) || 0,
      deposit: Number(p.deposit) || 0,
      upic: p.upic || "",
      meter_no: p.meterNo || p.meter_no || ""
    }));
    if (propRows.length > 0) {
      const { error: pErr } = await supabaseClient.from("properties").upsert(propRows);
      if (pErr) throw pErr;
    }

    // 2. Tenants
    const tenantRows = (state.tenants || []).map(t => ({
      id: t.id,
      unit: t.unit || "",
      name: t.name || "",
      mobile: t.mobile || "",
      email: t.email || "",
      rent: Number(t.rent) || 0,
      os_amount: Number(t.osAmount !== undefined ? t.osAmount : t.os_amount) || 0,
      status: t.status || "Active",
      start_date: t.startDate || t.start_date || "",
      end_date: t.endDate || t.end_date || "",
      tenant_id_number: t.tenantIdNumber || t.tenant_id_number || "",
      perm_address: t.permAddress || t.perm_address || "",
      is_b2b: Boolean(t.isB2B || t.is_b2b || t.gstin),
      business_name: t.businessName || t.business_name || "",
      gstin: t.gstin || "",
      pan: t.pan || "",
      billing_address: t.billingAddress || t.billing_address || "",
      increment_period: t.incrementPeriod || t.increment_period || "Every Year",
      increment_pct: Number(t.incrementPct !== undefined ? t.incrementPct : (t.increment_pct !== undefined ? t.increment_pct : 10)),
      lock_in_period: t.lockInPeriod || t.lock_in_period || "1 Year (12 Months)",
      lease_period: t.leasePeriod || t.lease_period || "3 Years (36 Months)",
      b2b_increment_clause: t.b2bIncrementClause || t.b2b_increment_clause || "",
      area_sq_ft: Number(t.areaSqFt !== undefined ? t.areaSqFt : t.area_sq_ft) || 0,
      rent_per_sq_ft: Number(t.rentPerSqFt !== undefined ? t.rentPerSqFt : t.rent_per_sq_ft) || 0,
      cam_rate_per_sq_ft: Number(t.camRatePerSqFt !== undefined ? t.camRatePerSqFt : t.cam_rate_per_sq_ft) || 0,
      cam_amount: Number(t.camAmount !== undefined ? t.camAmount : t.cam_amount) || 0,
      auto_bill_cam_separate: t.autoBillCamSeparateInvoice !== undefined ? Boolean(t.autoBillCamSeparateInvoice) : (t.auto_bill_cam_separate !== undefined ? Boolean(t.auto_bill_cam_separate) : true)
    }));
    if (tenantRows.length > 0) {
      const { error: tErr } = await supabaseClient.from("tenants").upsert(tenantRows);
      if (tErr) throw tErr;
    }

    // 3. Ledger Installments
    const instRows = [];
    if (state.ledgerInstallments) {
      Object.entries(state.ledgerInstallments).forEach(([key, list]) => {
        if (Array.isArray(list)) {
          const firstUnderscore = key.indexOf("_");
          const propId = firstUnderscore > -1 ? key.slice(0, firstUnderscore) : key;
          const cycle = firstUnderscore > -1 ? key.slice(firstUnderscore + 1) : "";
          list.forEach((item, idx) => {
            instRows.push({
              id: `${propId}_${cycle}_${idx}`,
              prop_id: propId,
              cycle: cycle,
              installment_index: idx,
              date: item.date || "",
              amount: Number(item.amount) || 0,
              mode: item.mode || "UPI",
              ref: item.ref || ""
            });
          });
        }
      });
    }
    if (instRows.length > 0) {
      const { error: iErr } = await supabaseClient.from("ledger_installments").upsert(instRows);
      if (iErr) throw iErr;
    }

    // 4. Landlord
    if (state.landlord) {
      const { error: lErr } = await supabaseClient.from("landlord_settings").upsert({
        id: "primary",
        name: state.landlord.name || "Rajesh Sharma",
        pan: state.landlord.pan || "ABCPS1234D",
        phone: state.landlord.phone || "",
        email: state.landlord.email || "abcltd9925@gmail.com",
        address: state.landlord.address || ""
      });
      if (lErr) throw lErr;
    }

    updateSupabaseUIStatus("connected");
    if (!isSilent) {
      const msg = `✓ Push complete! Synchronized ${propRows.length} properties, ${tenantRows.length} tenants, ${instRows.length} ledger payments.`;
      showSupabaseFeedback(msg, "success");
      toast.success(msg, "Cloud Sync Completed");
    }
    return true;
  } catch (err) {
    console.error("Supabase push failed:", err);
    updateSupabaseUIStatus("error");
    if (!isSilent) {
      const errTxt = "✗ Push error: " + (err.message || "Failed to push records to Supabase");
      showSupabaseFeedback(errTxt, "error");
      toast.error(errTxt, "Push Failed");
    }
    return false;
  }
}

export async function pullFromSupabase(state, onUpdate = null) {
  if (!supabaseClient) {
    showSupabaseFeedback("Supabase is not connected. Enter credentials and click 'Save Credentials'.", "error");
    toast.error("Supabase not connected");
    return false;
  }

  try {
    showSupabaseFeedback("⬇️ Fetching records from Supabase Cloud...", "info");
    updateSupabaseUIStatus("syncing");

    // 1. Properties
    const { data: props, error: pErr } = await supabaseClient.from("properties").select("*").order("name");
    if (pErr) throw pErr;
    if (props && props.length > 0) {
      state.properties = props.map(r => ({
        id: r.id,
        building: r.building || "Sagarpur",
        buildingType: r.building_type || r.buildingType || "Residential",
        name: r.name || "",
        address: r.address || "",
        type: r.type || "1 BHK Residential Flat",
        superArea: Number(r.super_area !== undefined ? r.super_area : r.superArea) || 0,
        carpetArea: Number(r.carpet_area !== undefined ? r.carpet_area : r.carpetArea) || 0,
        commonArea: Number(r.common_area !== undefined ? r.common_area : r.commonArea) || 0,
        rent: Number(r.rent) || 12000,
        deposit: Number(r.deposit) || 24000,
        upic: r.upic || "",
        meterNo: r.meter_no || r.meterNo || ""
      }));
    }

    // 2. Tenants
    const { data: tenants, error: tErr } = await supabaseClient.from("tenants").select("*").order("name");
    if (tErr) throw tErr;
    if (tenants && tenants.length > 0) {
      state.tenants = tenants.map(r => ({
        id: r.id,
        unit: r.unit || "",
        name: r.name || "",
        mobile: r.mobile || "",
        email: r.email || "",
        rent: Number(r.rent) || 12000,
        osAmount: Number(r.os_amount !== undefined ? r.os_amount : r.osAmount) || 0,
        status: r.status || "Active",
        startDate: r.start_date || r.startDate || "",
        endDate: r.end_date || r.endDate || "",
        tenantIdNumber: r.tenant_id_number || r.tenantIdNumber || "",
        permAddress: r.perm_address || r.permAddress || "",
        isB2B: Boolean(r.is_b2b || r.isB2B || r.gstin),
        businessName: r.business_name || r.businessName || "",
        gstin: r.gstin || "",
        pan: r.pan || "",
        billingAddress: r.billing_address || r.billingAddress || "",
        incrementPeriod: r.increment_period || r.incrementPeriod || "Every Year",
        incrementPct: Number(r.increment_pct !== undefined ? r.increment_pct : (r.incrementPct !== undefined ? r.incrementPct : 10)),
        lockInPeriod: r.lock_in_period || r.lockInPeriod || "1 Year (12 Months)",
        leasePeriod: r.lease_period || r.leasePeriod || "3 Years (36 Months)",
        b2bIncrementClause: r.b2b_increment_clause || r.b2bIncrementClause || "",
        areaSqFt: Number(r.area_sq_ft !== undefined ? r.area_sq_ft : r.areaSqFt) || 0,
        rentPerSqFt: Number(r.rent_per_sq_ft !== undefined ? r.rent_per_sq_ft : r.rentPerSqFt) || 0,
        camRatePerSqFt: Number(r.cam_rate_per_sq_ft !== undefined ? r.cam_rate_per_sq_ft : r.camRatePerSqFt) || 0,
        camAmount: Number(r.cam_amount !== undefined ? r.cam_amount : r.camAmount) || 0,
        autoBillCamSeparateInvoice: r.auto_bill_cam_separate !== undefined ? Boolean(r.auto_bill_cam_separate) : (r.autoBillCamSeparateInvoice !== undefined ? Boolean(r.autoBillCamSeparateInvoice) : true)
      }));
    }

    // 3. Ledger Installments
    const { data: insts, error: iErr } = await supabaseClient.from("ledger_installments").select("*").order("installment_index", { ascending: true });
    if (iErr) throw iErr;
    if (insts) {
      const instMap = {};
      insts.forEach(r => {
        const key = `${r.prop_id}_${r.cycle}`;
        if (!instMap[key]) instMap[key] = [];
        instMap[key].push({
          date: r.date || "",
          amount: Number(r.amount) || 0,
          mode: r.mode || "UPI",
          ref: r.ref || ""
        });
      });
      state.ledgerInstallments = instMap;
    }

    // 4. Landlord (preserve extended GST & statutory settings)
    const { data: landlords, error: lErr } = await supabaseClient.from("landlord_settings").select("*").eq("id", "primary");
    if (!lErr && landlords && landlords.length > 0) {
      state.landlord = Object.assign({}, state.landlord || {}, {
        name: landlords[0].name || state.landlord.name,
        pan: landlords[0].pan || state.landlord.pan,
        phone: landlords[0].phone || state.landlord.phone || "",
        email: landlords[0].email || state.landlord.email || "abcltd9925@gmail.com",
        address: landlords[0].address || state.landlord.address || "",
        gstin: landlords[0].gstin || state.landlord.gstin || "07AAAAA0000A1Z5",
        tradeName: landlords[0].trade_name || landlords[0].tradeName || state.landlord.tradeName || "",
        state: landlords[0].state || state.landlord.state || "07 - Delhi",
        sacCode: landlords[0].sac_code || landlords[0].sacCode || state.landlord.sacCode || "997212"
      });
      const nameInput = document.getElementById("landlordNameInput");
      const panInput = document.getElementById("landlordPanInput");
      const emailInput = document.getElementById("landlordEmailInput");
      if (nameInput) nameInput.value = state.landlord.name;
      if (panInput) panInput.value = state.landlord.pan;
      if (emailInput) emailInput.value = state.landlord.email || "abcltd9925@gmail.com";
    }

    updateSupabaseUIStatus("connected");
    const msg = `✓ Pulled cloud data! Restored ${state.properties.length} properties, ${state.tenants.length} tenants.`;
    showSupabaseFeedback(msg, "success");
    toast.success(msg, "Data Restored from Cloud");

    if (onUpdate) onUpdate();
    return true;
  } catch (err) {
    console.error("Supabase pull failed:", err);
    updateSupabaseUIStatus("error");
    const errTxt = "✗ Pull error: " + (err.message || "Failed to fetch cloud records");
    showSupabaseFeedback(errTxt, "error");
    toast.error(errTxt, "Pull Failed");
    return false;
  }
}
