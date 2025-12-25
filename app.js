/* =========================================================
   Maylira Inventaris - Mockup (HTML/CSS/JS) + localStorage
   Catatan: ini hanya demo UI/flow, bukan security production.
========================================================= */

const STORAGE = {
  USERS: "mi_users",
  SESSION: "mi_session",
  EQUIP: "mi_equipment",
};

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

function nowISODate(){
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth()+1).padStart(2,"0");
  const dd = String(d.getDate()).padStart(2,"0");
  return `${yyyy}-${mm}-${dd}`;
}

function parseDate(s){
  // s: YYYY-MM-DD
  const [y,m,d] = s.split("-").map(Number);
  return new Date(y, m-1, d);
}

function daysDiff(fromDate, toDate){
  const ms = toDate.getTime() - fromDate.getTime();
  return Math.round(ms / (1000*60*60*24));
}

function load(key, fallback){
  try{
    const raw = localStorage.getItem(key);
    if(!raw) return fallback;
    return JSON.parse(raw);
  }catch{
    return fallback;
  }
}

function save(key, value){
  localStorage.setItem(key, JSON.stringify(value));
}

/* -------------------------
   Seed demo data (first run)
-------------------------- */
function ensureSeed(){
  const users = load(STORAGE.USERS, null);
  if(!users){
    const demoUser = {
      id: crypto.randomUUID(),
      name: "Akun Demo",
      role: "Supervisor",
      email: "demo@maylira.local",
      password: "demo123", // demo only
      createdAt: new Date().toISOString()
    };
    save(STORAGE.USERS, [demoUser]);
  }

  const equip = load(STORAGE.EQUIP, null);
  if(!equip){
    const today = parseDate(nowISODate());
    const plus = (n) => {
      const d = new Date(today);
      d.setDate(d.getDate() + n);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth()+1).padStart(2,"0");
      const dd = String(d.getDate()).padStart(2,"0");
      return `${yyyy}-${mm}-${dd}`;
    };

    const seed = [
      {
        id: crypto.randomUUID(),
        code: "MI-0001",
        name: "Full Body Harness - Petzl",
        category: "Fall Protection",
        location: "Gudang A",
        status: "Siap Pakai",
        lastInspection: plus(-12),
        nextMaintenance: plus(10),
        pic: "Tim HSE",
        serial: "SN-PZ-1182",
        notes: "Webbing bagus. Buckle OK.",
        updatedBy: "System",
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        code: "MI-0002",
        name: "Lanyard Double Hook",
        category: "Fall Protection",
        location: "Site B",
        status: "Perlu Inspeksi",
        lastInspection: plus(-45),
        nextMaintenance: plus(3),
        pic: "Workshop",
        serial: "LN-2H-040",
        notes: "Perlu cek stitching bagian ujung.",
        updatedBy: "System",
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        code: "MI-0003",
        name: "Tangga Fiberglass 6m",
        category: "Ladder",
        location: "Gudang A",
        status: "Tidak Layak",
        lastInspection: plus(-30),
        nextMaintenance: plus(-2),
        pic: "Logistik",
        serial: "",
        notes: "Retak pada step ke-3. Isolasi & label merah.",
        updatedBy: "System",
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }
    ];
    save(STORAGE.EQUIP, seed);
  }
}

/* -------------------------
   Session helpers
-------------------------- */
function getSession(){
  return load(STORAGE.SESSION, null);
}
function setSession(session){
  save(STORAGE.SESSION, session);
}
function clearSession(){
  localStorage.removeItem(STORAGE.SESSION);
}
function requireAuth(){
  const s = getSession();
  return !!(s && s.userId);
}

/* -------------------------
   Users
-------------------------- */
function getUsers(){
  return load(STORAGE.USERS, []);
}
function findUserByEmail(email){
  const users = getUsers();
  return users.find(u => u.email.toLowerCase() === email.toLowerCase());
}
function findUserById(id){
  const users = getUsers();
  return users.find(u => u.id === id);
}
function registerUser({name, role, email, password}){
  const users = getUsers();
  if(users.some(u => u.email.toLowerCase() === email.toLowerCase())){
    throw new Error("Email sudah terdaftar.");
  }
  const user = {
    id: crypto.randomUUID(),
    name, role, email,
    password, // demo only
    createdAt: new Date().toISOString()
  };
  users.push(user);
  save(STORAGE.USERS, users);
  return user;
}
function loginUser({email, password}){
  const user = findUserByEmail(email);
  if(!user) throw new Error("Email tidak ditemukan.");
  if(user.password !== password) throw new Error("Password salah.");
  setSession({
    userId: user.id,
    loginAt: new Date().toISOString()
  });
  return user;
}

/* -------------------------
   Equipment
-------------------------- */
function getEquipment(){
  return load(STORAGE.EQUIP, []);
}
function saveEquipment(list){
  save(STORAGE.EQUIP, list);
}
function nextCode(list){
  // MI-0001 style
  const max = list.reduce((acc, it) => {
    const m = /^MI-(\d+)$/.exec(it.code || "");
    const n = m ? Number(m[1]) : 0;
    return Math.max(acc, n);
  }, 0);
  const next = String(max + 1).padStart(4,"0");
  return `MI-${next}`;
}
function createEquipment(payload, updatedBy){
  const list = getEquipment();
  const item = {
    id: crypto.randomUUID(),
    code: nextCode(list),
    ...payload,
    updatedBy,
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString()
  };
  list.unshift(item);
  saveEquipment(list);
  return item;
}
function updateEquipment(id, payload, updatedBy){
  const list = getEquipment();
  const idx = list.findIndex(x => x.id === id);
  if(idx < 0) throw new Error("Data alat tidak ditemukan.");
  list[idx] = {
    ...list[idx],
    ...payload,
    updatedBy,
    updatedAt: new Date().toISOString()
  };
  saveEquipment(list);
  return list[idx];
}
function deleteEquipment(id){
  const list = getEquipment();
  const next = list.filter(x => x.id !== id);
  saveEquipment(next);
}

/* -------------------------
   UI helpers
-------------------------- */
function setHint(el, msg, ok=false){
  if(!el) return;
  el.textContent = msg || "";
  el.classList.toggle("ok", !!ok);
}

function badgeClass(status){
  switch(status){
    case "Siap Pakai": return "badge badge--ready";
    case "Perlu Inspeksi": return "badge badge--inspect";
    case "Perbaikan": return "badge badge--repair";
    case "Tidak Layak": return "badge badge--reject";
    default: return "badge";
  }
}

function formatDiffLabel(d){
  if(d === 0) return "Hari ini";
  if(d > 0) return `${d} hari lagi`;
  return `${Math.abs(d)} hari lewat`;
}

function renderTopbarUser(){
  const sess = getSession();
  const user = sess ? findUserById(sess.userId) : null;
  $("#userName").textContent = user?.name || "-";
  $("#userRole").textContent = user?.role || "-";
}

/* -------------------------
   Routing
-------------------------- */
const PAGES = ["login","register","home","create","edit","maintenance","reports","settings"];

function showPage(name){
  // Auth pages
  $$("#authLayout [data-page]").forEach(sec => sec.hidden = sec.dataset.page !== name);
  // App pages
  $$("#appLayout [data-page]").forEach(sec => sec.hidden = sec.dataset.page !== name);

  // Nav active
  $$("#appLayout .nav__item").forEach(a => {
    a.classList.toggle("is-active", a.dataset.nav === name);
  });
}

function showLayout(isAuth){
  $("#authLayout").hidden = !isAuth;
  $("#appLayout").hidden = isAuth;
  $("#topbar").setAttribute("aria-hidden", String(isAuth));
  $("#topbar").style.display = isAuth ? "none" : "flex";
}

function getRoute(){
  const hash = (location.hash || "#login").replace("#","");
  const [pagePart, queryPart] = hash.split("?");
  const page = PAGES.includes(pagePart) ? pagePart : "login";
  const params = new URLSearchParams(queryPart || "");
  return { page, params };
}

function router(){
  const { page, params } = getRoute();
  const authed = requireAuth();

  if(!authed && (page !== "login" && page !== "register")){
    location.hash = "#login";
    return;
  }
  if(authed && (page === "login" || page === "register")){
    location.hash = "#home";
    return;
  }

  showLayout(!authed);
  showPage(page);

  if(authed){
    renderTopbarUser();
    renderHome();          // safe to call; will no-op if not on home
    renderDueList();       // update pill + maintenance table if needed
    if(page === "edit"){
      const id = params.get("id");
      loadEditForm(id);
    }
  }
}

/* -------------------------
   Render: Home (table + stats)
-------------------------- */
function computeStats(list){
  const stats = {
    total: list.length,
    ready: list.filter(x => x.status === "Siap Pakai").length,
    inspect: list.filter(x => x.status === "Perlu Inspeksi").length,
    reject: list.filter(x => x.status === "Tidak Layak").length
  };
  return stats;
}

function applyFilters(list){
  const q = ($("#searchInput")?.value || "").trim().toLowerCase();
  const st = ($("#statusFilter")?.value || "").trim();

  return list.filter(it => {
    const blob = `${it.code} ${it.name} ${it.category} ${it.location} ${it.pic} ${it.serial || ""}`.toLowerCase();
    const okQ = !q || blob.includes(q);
    const okS = !st || it.status === st;
    return okQ && okS;
  });
}

function renderHome(){
  const route = getRoute();
  if(route.page !== "home") return;

  const all = getEquipment();
  const stats = computeStats(all);
  $("#statTotal").textContent = stats.total;
  $("#statReady").textContent = stats.ready;
  $("#statInspect").textContent = stats.inspect;
  $("#statReject").textContent = stats.reject;

  const list = applyFilters(all);
  const tbody = $("#equipmentTbody");
  tbody.innerHTML = "";

  list.forEach(it => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><b>${it.code}</b></td>
      <td>${escapeHtml(it.name)}</td>
      <td>${escapeHtml(it.category)}</td>
      <td>${escapeHtml(it.location)}</td>
      <td><span class="${badgeClass(it.status)}">${escapeHtml(it.status)}</span></td>
      <td>${escapeHtml(it.lastInspection)}</td>
      <td>${escapeHtml(it.nextMaintenance)}</td>
      <td>${escapeHtml(it.pic)}</td>
      <td>
        <div class="actions">
          <a class="actionlink" href="#edit?id=${encodeURIComponent(it.id)}">Edit</a>
          <button class="actionlink" data-action="detail" data-id="${it.id}" type="button">Detail</button>
          <button class="actionlink" data-action="delete" data-id="${it.id}" type="button">Hapus</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  $("#tableFoot").textContent = `${list.length} data (dari ${all.length})`;
}

function escapeHtml(str){
  return String(str ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

/* -------------------------
   Render: Maintenance (due list + pill)
-------------------------- */
function getDueItems(daysWindow){
  const today = parseDate(nowISODate());
  const list = getEquipment();
  return list
    .map(it => {
      const due = parseDate(it.nextMaintenance);
      const diff = daysDiff(today, due);
      return { ...it, diff };
    })
    .filter(it => {
      if(daysWindow === 0) return it.diff < 0;          // overdue
      return it.diff <= daysWindow;                     // due soon + overdue
    })
    .sort((a,b) => a.diff - b.diff);                    // overdue first
}

function renderDueList(){
  // update pill
  const due7 = getDueItems(7);
  $("#pillDue").textContent = String(due7.length);

  const route = getRoute();
  if(route.page !== "maintenance") return;

  const daysWindow = Number($("#dueFilter")?.value || "7");
  const items = getDueItems(daysWindow);

  const tbody = $("#dueTbody");
  tbody.innerHTML = "";

  items.forEach(it => {
    const tr = document.createElement("tr");
    const diffLabel = formatDiffLabel(it.diff);
    tr.innerHTML = `
      <td><b>${it.code}</b></td>
      <td>${escapeHtml(it.name)}</td>
      <td><span class="${badgeClass(it.status)}">${escapeHtml(it.status)}</span></td>
      <td>${escapeHtml(it.nextMaintenance)}</td>
      <td>${escapeHtml(diffLabel)}</td>
      <td>${escapeHtml(it.pic)}</td>
      <td>
        <div class="actions">
          <a class="actionlink" href="#edit?id=${encodeURIComponent(it.id)}">Edit</a>
          <button class="actionlink" data-action="detail" data-id="${it.id}" type="button">Detail</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  $("#dueFoot").textContent = `${items.length} data`;
}

/* -------------------------
   Forms
-------------------------- */
function setupForms(){
  // Login
  $("#loginForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") || "").trim();
    const password = String(fd.get("password") || "");
    const hint = $("#loginHint");

    try{
      const user = loginUser({email, password});
      setHint(hint, `Selamat datang, ${user.name}.`, true);
      location.hash = "#home";
    }catch(err){
      setHint(hint, err.message || "Gagal login.");
    }
  });

  // Demo quick
  $("#btnUseDemo").addEventListener("click", () => {
    try{
      loginUser({email: "demo@maylira.local", password: "demo123"});
      location.hash = "#home";
    }catch(err){
      setHint($("#loginHint"), err.message || "Gagal masuk demo.");
    }
  });

  // Register
  $("#registerForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") || "").trim();
    const role = String(fd.get("role") || "Admin").trim();
    const email = String(fd.get("email") || "").trim();
    const password = String(fd.get("password") || "");
    const password2 = String(fd.get("password2") || "");
    const hint = $("#registerHint");

    if(password !== password2){
      setHint(hint, "Konfirmasi password tidak sama.");
      return;
    }

    try{
      registerUser({name, role, email, password});
      setHint(hint, "Registrasi berhasil. Silakan login.", true);
      location.hash = "#login";
    }catch(err){
      setHint(hint, err.message || "Gagal registrasi.");
    }
  });

  // Create
  $("#createForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const sess = getSession();
    const user = sess ? findUserById(sess.userId) : null;

    const payload = {
      name: String(fd.get("name") || "").trim(),
      category: String(fd.get("category") || "").trim(),
      location: String(fd.get("location") || "").trim(),
      status: String(fd.get("status") || "").trim(),
      lastInspection: String(fd.get("lastInspection") || "").trim(),
      nextMaintenance: String(fd.get("nextMaintenance") || "").trim(),
      pic: String(fd.get("pic") || "").trim(),
      serial: String(fd.get("serial") || "").trim(),
      notes: String(fd.get("notes") || "").trim(),
    };

    try{
      createEquipment(payload, user?.name || "Unknown");
      setHint($("#createHint"), "Data alat tersimpan.", true);
      e.currentTarget.reset();
      location.hash = "#home";
    }catch(err){
      setHint($("#createHint"), err.message || "Gagal menyimpan.");
    }
  });

  // Edit
  $("#editForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const id = String(fd.get("id") || "");
    const sess = getSession();
    const user = sess ? findUserById(sess.userId) : null;

    const payload = {
      name: String(fd.get("name") || "").trim(),
      category: String(fd.get("category") || "").trim(),
      location: String(fd.get("location") || "").trim(),
      status: String(fd.get("status") || "").trim(),
      lastInspection: String(fd.get("lastInspection") || "").trim(),
      nextMaintenance: String(fd.get("nextMaintenance") || "").trim(),
      pic: String(fd.get("pic") || "").trim(),
      serial: String(fd.get("serial") || "").trim(),
      notes: String(fd.get("notes") || "").trim(),
    };

    try{
      updateEquipment(id, payload, user?.name || "Unknown");
      setHint($("#editHint"), "Data alat diperbarui.", true);
      location.hash = "#home";
    }catch(err){
      setHint($("#editHint"), err.message || "Gagal update.");
    }
  });
}

function loadEditForm(id){
  const hint = $("#editHint");
  setHint(hint, "");
  const form = $("#editForm");
  if(!id){
    setHint(hint, "ID tidak valid.");
    return;
  }
  const item = getEquipment().find(x => x.id === id);
  if(!item){
    setHint(hint, "Data alat tidak ditemukan.");
    return;
  }
  form.elements["id"].value = item.id;
  form.elements["code"].value = item.code;
  form.elements["status"].value = item.status;
  form.elements["name"].value = item.name;
  form.elements["category"].value = item.category;
  form.elements["location"].value = item.location;
  form.elements["pic"].value = item.pic;
  form.elements["lastInspection"].value = item.lastInspection;
  form.elements["nextMaintenance"].value = item.nextMaintenance;
  form.elements["serial"].value = item.serial || "";
  form.elements["notes"].value = item.notes || "";
  form.elements["updatedBy"].value = item.updatedBy || "-";
}

/* -------------------------
   Table actions (detail/delete)
-------------------------- */
function setupTableActions(){
  document.body.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if(!btn) return;

    const action = btn.dataset.action;
    const id = btn.dataset.id;
    if(!id) return;

    if(action === "delete"){
      const item = getEquipment().find(x => x.id === id);
      if(!item) return;
      const ok = confirm(`Hapus alat ${item.code} - ${item.name}?`);
      if(!ok) return;
      deleteEquipment(id);
      renderHome();
      renderDueList();
      return;
    }

    if(action === "detail"){
      const item = getEquipment().find(x => x.id === id);
      if(!item) return;
      openDetail(item);
      return;
    }
  });
}

/* -------------------------
   Modal detail
-------------------------- */
function openDetail(item){
  $("#detailTitle").textContent = `${item.code} • ${item.name}`;
  $("#detailSub").textContent = `${item.category} • ${item.location} • PIC: ${item.pic}`;

  const today = parseDate(nowISODate());
  const due = parseDate(item.nextMaintenance);
  const diff = daysDiff(today, due);

  $("#detailBody").innerHTML = `
    <div style="display:grid; gap:10px;">
      <div>
        <div class="muted">Status</div>
        <div><span class="${badgeClass(item.status)}">${escapeHtml(item.status)}</span></div>
      </div>

      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
        <div>
          <div class="muted">Inspeksi Terakhir</div>
          <div><b>${escapeHtml(item.lastInspection)}</b></div>
        </div>
        <div>
          <div class="muted">Due Pemeliharaan</div>
          <div><b>${escapeHtml(item.nextMaintenance)}</b> <span class="muted">(${escapeHtml(formatDiffLabel(diff))})</span></div>
        </div>
      </div>

      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
        <div>
          <div class="muted">Nomor Seri</div>
          <div>${escapeHtml(item.serial || "-")}</div>
        </div>
        <div>
          <div class="muted">Terakhir diubah</div>
          <div>${escapeHtml(item.updatedBy || "-")} <span class="muted">(${new Date(item.updatedAt).toLocaleString()})</span></div>
        </div>
      </div>

      <div>
        <div class="muted">Catatan</div>
        <div>${escapeHtml(item.notes || "-")}</div>
      </div>

      <div class="muted">
        Berikutnya, halaman detail ini bisa menampung: riwayat inspeksi, riwayat pemeliharaan, checklist, dan lampiran foto/dokumen.
      </div>
    </div>
  `;

  const modal = $("#detailModal");
  modal.showModal();
}

function setupModal(){
  $("#btnCloseModal").addEventListener("click", () => $("#detailModal").close());
}

/* -------------------------
   Logout + Filters bindings
-------------------------- */
function setupMisc(){
  $("#btnLogout").addEventListener("click", () => {
    clearSession();
    location.hash = "#login";
  });

  $("#searchInput")?.addEventListener("input", () => renderHome());
  $("#statusFilter")?.addEventListener("change", () => renderHome());
  $("#dueFilter")?.addEventListener("change", () => renderDueList());
}

/* -------------------------
   Init
-------------------------- */
function init(){
  ensureSeed();
  setupForms();
  setupTableActions();
  setupModal();
  setupMisc();

  window.addEventListener("hashchange", router);
  router();
}

document.addEventListener("DOMContentLoaded", init);
