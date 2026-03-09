import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';
import './theme.css';

// ── KV API helpers ────────────────────────────────────────────────
const api = {
  get: async (col) => {
    const r = await fetch(`/api/inventory?collection=${col}`);
    if (!r.ok) throw new Error(`GET ${col} failed: ${r.status}`);
    return r.json();
  },
  save: async (col, data) => {
    const r = await fetch(`/api/inventory?collection=${col}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!r.ok) throw new Error(`POST ${col} failed: ${r.status}`);
    return r.json();
  },
};

// ── Lookup constants ──────────────────────────────────────────────
const DEVICE_TYPES  = ['Desktop','Laptop','Tablet','Mobile Phone','Printer','Monitor','Server','Peripheral','Other'];
const OS_OPTIONS    = ['Windows 11 Pro','Windows 10 Pro','macOS Sonoma','macOS Ventura','iOS','Android','Chrome OS','Windows Server 2022','Linux','N/A'];
const DEPARTMENTS   = ['IT','Finance','HR','Sales','Marketing','Operations','Engineering','Management','Other'];
const COMPLIANCE    = ['Compliant','Non-Compliant','Pending','N/A'];
const DEVICE_STATUS = ['Active','In Storage','Decommissioned','Lost/Stolen','In Repair'];
const USER_STATUS   = ['Active','Disabled','Locked Out','Guest','Service Account'];
const M365_LICENSES = ['Microsoft 365 Business Basic','Microsoft 365 Business Standard','Microsoft 365 Business Premium','Microsoft 365 E3','Microsoft 365 E5','Office 365 E1','Office 365 E3','No License'];
const SW_CATEGORIES = ['Productivity','Security','Design','Development','ERP/CRM','Communication','Backup','OS','Utility','Other'];
const LICENSE_TYPES = ['Perpetual','Subscription (Annual)','Subscription (Monthly)','Per Device','Per User','Volume','OEM','Freeware','Open Source'];
const SW_STATUS_OPT = ['Active','Expired','Cancelled','Pending Renewal'];
const INSTALL_TYPES = ['Managed (Intune)','Manual','Pre-installed','Script/GPO','Other'];
const DEVICE_ICONS  = { Desktop:'🖥', Laptop:'💻', Tablet:'🪄', 'Mobile Phone':'📱', Printer:'🖨', Monitor:'🖵', Server:'🗄', Peripheral:'🖱', Other:'📦' };

// ── Seed data (used only when KV is empty) ────────────────────────
const SEED_DEVICES = [
  { id:1, assetTag:'IT-001', deviceName:'DESKTOP-ABCD01', deviceType:'Desktop', makeModel:'Dell OptiPlex 7090', serialNumber:'SN123456789', os:'Windows 11 Pro', osVersion:'23H2', ram:16, storage:512, cpu:'Intel Core i7-11700', azureDeviceId:'a1b2c3d4-e5f6-7890-abcd-ef1234567890', entraJoinDate:'2023-06-15', compliance:'Compliant', intuneManaged:'Yes', lastSync:'2025-01-10', assignedUser:'john.smith@company.com', secondaryUser:'', department:'IT', location:'HQ – Floor 2', bitlockerKeyId:'AABB1122CC334455', bitlockerRecovery:'123456-234567-345678-456789-567890-678901', purchaseDate:'2023-06-15', vendor:'Dell Technologies', purchaseCost:1200, warrantyExpiry:'2026-06-14', supportContract:'Dell ProSupport', endOfLife:'2028-06-15', status:'Active', notes:'Primary workstation' },
  { id:2, assetTag:'IT-002', deviceName:'LAPTOP-XYZ99', deviceType:'Laptop', makeModel:'Lenovo ThinkPad X1 Carbon', serialNumber:'SN987654321', os:'Windows 11 Pro', osVersion:'23H2', ram:16, storage:256, cpu:'Intel Core i5-1235U', azureDeviceId:'b2c3d4e5-f6a7-8901-bcde-f12345678901', entraJoinDate:'2024-01-10', compliance:'Compliant', intuneManaged:'Yes', lastSync:'2025-01-09', assignedUser:'jane.doe@company.com', secondaryUser:'', department:'Finance', location:'HQ – Floor 3', bitlockerKeyId:'BBCC2233DD445566', bitlockerRecovery:'234567-345678-456789-567890-678901-789012', purchaseDate:'2024-01-10', vendor:'Lenovo', purchaseCost:1450, warrantyExpiry:'2027-01-09', supportContract:'Lenovo Premier', endOfLife:'2029-01-10', status:'Active', notes:'' },
  { id:3, assetTag:'IT-003', deviceName:'LAPTOP-MKT01', deviceType:'Laptop', makeModel:'Apple MacBook Pro 14', serialNumber:'SN-MAC-0042', os:'macOS Sonoma', osVersion:'14.3', ram:18, storage:512, cpu:'Apple M3 Pro', azureDeviceId:'c3d4e5f6-a7b8-9012-cdef-123456789012', entraJoinDate:'2024-03-01', compliance:'Compliant', intuneManaged:'Yes', lastSync:'2025-01-08', assignedUser:'alice.brown@company.com', secondaryUser:'', department:'Marketing', location:'HQ – Floor 4', bitlockerKeyId:'N/A', bitlockerRecovery:'N/A', purchaseDate:'2024-03-01', vendor:'Apple', purchaseCost:2499, warrantyExpiry:'2027-03-01', supportContract:'AppleCare+', endOfLife:'2030-03-01', status:'Active', notes:'Design workstation' },
];
const SEED_USERS = [
  { id:1, employeeId:'EMP-001', fullName:'John Smith', email:'john.smith@company.com', jobTitle:'IT Coordinator', department:'IT', manager:'ceo@company.com', location:'HQ – Floor 2', phone:'+1-555-0101', mobile:'+1-555-0201', accountStatus:'Active', accountType:'Member', azureObjectId:'11111111-aaaa-bbbb-cccc-000000000001', lastSignIn:'2025-01-09', createdDate:'2020-03-01', mfaEnabled:'Yes', m365License:'Microsoft 365 Business Premium', m365Apps:'Word, Excel, Outlook, Teams, SharePoint, Intune', primaryDevice:'IT-001', allDevices:'IT-001; IT-006', oneDriveQuota:50, mailboxSize:45, groups:'IT-Team; All-Staff; IT-Admins', notes:'IT Coordinator – Entra admin' },
  { id:2, employeeId:'EMP-002', fullName:'Jane Doe', email:'jane.doe@company.com', jobTitle:'Finance Manager', department:'Finance', manager:'cfo@company.com', location:'HQ – Floor 3', phone:'+1-555-0102', mobile:'+1-555-0202', accountStatus:'Active', accountType:'Member', azureObjectId:'22222222-aaaa-bbbb-cccc-000000000002', lastSignIn:'2025-01-10', createdDate:'2019-07-15', mfaEnabled:'Yes', m365License:'Microsoft 365 Business Premium', m365Apps:'Word, Excel, Outlook, Teams, SharePoint, Power BI', primaryDevice:'IT-002', allDevices:'IT-002', oneDriveQuota:50, mailboxSize:32, groups:'Finance-Team; All-Staff', notes:'' },
  { id:3, employeeId:'EMP-003', fullName:'Alice Brown', email:'alice.brown@company.com', jobTitle:'Marketing Designer', department:'Marketing', manager:'marketing.mgr@company.com', location:'HQ – Floor 4', phone:'+1-555-0103', mobile:'+1-555-0203', accountStatus:'Active', accountType:'Member', azureObjectId:'33333333-aaaa-bbbb-cccc-000000000003', lastSignIn:'2025-01-08', createdDate:'2021-05-10', mfaEnabled:'Yes', m365License:'Microsoft 365 E3', m365Apps:'Word, Excel, Outlook, Teams, SharePoint, Adobe CC', primaryDevice:'IT-003', allDevices:'IT-003; IT-004', oneDriveQuota:100, mailboxSize:28, groups:'Marketing-Team; All-Staff', notes:'Adobe CC licensed separately' },
];
const SEED_SOFTWARE = [
  { id:1, licenseId:'LIC-001', softwareName:'Microsoft 365 Business Premium', vendor:'Microsoft', category:'Productivity', version:'Latest', licenseType:'Subscription (Annual)', licenseKey:'Managed via M365 Admin Centre', totalSeats:25, usedSeats:7, purchaseDate:'2024-01-01', expiryDate:'2025-01-01', annualCost:3500, costPerSeat:140, supportEmail:'m365support@microsoft.com', supportPhone:'+1-800-642-7676', contractPO:'PO-2024-001', autoRenew:'Yes', status:'Active', notes:'Covers all M365 apps + Intune + Defender' },
  { id:2, licenseId:'LIC-002', softwareName:'Adobe Creative Cloud', vendor:'Adobe', category:'Design', version:'2024', licenseType:'Subscription (Annual)', licenseKey:'Managed via Adobe Admin Console', totalSeats:3, usedSeats:1, purchaseDate:'2024-03-01', expiryDate:'2025-03-01', annualCost:1800, costPerSeat:600, supportEmail:'adobe-support@adobe.com', supportPhone:'+1-800-833-6687', contractPO:'PO-2024-002', autoRenew:'Yes', status:'Active', notes:'1 named user – Alice Brown' },
  { id:3, licenseId:'LIC-004', softwareName:'AutoCAD 2024', vendor:'Autodesk', category:'Design', version:'2024', licenseType:'Subscription (Annual)', licenseKey:'XXXX-XXXX-XXXX-XXXX-0042', totalSeats:2, usedSeats:0, purchaseDate:'2023-06-01', expiryDate:'2024-06-01', annualCost:1800, costPerSeat:900, supportEmail:'autodesk.support@autodesk.com', supportPhone:'+1-800-438-4239', contractPO:'PO-2023-007', autoRenew:'No', status:'Expired', notes:'RENEWAL REQUIRED' },
];
const SEED_SWMAP = [
  { id:1, assetTag:'IT-001', deviceName:'DESKTOP-ABCD01', assignedUser:'john.smith@company.com', softwareName:'Microsoft 365 Business Premium', licenseId:'LIC-001', version:'M365 Apps', installDate:'2023-06-15', lastUpdated:'2025-01-10', installType:'Managed (Intune)', approved:'Yes', notes:'' },
  { id:2, assetTag:'IT-002', deviceName:'LAPTOP-XYZ99', assignedUser:'jane.doe@company.com', softwareName:'Microsoft 365 Business Premium', licenseId:'LIC-001', version:'M365 Apps', installDate:'2024-01-10', lastUpdated:'2025-01-09', installType:'Managed (Intune)', approved:'Yes', notes:'' },
  { id:3, assetTag:'IT-003', deviceName:'LAPTOP-MKT01', assignedUser:'alice.brown@company.com', softwareName:'Adobe Creative Cloud', licenseId:'LIC-002', version:'2024.5', installDate:'2024-03-05', lastUpdated:'2024-12-15', installType:'Manual', approved:'Yes', notes:'Named user license' },
];

// ── Helpers ───────────────────────────────────────────────────────
function warrantyStatus(expiry) {
  if (!expiry || expiry === 'N/A') return null;
  const days = Math.ceil((new Date(expiry) - new Date()) / 86400000);
  if (days < 0)   return { label:'Expired',       color:'#ef4444', bg:'#fef2f2' };
  if (days <= 90) return { label:`${days}d left`,  color:'#f59e0b', bg:'#fffbeb' };
  return             { label:'Active',           color:'#22c55e', bg:'#f0fdf4' };
}
function licenseStatus(expiry, status) {
  if (status === 'Expired') return { label:'Expired', color:'#ef4444', bg:'#fef2f2' };
  if (!expiry) return { label: status || 'Active', color:'#22c55e', bg:'#f0fdf4' };
  const days = Math.ceil((new Date(expiry) - new Date()) / 86400000);
  if (days < 0)   return { label:'Expired',       color:'#ef4444', bg:'#fef2f2' };
  if (days <= 90) return { label:`${days}d left`,  color:'#f59e0b', bg:'#fffbeb' };
  return             { label:'Active',           color:'#22c55e', bg:'#f0fdf4' };
}

// ── Design tokens (JS side – references CSS vars) ─────────────────
const T = {
  card:    { background:'var(--bg-card)', borderRadius:12, boxShadow:'var(--shadow-card)', border:'1px solid var(--border)' },
  input:   { padding:'8px 10px', borderRadius:7, border:'1px solid var(--border)', fontSize:13, outline:'none', background:'var(--bg-input)', color:'var(--text-primary)', width:'100%', boxSizing:'border-box' },
  tdBase:  { padding:'10px 13px', borderBottom:'1px solid var(--border-table)', verticalAlign:'middle', color:'var(--text-primary)' },
};

// ── Pill ──────────────────────────────────────────────────────────
const Pill = ({ label, color, bg }) => (
  <span style={{ background:bg, color, fontWeight:600, fontSize:11,
    padding:'2px 9px', borderRadius:99, border:`1px solid ${color}33`, whiteSpace:'nowrap' }}>{label}</span>
);

// ── Field ─────────────────────────────────────────────────────────
function Field({ label, value, onChange, type='text', opts, wide, readOnly }) {
  const el = opts
    ? <select value={value??''} onChange={e=>onChange(e.target.value)} style={T.input} disabled={readOnly}>
        {opts.map(o=><option key={o}>{o}</option>)}
      </select>
    : type === 'textarea'
      ? <textarea value={value??''} onChange={e=>onChange(e.target.value)} style={{...T.input,minHeight:56,resize:'vertical'}} readOnly={readOnly}/>
      : <input type={type} value={value??''} onChange={e=>onChange(e.target.value)} style={T.input} readOnly={readOnly}/>;
  return (
    <div style={{ gridColumn:wide?'1/-1':undefined, display:'flex', flexDirection:'column', gap:3 }}>
      <label style={{ fontSize:11, fontWeight:600, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:.5 }}>{label}</label>
      {el}
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────
function Modal({ title, onClose, onSave, saving, children }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'var(--bg-overlay)', zIndex:1000,
      display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:'var(--bg-modal)', borderRadius:16, width:'100%', maxWidth:900,
        maxHeight:'92vh', overflow:'auto', boxShadow:'var(--shadow-modal)', border:'1px solid var(--border)' }}>
        <div style={{ padding:'18px 26px', background:'var(--bg-header)', borderRadius:'16px 16px 0 0',
          display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ color:'var(--text-header)', fontWeight:700, fontSize:15 }}>{title}</span>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'var(--text-header)', fontSize:22, cursor:'pointer' }}>✕</button>
        </div>
        <div style={{ padding:26 }}>
          {children}
          <div style={{ marginTop:22, display:'flex', gap:10, justifyContent:'flex-end' }}>
            <button onClick={onClose} style={{ padding:'9px 20px', borderRadius:8, border:'1px solid var(--border)',
              background:'var(--bg-card-alt)', cursor:'pointer', fontWeight:600, fontSize:13, color:'var(--text-primary)' }}>Cancel</button>
            <button onClick={onSave} disabled={saving} style={{ padding:'9px 22px', borderRadius:8, border:'none',
              background: saving ? '#64748b' : 'var(--bg-header)', color:'#fff', cursor: saving?'default':'pointer', fontWeight:700, fontSize:13 }}>
              {saving ? '⏳ Saving…' : '💾 Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Detail Panel ──────────────────────────────────────────────────
function DetailPanel({ title, icon, subtitle, tags, sections, onClose, onEdit }) {
  return (
    <div style={{ position:'fixed', right:0, top:0, bottom:0, width:450,
      background:'var(--bg-modal)', boxShadow:'var(--shadow-panel)',
      zIndex:500, display:'flex', flexDirection:'column', border:'none',
      borderLeft:'1px solid var(--border)' }}>
      <div style={{ padding:'18px 22px', background:'var(--bg-header)', display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <div style={{ color:'var(--text-header)', fontWeight:700, fontSize:17 }}>{icon} {title}</div>
          {subtitle && <div style={{ color:'var(--text-header-sub)', fontSize:12, marginTop:3 }}>{subtitle}</div>}
        </div>
        <button onClick={onClose} style={{ background:'none', border:'none', color:'var(--text-header)', fontSize:22, cursor:'pointer' }}>✕</button>
      </div>
      {tags?.filter(Boolean).length > 0 && (
        <div style={{ padding:'10px 18px', display:'flex', gap:7, flexWrap:'wrap',
          borderBottom:'1px solid var(--border)', background:'var(--bg-card-alt)' }}>
          {tags.filter(Boolean).map((t,i) => <Pill key={i} {...t} />)}
        </div>
      )}
      <div style={{ overflowY:'auto', flex:1, padding:'14px 18px' }}>
        {sections.map(({ heading, rows }) => (
          <div key={heading} style={{ marginBottom:16 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--text-secondary)', textTransform:'uppercase',
              letterSpacing:.7, borderBottom:'1px solid var(--border)', paddingBottom:4, marginBottom:6 }}>{heading}</div>
            {rows.filter(r=>r.value).map(({ label, value }) => (
              <div key={label} style={{ display:'flex', gap:8, padding:'5px 0', borderBottom:'1px solid var(--border-table)' }}>
                <div style={{ width:165, fontSize:12, color:'var(--text-secondary)', fontWeight:600, flexShrink:0 }}>{label}</div>
                <div style={{ fontSize:13, color:'var(--text-primary)', wordBreak:'break-all' }}>{value}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div style={{ padding:'14px 18px', borderTop:'1px solid var(--border)' }}>
        <button onClick={onEdit} style={{ width:'100%', padding:10, borderRadius:9, background:'var(--bg-header)',
          color:'#fff', border:'none', fontWeight:700, fontSize:13, cursor:'pointer' }}>✏️ Edit Record</button>
      </div>
    </div>
  );
}

// ── Table shell ───────────────────────────────────────────────────
function TableHeader({ cols, color }) {
  return (
    <thead>
      <tr style={{ background: color || 'var(--bg-header)' }}>
        {cols.map(h => (
          <th key={h} style={{ padding:'11px 13px', textAlign:'left', color:'#fff', fontWeight:600, fontSize:12, whiteSpace:'nowrap' }}>{h}</th>
        ))}
      </tr>
    </thead>
  );
}
function EmptyRow({ cols }) {
  return <tr><td colSpan={cols} style={{ padding:40, textAlign:'center', color:'var(--text-muted)', fontSize:13 }}>
    No records found. Try adjusting your filters or add a new record.
  </td></tr>;
}
function SearchBar({ value, onChange, placeholder }) {
  return <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
    style={{ flex:1, minWidth:220, ...T.input, borderRadius:9, padding:'9px 14px' }} />;
}
function FilterSelect({ value, onChange, opts, placeholder }) {
  return (
    <select value={value} onChange={e=>onChange(e.target.value)}
      style={{ ...T.input, width:'auto', padding:'9px 11px', borderRadius:9, cursor:'pointer' }}>
      <option value="All">{placeholder}</option>
      {opts.map(o=><option key={o}>{o}</option>)}
    </select>
  );
}

const btnBase = { padding:'4px 10px', borderRadius:6, border:'1px solid var(--border)', background:'var(--bg-card-alt)', cursor:'pointer', fontSize:12, color:'var(--text-primary)' };
const btnDanger = { ...btnBase, borderColor:'#fca5a5', background:'#fff1f2', color:'#ef4444' };
const btnPrimary = (bg='var(--bg-header)') => ({ padding:'9px 16px', borderRadius:8, background:bg, color:'#fff', border:'none', fontWeight:700, fontSize:13, cursor:'pointer' });

// ── Import / Export ───────────────────────────────────────────────
function ImportExportBar({ devices, users, software, swMap, onImport }) {
  const fileRef = useRef();
  const [importTarget, setImportTarget] = useState('devices');

  const exportAll = () => {
    const wb = XLSX.utils.book_new();
    const sheets = { Devices: devices, Users: users, 'Software & Licenses': software, 'Install Map': swMap };
    Object.entries(sheets).forEach(([name, data]) => {
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, name);
    });
    XLSX.writeFile(wb, `IT_Inventory_Export_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const exportSheet = (name, data) => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, name);
    XLSX.writeFile(wb, `IT_${name}_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const wb = XLSX.read(ev.target.result, { type:'binary' });

      // Try to auto-detect sheet from file
      const sheetMap = { devices:'Devices', users:'Users', software:'Software & Licenses', swmap:'Install Map' };
      const parsed = {};
      Object.entries(sheetMap).forEach(([key, sheetName]) => {
        if (wb.SheetNames.includes(sheetName)) {
          parsed[key] = XLSX.utils.sheet_to_json(wb.Sheets[sheetName]);
        }
      });

      // If full export detected (multiple sheets), import all
      if (Object.keys(parsed).length > 1) {
        onImport(parsed);
      } else {
        // Single-sheet import
        const firstSheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(firstSheet);
        onImport({ [importTarget]: rows });
      }
      e.target.value = '';
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap',
      padding:'10px 16px', background:'var(--bg-card-alt)', borderRadius:10,
      border:'1px solid var(--border)', marginBottom:18 }}>
      <span style={{ fontSize:12, fontWeight:700, color:'var(--text-secondary)', marginRight:4 }}>📤 EXPORT</span>
      <button onClick={exportAll} style={{ ...btnBase, fontWeight:600 }}>📥 All Sheets (.xlsx)</button>
      <button onClick={()=>exportSheet('Devices', devices)} style={btnBase}>Devices</button>
      <button onClick={()=>exportSheet('Users', users)} style={btnBase}>Users</button>
      <button onClick={()=>exportSheet('Software', software)} style={btnBase}>Software</button>

      <div style={{ width:1, height:24, background:'var(--border)', margin:'0 4px' }}/>

      <span style={{ fontSize:12, fontWeight:700, color:'var(--text-secondary)', marginRight:4 }}>📂 IMPORT</span>
      <select value={importTarget} onChange={e=>setImportTarget(e.target.value)}
        style={{ ...T.input, width:'auto', padding:'6px 10px', borderRadius:7, fontSize:12 }}>
        <option value="devices">Devices</option>
        <option value="users">Users</option>
        <option value="software">Software</option>
        <option value="swmap">Install Map</option>
      </select>
      <button onClick={()=>fileRef.current.click()} style={{ ...btnBase, fontWeight:600 }}>
        📂 Import .xlsx / .csv
      </button>
      <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} style={{ display:'none' }} />
      <span style={{ fontSize:11, color:'var(--text-muted)' }}>Full export xlsx re-imports all sheets automatically</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// DEVICE SECTION
// ═══════════════════════════════════════════════════════════════════
const E_DEV = { assetTag:'', deviceName:'', deviceType:'Desktop', makeModel:'', serialNumber:'', os:'Windows 11 Pro', osVersion:'', ram:'', storage:'', cpu:'', azureDeviceId:'', entraJoinDate:'', compliance:'Compliant', intuneManaged:'Yes', lastSync:'', assignedUser:'', secondaryUser:'', department:'IT', location:'', bitlockerKeyId:'', bitlockerRecovery:'', purchaseDate:'', vendor:'', purchaseCost:'', warrantyExpiry:'', supportContract:'', endOfLife:'', status:'Active', notes:'' };

function DeviceSection({ devices, onSave, swMap }) {
  const [search, setSearch] = useState('');
  const [fType, setFType] = useState('All');
  const [fDept, setFDept] = useState('All');
  const [fComp, setFComp] = useState('All');
  const [selected, setSelected] = useState(null);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(E_DEV);
  const [saving, setSaving] = useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const filtered = useMemo(() => devices.filter(d => {
    const q = search.toLowerCase();
    return (!q || [d.assetTag,d.deviceName,d.makeModel,d.assignedUser,d.serialNumber,d.azureDeviceId].some(v=>String(v||'').toLowerCase().includes(q)))
      && (fType==='All'||d.deviceType===fType) && (fDept==='All'||d.department===fDept) && (fComp==='All'||d.compliance===fComp);
  }), [devices,search,fType,fDept,fComp]);

  const openNew  = () => { setForm({...E_DEV}); setModal(true); };
  const openEdit = d  => { setForm({...d}); setModal(true); };
  const save = async () => {
    setSaving(true);
    let updated;
    if (form.id) { updated = devices.map(d=>d.id===form.id?form:d); setSelected(form); }
    else { updated = [{...form, id:Date.now()}, ...devices]; }
    await onSave('devices', updated);
    setSaving(false); setModal(false);
  };
  const del = async id => {
    if (!window.confirm('Delete device?')) return;
    await onSave('devices', devices.filter(d=>d.id!==id));
    setSelected(null);
  };

  const dSw = selected ? swMap.filter(s=>s.assetTag===selected.assetTag) : [];
  const COMP_C = { Compliant:'#22c55e', 'Non-Compliant':'#ef4444', Pending:'#f59e0b', 'N/A':'#94a3b8' };

  return (
    <div>
      <div style={{ display:'flex', gap:9, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
        <SearchBar value={search} onChange={setSearch} placeholder="🔍  Search devices, users, serials, Azure IDs…"/>
        <FilterSelect value={fType} onChange={setFType} opts={DEVICE_TYPES} placeholder="All Types"/>
        <FilterSelect value={fDept} onChange={setFDept} opts={DEPARTMENTS} placeholder="All Depts"/>
        <FilterSelect value={fComp} onChange={setFComp} opts={COMPLIANCE} placeholder="Compliance"/>
        <span style={{ fontSize:12, color:'var(--text-muted)' }}>{filtered.length}/{devices.length}</span>
        <button onClick={openNew} style={{ ...btnPrimary(), marginLeft:'auto' }}>+ Add Device</button>
      </div>

      <div style={{ ...T.card, overflow:'hidden', marginRight:selected?455:0, transition:'margin .2s' }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <TableHeader cols={['Asset Tag','Device','Type','Model','User','Dept','OS','Compliance','Warranty','Status','']}/>
            <tbody>
              {filtered.length===0 && <EmptyRow cols={11}/>}
              {filtered.map((d,i) => {
                const ws = warrantyStatus(d.warrantyExpiry);
                const sel = selected?.id===d.id;
                return (
                  <tr key={d.id} onClick={()=>setSelected(sel?null:d)}
                    style={{ background:sel?'var(--bg-row-hover)':i%2===0?'var(--bg-row-even)':'var(--bg-row-odd)',
                      cursor:'pointer', borderLeft:`3px solid ${sel?'#3b82f6':'transparent'}`, transition:'background .1s' }}>
                    <td style={T.tdBase}><code style={{ fontSize:11, background:'var(--code-bg)', color:'var(--code-text)', padding:'2px 6px', borderRadius:4, fontFamily:'IBM Plex Mono, monospace' }}>{d.assetTag}</code></td>
                    <td style={T.tdBase}><span style={{ fontWeight:600 }}>{DEVICE_ICONS[d.deviceType]} {d.deviceName}</span></td>
                    <td style={T.tdBase}>{d.deviceType}</td>
                    <td style={T.tdBase}>{d.makeModel}</td>
                    <td style={T.tdBase}><span style={{ fontSize:12, color:'var(--text-link)' }}>{d.assignedUser || <em style={{color:'var(--text-muted)'}}>Unassigned</em>}</span></td>
                    <td style={T.tdBase}>{d.department}</td>
                    <td style={T.tdBase}><span style={{ fontSize:11 }}>{d.os}</span></td>
                    <td style={T.tdBase}><Pill label={d.compliance} color={COMP_C[d.compliance]||'#94a3b8'} bg={(COMP_C[d.compliance]||'#94a3b8')+'22'}/></td>
                    <td style={T.tdBase}>{ws?<Pill {...ws}/>:<span style={{color:'var(--text-muted)'}}>—</span>}</td>
                    <td style={T.tdBase}><span style={{ fontSize:11, color:'var(--text-secondary)' }}>{d.status}</span></td>
                    <td style={T.tdBase}>
                      <div style={{ display:'flex', gap:5 }}>
                        <button onClick={e=>{e.stopPropagation();openEdit(d)}} style={btnBase}>✏️</button>
                        <button onClick={e=>{e.stopPropagation();del(d.id)}} style={btnDanger}>🗑</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <DetailPanel title={selected.deviceName} icon={DEVICE_ICONS[selected.deviceType]} subtitle={selected.assetTag}
          onClose={()=>setSelected(null)} onEdit={()=>openEdit(selected)}
          tags={[
            {label:selected.deviceType, color:'#3b82f6', bg:'#3b82f622'},
            {label:selected.compliance, color:COMP_C[selected.compliance]||'#94a3b8', bg:(COMP_C[selected.compliance]||'#94a3b8')+'22'},
            warrantyStatus(selected.warrantyExpiry),
          ]}
          sections={[
            {heading:'🔧 Hardware', rows:[
              {label:'Make / Model',    value:selected.makeModel},
              {label:'Serial Number',  value:selected.serialNumber},
              {label:'CPU',            value:selected.cpu},
              {label:'RAM',            value:selected.ram?`${selected.ram} GB`:null},
              {label:'Storage',        value:selected.storage?`${selected.storage} GB`:null},
              {label:'OS',             value:`${selected.os} ${selected.osVersion}`},
            ]},
            {heading:'☁️ Azure AD / Entra', rows:[
              {label:'Device ID',      value:selected.azureDeviceId},
              {label:'Join Date',      value:selected.entraJoinDate},
              {label:'Compliance',     value:selected.compliance},
              {label:'Intune Managed', value:selected.intuneManaged},
              {label:'Last Sync',      value:selected.lastSync},
            ]},
            {heading:'👤 Assignment', rows:[
              {label:'Assigned User',  value:selected.assignedUser},
              {label:'Secondary User', value:selected.secondaryUser},
              {label:'Department',     value:selected.department},
              {label:'Location',       value:selected.location},
            ]},
            {heading:'🔐 BitLocker', rows:[
              {label:'Key ID',         value:selected.bitlockerKeyId},
              {label:'Recovery Key',   value:selected.bitlockerRecovery},
            ]},
            {heading:'📋 Procurement', rows:[
              {label:'Vendor',         value:selected.vendor},
              {label:'Purchase Date',  value:selected.purchaseDate},
              {label:'Cost',           value:selected.purchaseCost?`$${selected.purchaseCost}`:null},
              {label:'Warranty Expiry',value:selected.warrantyExpiry},
              {label:'Support',        value:selected.supportContract},
              {label:'End of Life',    value:selected.endOfLife},
              {label:'Notes',          value:selected.notes},
            ]},
            {heading:'📦 Installed Software', rows:
              dSw.length>0 ? dSw.map(s=>({label:s.licenseId, value:`${s.softwareName} v${s.version}`}))
              : [{label:'',value:'No software mapped to this device yet'}]
            },
          ]}
        />
      )}

      {modal && (
        <Modal title={form.id?'✏️ Edit Device':'➕ Add Device'} onClose={()=>setModal(false)} onSave={save} saving={saving}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:13 }}>
            {[['Asset Tag','assetTag'],['Device Name','deviceName'],['Serial Number','serialNumber'],['Make / Model','makeModel'],['CPU','cpu'],['OS Version','osVersion'],['Azure AD Device ID','azureDeviceId'],['Assigned User','assignedUser'],['Secondary User','secondaryUser'],['Location','location'],['Vendor','vendor'],['Support Contract','supportContract']].map(([l,k])=>(
              <Field key={k} label={l} value={form[k]} onChange={v=>set(k,v)}/>
            ))}
            {[['Device Type','deviceType',DEVICE_TYPES],['OS','os',OS_OPTIONS],['Department','department',DEPARTMENTS],['Compliance','compliance',COMPLIANCE],['Intune Managed','intuneManaged',['Yes','No','N/A']],['Status','status',DEVICE_STATUS]].map(([l,k,o])=>(
              <Field key={k} label={l} value={form[k]} onChange={v=>set(k,v)} opts={o}/>
            ))}
            {[['RAM (GB)','ram'],['Storage (GB)','storage'],['Purchase Cost ($)','purchaseCost']].map(([l,k])=>(
              <Field key={k} label={l} value={form[k]} onChange={v=>set(k,v)} type="number"/>
            ))}
            {[['Entra Join Date','entraJoinDate'],['Last Sync','lastSync'],['Purchase Date','purchaseDate'],['Warranty Expiry','warrantyExpiry'],['End of Life','endOfLife']].map(([l,k])=>(
              <Field key={k} label={l} value={form[k]} onChange={v=>set(k,v)} type="date"/>
            ))}
            <Field label="BitLocker Key ID" value={form.bitlockerKeyId} onChange={v=>set('bitlockerKeyId',v)} wide/>
            <Field label="BitLocker Recovery Key" value={form.bitlockerRecovery} onChange={v=>set('bitlockerRecovery',v)} wide/>
            <Field label="Notes" value={form.notes} onChange={v=>set('notes',v)} type="textarea" wide/>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// USER SECTION
// ═══════════════════════════════════════════════════════════════════
const E_USR = { employeeId:'', fullName:'', email:'', jobTitle:'', department:'IT', manager:'', location:'', phone:'', mobile:'', accountStatus:'Active', accountType:'Member', azureObjectId:'', lastSignIn:'', createdDate:'', mfaEnabled:'Yes', m365License:'Microsoft 365 Business Standard', m365Apps:'', primaryDevice:'', allDevices:'', oneDriveQuota:'', mailboxSize:'', groups:'', notes:'' };

function UserSection({ users, onSave, devices }) {
  const [search, setSearch] = useState('');
  const [fDept, setFDept] = useState('All');
  const [fStatus, setFStatus] = useState('All');
  const [selected, setSelected] = useState(null);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(E_USR);
  const [saving, setSaving] = useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const filtered = useMemo(()=>users.filter(u=>{
    const q=search.toLowerCase();
    return (!q||[u.fullName,u.email,u.jobTitle,u.employeeId,u.azureObjectId].some(v=>String(v||'').toLowerCase().includes(q)))
      &&(fDept==='All'||u.department===fDept)&&(fStatus==='All'||u.accountStatus===fStatus);
  }),[users,search,fDept,fStatus]);

  const openEdit = u => { setForm({...u}); setModal(true); };
  const save = async () => {
    setSaving(true);
    let updated;
    if (form.id) { updated=users.map(u=>u.id===form.id?form:u); setSelected(form); }
    else { updated=[{...form,id:Date.now()},...users]; }
    await onSave('users', updated);
    setSaving(false); setModal(false);
  };
  const del = async id => {
    if (!window.confirm('Delete user?')) return;
    await onSave('users', users.filter(u=>u.id!==id));
    setSelected(null);
  };

  const uDevices = selected ? devices.filter(d=>d.assignedUser===selected.email||d.secondaryUser===selected.email||(selected.allDevices||'').includes(d.assetTag)) : [];
  const STC = { Active:'#22c55e','Disabled':'#94a3b8','Locked Out':'#ef4444','Guest':'#8b5cf6','Service Account':'#3b82f6' };

  return (
    <div>
      <div style={{ display:'flex', gap:9, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
        <SearchBar value={search} onChange={setSearch} placeholder="🔍  Search users, email, Azure Object ID…"/>
        <FilterSelect value={fDept} onChange={setFDept} opts={DEPARTMENTS} placeholder="All Depts"/>
        <FilterSelect value={fStatus} onChange={setFStatus} opts={USER_STATUS} placeholder="All Statuses"/>
        <span style={{ fontSize:12, color:'var(--text-muted)' }}>{filtered.length}/{users.length}</span>
        <button onClick={()=>{setForm({...E_USR});setModal(true)}} style={{ ...btnPrimary('#1a7a6e'), marginLeft:'auto' }}>+ Add User</button>
      </div>
      <div style={{ ...T.card, overflow:'hidden', marginRight:selected?455:0, transition:'margin .2s' }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <TableHeader cols={['ID','Full Name','Email','Title','Dept','License','Status','MFA','Devices','']} color="#1a7a6e"/>
            <tbody>
              {filtered.length===0&&<EmptyRow cols={10}/>}
              {filtered.map((u,i)=>{
                const sel=selected?.id===u.id;
                const dc=(u.allDevices||'').split(';').filter(Boolean).length;
                return (
                  <tr key={u.id} onClick={()=>setSelected(sel?null:u)}
                    style={{ background:sel?'var(--bg-row-hover)':i%2===0?'var(--bg-row-even)':'var(--bg-row-odd)',
                      cursor:'pointer', borderLeft:`3px solid ${sel?'#0d9488':'transparent'}`,
                      opacity:u.accountStatus==='Disabled'?.55:1 }}>
                    <td style={T.tdBase}><code style={{ fontSize:11,background:'var(--code-bg)',color:'var(--code-text)',padding:'2px 6px',borderRadius:4,fontFamily:'IBM Plex Mono,monospace' }}>{u.employeeId}</code></td>
                    <td style={T.tdBase}><span style={{ fontWeight:600 }}>👤 {u.fullName}</span></td>
                    <td style={T.tdBase}><span style={{ fontSize:12,color:'var(--text-link)' }}>{u.email}</span></td>
                    <td style={T.tdBase}><span style={{ fontSize:12 }}>{u.jobTitle}</span></td>
                    <td style={T.tdBase}>{u.department}</td>
                    <td style={T.tdBase}><span style={{ fontSize:11 }}>{u.m365License}</span></td>
                    <td style={T.tdBase}><Pill label={u.accountStatus} color={STC[u.accountStatus]||'#94a3b8'} bg={(STC[u.accountStatus]||'#94a3b8')+'22'}/></td>
                    <td style={T.tdBase}><Pill label={u.mfaEnabled==='Yes'?'✅ MFA':'⚠️ No MFA'} color={u.mfaEnabled==='Yes'?'#22c55e':'#ef4444'} bg={u.mfaEnabled==='Yes'?'#f0fdf4':'#fef2f2'}/></td>
                    <td style={T.tdBase}>{dc>0?<Pill label={`${dc} device${dc>1?'s':''}`} color="#3b82f6" bg="#3b82f622"/>:<span style={{color:'var(--text-muted)',fontSize:12}}>None</span>}</td>
                    <td style={T.tdBase}>
                      <div style={{ display:'flex',gap:5 }}>
                        <button onClick={e=>{e.stopPropagation();openEdit(u)}} style={btnBase}>✏️</button>
                        <button onClick={e=>{e.stopPropagation();del(u.id)}} style={btnDanger}>🗑</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <DetailPanel title={selected.fullName} icon="👤" subtitle={selected.email}
          onClose={()=>setSelected(null)} onEdit={()=>openEdit(selected)}
          tags={[
            {label:selected.accountStatus,color:STC[selected.accountStatus]||'#94a3b8',bg:(STC[selected.accountStatus]||'#94a3b8')+'22'},
            {label:selected.mfaEnabled==='Yes'?'✅ MFA On':'⚠️ No MFA',color:selected.mfaEnabled==='Yes'?'#22c55e':'#ef4444',bg:selected.mfaEnabled==='Yes'?'#f0fdf4':'#fef2f2'},
            {label:selected.accountType,color:'#8b5cf6',bg:'#8b5cf622'},
          ]}
          sections={[
            {heading:'👤 Identity',rows:[
              {label:'Employee ID',value:selected.employeeId},{label:'Job Title',value:selected.jobTitle},
              {label:'Department',value:selected.department},{label:'Manager',value:selected.manager},
              {label:'Office',value:selected.location},{label:'Phone',value:selected.phone},{label:'Mobile',value:selected.mobile},
            ]},
            {heading:'☁️ Azure AD / Entra',rows:[
              {label:'Azure Object ID',value:selected.azureObjectId},{label:'Account Type',value:selected.accountType},
              {label:'Last Sign-In',value:selected.lastSignIn},{label:'Created Date',value:selected.createdDate},{label:'MFA Enabled',value:selected.mfaEnabled},
            ]},
            {heading:'📧 Microsoft 365',rows:[
              {label:'License',value:selected.m365License},{label:'Apps',value:selected.m365Apps},
              {label:'OneDrive',value:selected.oneDriveQuota?`${selected.oneDriveQuota} GB`:null},
              {label:'Mailbox',value:selected.mailboxSize?`${selected.mailboxSize} GB`:null},
              {label:'Groups',value:selected.groups},
            ]},
            {heading:'🖥 Assigned Devices',rows:
              uDevices.length>0?uDevices.map(d=>({label:d.assetTag,value:`${DEVICE_ICONS[d.deviceType]} ${d.deviceName} — ${d.makeModel}`}))
              :[{label:'',value:'No devices currently assigned'}]
            },
            {heading:'📋 Notes',rows:[{label:'Notes',value:selected.notes}]},
          ]}
        />
      )}

      {modal && (
        <Modal title={form.id?'✏️ Edit User':'➕ Add User'} onClose={()=>setModal(false)} onSave={save} saving={saving}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:13 }}>
            {[['Employee ID','employeeId'],['Full Name','fullName'],['Job Title','jobTitle'],['Manager Email','manager'],['Office / Location','location'],['Phone','phone'],['Mobile','mobile'],['Azure Object ID','azureObjectId'],['Primary Device','primaryDevice'],['All Devices','allDevices'],['Groups / Teams','groups']].map(([l,k])=>(
              <Field key={k} label={l} value={form[k]} onChange={v=>set(k,v)}/>
            ))}
            <Field label="Email (UPN)" value={form.email} onChange={v=>set('email',v)} type="email"/>
            {[['Account Status','accountStatus',USER_STATUS],['Account Type','accountType',['Member','Guest','Service Account','Shared Mailbox','Resource']],['Department','department',DEPARTMENTS],['MFA Enabled','mfaEnabled',['Yes','No','Enforced']],['M365 License','m365License',M365_LICENSES]].map(([l,k,o])=>(
              <Field key={k} label={l} value={form[k]} onChange={v=>set(k,v)} opts={o}/>
            ))}
            {[['Last Sign-In','lastSignIn'],['Created Date','createdDate']].map(([l,k])=>(
              <Field key={k} label={l} value={form[k]} onChange={v=>set(k,v)} type="date"/>
            ))}
            {[['OneDrive Quota (GB)','oneDriveQuota'],['Mailbox Size (GB)','mailboxSize']].map(([l,k])=>(
              <Field key={k} label={l} value={form[k]} onChange={v=>set(k,v)} type="number"/>
            ))}
            <Field label="M365 Apps" value={form.m365Apps} onChange={v=>set('m365Apps',v)} wide/>
            <Field label="Notes" value={form.notes} onChange={v=>set('notes',v)} type="textarea" wide/>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SOFTWARE SECTION
// ═══════════════════════════════════════════════════════════════════
const E_SW = { licenseId:'', softwareName:'', vendor:'', category:'Productivity', version:'', licenseType:'Subscription (Annual)', licenseKey:'', totalSeats:'', usedSeats:'', purchaseDate:'', expiryDate:'', annualCost:'', costPerSeat:'', supportEmail:'', supportPhone:'', contractPO:'', autoRenew:'Yes', status:'Active', notes:'' };
const E_MAP = { assetTag:'', deviceName:'', assignedUser:'', softwareName:'', licenseId:'', version:'', installDate:'', lastUpdated:'', installType:'Managed (Intune)', approved:'Yes', notes:'' };

function SoftwareSection({ software, onSaveSw, swMap, onSaveMap, devices }) {
  const [search, setSearch] = useState('');
  const [fCat, setFCat] = useState('All');
  const [fStat, setFStat] = useState('All');
  const [selected, setSelected] = useState(null);
  const [modal, setModal] = useState(false);
  const [mapModal, setMapModal] = useState(false);
  const [form, setForm] = useState(E_SW);
  const [mapForm, setMapForm] = useState(E_MAP);
  const [saving, setSaving] = useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const setM = (k,v) => setMapForm(f=>({...f,[k]:v}));

  const filtered = useMemo(()=>software.filter(s=>{
    const q=search.toLowerCase();
    return (!q||[s.softwareName,s.vendor,s.licenseId].some(v=>String(v||'').toLowerCase().includes(q)))
      &&(fCat==='All'||s.category===fCat)&&(fStat==='All'||s.status===fStat);
  }),[software,search,fCat,fStat]);

  const openEdit = s => { setForm({...s}); setModal(true); };
  const save = async () => {
    setSaving(true);
    let updated;
    if (form.id) { updated=software.map(s=>s.id===form.id?form:s); setSelected(form); }
    else { updated=[{...form,id:Date.now()},...software]; }
    await onSaveSw(updated);
    setSaving(false); setModal(false);
  };
  const del = async id => {
    if (!window.confirm('Delete license?')) return;
    await onSaveSw(software.filter(s=>s.id!==id));
    setSelected(null);
  };
  const saveMap = async () => {
    setSaving(true);
    const d = devices.find(d=>d.assetTag===mapForm.assetTag);
    const entry = { ...mapForm, id:Date.now(), deviceName:d?.deviceName||mapForm.assetTag, assignedUser:d?.assignedUser||'' };
    await onSaveMap([...swMap, entry]);
    setSaving(false); setMapModal(false);
  };
  const delMap = async id => {
    if (!window.confirm('Remove this install mapping?')) return;
    await onSaveMap(swMap.filter(m=>m.id!==id));
  };

  const SW_C = { Active:'#22c55e', Expired:'#ef4444', Cancelled:'#94a3b8', 'Pending Renewal':'#f59e0b' };
  const selInstalls = selected ? swMap.filter(m=>m.licenseId===selected.licenseId) : [];
  const avail = selected ? (Number(selected.totalSeats)||0)-(Number(selected.usedSeats)||0) : 0;

  return (
    <div>
      <div style={{ display:'flex', gap:9, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
        <SearchBar value={search} onChange={setSearch} placeholder="🔍  Search software, vendor, license ID…"/>
        <FilterSelect value={fCat} onChange={setFCat} opts={SW_CATEGORIES} placeholder="All Categories"/>
        <FilterSelect value={fStat} onChange={setFStat} opts={SW_STATUS_OPT} placeholder="All Statuses"/>
        <span style={{ fontSize:12, color:'var(--text-muted)' }}>{filtered.length}/{software.length}</span>
        <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
          <button onClick={()=>{setMapForm({...E_MAP});setMapModal(true)}} style={btnPrimary('#5b4a8a')}>🔗 Map Install</button>
          <button onClick={()=>{setForm({...E_SW});setModal(true)}} style={btnPrimary('#5b4a8a')}>+ Add License</button>
        </div>
      </div>
      <div style={{ ...T.card, overflow:'hidden', marginRight:selected?455:0, transition:'margin .2s' }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <TableHeader cols={['License ID','Software','Vendor','Category','Seats','Available','Expiry','Status','Annual Cost','']} color="#5b4a8a"/>
            <tbody>
              {filtered.length===0&&<EmptyRow cols={10}/>}
              {filtered.map((s,i)=>{
                const ls=licenseStatus(s.expiryDate,s.status);
                const sel=selected?.id===s.id;
                const left=(Number(s.totalSeats)||0)-(Number(s.usedSeats)||0);
                return (
                  <tr key={s.id} onClick={()=>setSelected(sel?null:s)}
                    style={{ background:sel?'#f5f3ff':i%2===0?'var(--bg-row-even)':'var(--bg-row-odd)',
                      cursor:'pointer', borderLeft:`3px solid ${sel?'#7c3aed':'transparent'}` }}>
                    <td style={T.tdBase}><code style={{ fontSize:11,background:'var(--code-bg)',color:'var(--code-text)',padding:'2px 6px',borderRadius:4,fontFamily:'IBM Plex Mono,monospace' }}>{s.licenseId}</code></td>
                    <td style={T.tdBase}><span style={{ fontWeight:600 }}>📦 {s.softwareName}</span></td>
                    <td style={T.tdBase}><span style={{ fontSize:12 }}>{s.vendor}</span></td>
                    <td style={T.tdBase}><Pill label={s.category} color="#8b5cf6" bg="#8b5cf622"/></td>
                    <td style={T.tdBase}>{s.usedSeats}/{s.totalSeats}</td>
                    <td style={T.tdBase}><Pill label={`${left} left`} color={left<=0?'#ef4444':left<=3?'#f59e0b':'#22c55e'} bg={left<=0?'#fef2f2':left<=3?'#fffbeb':'#f0fdf4'}/></td>
                    <td style={T.tdBase}>{s.expiryDate||<span style={{color:'var(--text-muted)'}}>—</span>}</td>
                    <td style={T.tdBase}>{ls?<Pill {...ls}/>:<Pill label={s.status} color={SW_C[s.status]||'#64748b'} bg={(SW_C[s.status]||'#64748b')+'22'}/>}</td>
                    <td style={T.tdBase}>{s.annualCost?`$${Number(s.annualCost).toLocaleString()}`:''}</td>
                    <td style={T.tdBase}>
                      <div style={{ display:'flex',gap:5 }}>
                        <button onClick={e=>{e.stopPropagation();openEdit(s)}} style={btnBase}>✏️</button>
                        <button onClick={e=>{e.stopPropagation();del(s.id)}} style={btnDanger}>🗑</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <DetailPanel title={selected.softwareName} icon="📦" subtitle={selected.licenseId}
          onClose={()=>setSelected(null)} onEdit={()=>openEdit(selected)}
          tags={[
            {label:selected.category,color:'#8b5cf6',bg:'#8b5cf622'},
            licenseStatus(selected.expiryDate,selected.status),
            {label:`${avail} seats left`,color:avail<=0?'#ef4444':avail<=3?'#f59e0b':'#22c55e',bg:avail<=0?'#fef2f2':avail<=3?'#fffbeb':'#f0fdf4'},
          ]}
          sections={[
            {heading:'📋 License Details',rows:[
              {label:'Vendor',value:selected.vendor},{label:'Version',value:selected.version},
              {label:'License Type',value:selected.licenseType},{label:'License Key',value:selected.licenseKey},
              {label:'Total Seats',value:String(selected.totalSeats||'')},{label:'Used Seats',value:String(selected.usedSeats||'')},{label:'Available',value:String(avail)},
            ]},
            {heading:'💰 Financial',rows:[
              {label:'Purchase Date',value:selected.purchaseDate},{label:'Expiry',value:selected.expiryDate},
              {label:'Annual Cost',value:selected.annualCost?`$${Number(selected.annualCost).toLocaleString()}`:null},
              {label:'Cost/Seat',value:selected.costPerSeat?`$${selected.costPerSeat}`:null},
              {label:'Auto-Renew',value:selected.autoRenew},{label:'Contract/PO',value:selected.contractPO},
            ]},
            {heading:'📞 Vendor Support',rows:[{label:'Email',value:selected.supportEmail},{label:'Phone',value:selected.supportPhone}]},
            {heading:'🖥 Installed On',rows:
              selInstalls.length>0?selInstalls.map(m=>({label:m.assetTag,value:`${m.deviceName} — ${m.assignedUser||'Unassigned'} (v${m.version})`}))
              :[{label:'',value:'No installs mapped yet — use 🔗 Map Install'}]
            },
            {heading:'📝 Notes',rows:[{label:'Notes',value:selected.notes}]},
          ]}
        />
      )}

      {modal && (
        <Modal title={form.id?'✏️ Edit License':'➕ Add License'} onClose={()=>setModal(false)} onSave={save} saving={saving}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:13 }}>
            {[['License ID','licenseId'],['Software Name','softwareName'],['Vendor','vendor'],['Version','version'],['Support Email','supportEmail'],['Support Phone','supportPhone'],['Contract / PO','contractPO']].map(([l,k])=>(
              <Field key={k} label={l} value={form[k]} onChange={v=>set(k,v)}/>
            ))}
            {[['Category','category',SW_CATEGORIES],['License Type','licenseType',LICENSE_TYPES],['Auto-Renew','autoRenew',['Yes','No']],['Status','status',SW_STATUS_OPT]].map(([l,k,o])=>(
              <Field key={k} label={l} value={form[k]} onChange={v=>set(k,v)} opts={o}/>
            ))}
            {[['Total Seats','totalSeats'],['Used Seats','usedSeats'],['Annual Cost ($)','annualCost'],['Cost per Seat ($)','costPerSeat']].map(([l,k])=>(
              <Field key={k} label={l} value={form[k]} onChange={v=>set(k,v)} type="number"/>
            ))}
            {[['Purchase Date','purchaseDate'],['Expiry Date','expiryDate']].map(([l,k])=>(
              <Field key={k} label={l} value={form[k]} onChange={v=>set(k,v)} type="date"/>
            ))}
            <Field label="License Key / ID" value={form.licenseKey} onChange={v=>set('licenseKey',v)} wide/>
            <Field label="Notes" value={form.notes} onChange={v=>set('notes',v)} type="textarea" wide/>
          </div>
        </Modal>
      )}

      {mapModal && (
        <Modal title="🔗 Map Software Install to Device" onClose={()=>setMapModal(false)} onSave={saveMap} saving={saving}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:13 }}>
            {[['Asset Tag','assetTag'],['Software Name','softwareName'],['License ID','licenseId'],['Version Installed','version']].map(([l,k])=>(
              <Field key={k} label={l} value={mapForm[k]} onChange={v=>setM(k,v)}/>
            ))}
            {[['Install Date','installDate'],['Last Updated','lastUpdated']].map(([l,k])=>(
              <Field key={k} label={l} value={mapForm[k]} onChange={v=>setM(k,v)} type="date"/>
            ))}
            {[['Install Type','installType',INSTALL_TYPES],['Approved','approved',['Yes','No','Pending Approval']]].map(([l,k,o])=>(
              <Field key={k} label={l} value={mapForm[k]} onChange={v=>setM(k,v)} opts={o}/>
            ))}
            <Field label="Notes" value={mapForm.notes} onChange={v=>setM('notes',v)} wide/>
          </div>
        </Modal>
      )}

      {/* Install Map table below software list */}
      <div style={{ marginTop:24 }}>
        <div style={{ fontWeight:700, fontSize:14, color:'var(--text-primary)', marginBottom:10 }}>🔗 Install Map <span style={{ fontWeight:400, fontSize:12, color:'var(--text-muted)' }}>— all software-to-device mappings</span></div>
        <div style={{ ...T.card, overflow:'hidden' }}>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <TableHeader cols={['Asset Tag','Device','User','Software','License ID','Version','Install Date','Type','Approved','']} color="#375623"/>
              <tbody>
                {swMap.length===0&&<EmptyRow cols={10}/>}
                {swMap.map((m,i)=>(
                  <tr key={m.id} style={{ background:i%2===0?'var(--bg-row-even)':'var(--bg-row-odd)' }}>
                    <td style={T.tdBase}><code style={{ fontSize:11,background:'var(--code-bg)',color:'var(--code-text)',padding:'2px 6px',borderRadius:4,fontFamily:'IBM Plex Mono,monospace' }}>{m.assetTag}</code></td>
                    <td style={T.tdBase}>{m.deviceName}</td>
                    <td style={T.tdBase}><span style={{ fontSize:12,color:'var(--text-link)' }}>{m.assignedUser}</span></td>
                    <td style={T.tdBase}><span style={{ fontWeight:600 }}>📦 {m.softwareName}</span></td>
                    <td style={T.tdBase}><code style={{ fontSize:11,background:'var(--code-bg)',color:'var(--code-text)',padding:'2px 6px',borderRadius:4,fontFamily:'IBM Plex Mono,monospace' }}>{m.licenseId}</code></td>
                    <td style={T.tdBase}>{m.version}</td>
                    <td style={T.tdBase}>{m.installDate}</td>
                    <td style={T.tdBase}><Pill label={m.installType} color="#64748b" bg="var(--code-bg)"/></td>
                    <td style={T.tdBase}><Pill label={m.approved} color={m.approved==='Yes'?'#22c55e':m.approved==='No'?'#ef4444':'#f59e0b'} bg={m.approved==='Yes'?'#f0fdf4':m.approved==='No'?'#fef2f2':'#fffbeb'}/></td>
                    <td style={T.tdBase}><button onClick={()=>delMap(m.id)} style={btnDanger}>🗑</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════════
function StatCard({ icon, label, value, accent, sub }) {
  return (
    <div style={{ ...T.card, padding:'15px 18px', borderLeft:`4px solid ${accent}`,
      display:'flex', alignItems:'center', gap:14, flex:'1 1 150px' }}>
      <div style={{ fontSize:24 }}>{icon}</div>
      <div>
        <div style={{ fontSize:22, fontWeight:800, color:'var(--text-primary)', lineHeight:1 }}>{value}</div>
        <div style={{ fontSize:12, color:'var(--text-secondary)', marginTop:2 }}>{label}</div>
        {sub && <div style={{ fontSize:11, color:accent, marginTop:2, fontWeight:600 }}>{sub}</div>}
      </div>
    </div>
  );
}
function BarChart({ title, data, max, color }) {
  return (
    <div style={{ ...T.card, padding:'16px 20px' }}>
      <div style={{ fontWeight:700, fontSize:13, color:'var(--text-primary)', marginBottom:12,
        borderBottom:`2px solid ${color}33`, paddingBottom:7 }}>{title}</div>
      {data.filter(d=>d.count>0).map(({label,count})=>(
        <div key={label} style={{ marginBottom:8 }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--text-secondary)', marginBottom:2 }}>
            <span>{label}</span><span style={{ fontWeight:700, color:'var(--text-primary)' }}>{count}</span>
          </div>
          <div style={{ background:'var(--border)', borderRadius:99, height:6 }}>
            <div style={{ width:`${(count/max)*100}%`, background:color, height:'100%', borderRadius:99, transition:'width .4s' }}/>
          </div>
        </div>
      ))}
    </div>
  );
}
function Dashboard({ devices, users, software, swMap }) {
  const totalCost = software.reduce((a,s)=>a+(Number(s.annualCost)||0),0);
  const expLic    = software.filter(s=>{const l=licenseStatus(s.expiryDate,s.status);return l?.label==='Expired';}).length;
  const noMfa     = users.filter(u=>u.accountStatus==='Active'&&u.mfaEnabled!=='Yes'&&u.mfaEnabled!=='Enforced').length;
  const byType    = DEVICE_TYPES.map(t=>({label:t,count:devices.filter(d=>d.deviceType===t).length}));
  const byDept    = DEPARTMENTS.map(t=>({label:t,count:devices.filter(d=>d.department===t).length}));
  const byUDept   = DEPARTMENTS.map(t=>({label:t,count:users.filter(u=>u.department===t).length}));
  const byCat     = SW_CATEGORIES.map(t=>({label:t,count:software.filter(s=>s.category===t).length}));
  const mx = arr => Math.max(...arr.map(x=>x.count),1);
  return (
    <div>
      <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:20 }}>
        <StatCard icon="🖥" label="Total Devices"   value={devices.length}                                accent="#3b82f6" sub={`${devices.filter(d=>d.status==='Active').length} active`}/>
        <StatCard icon="👤" label="Active Users"    value={users.filter(u=>u.accountStatus==='Active').length} accent="#0d9488" sub={`${users.filter(u=>u.accountStatus==='Disabled').length} disabled`}/>
        <StatCard icon="📦" label="Software Titles" value={software.length}                               accent="#7c3aed" sub={`$${totalCost.toLocaleString()} / yr`}/>
        <StatCard icon="✅" label="Compliant"        value={devices.filter(d=>d.compliance==='Compliant').length} accent="#22c55e"/>
        <StatCard icon="⚠️" label="Warranty ≤90d"  value={devices.filter(d=>{const w=warrantyStatus(d.warrantyExpiry);return w?.label.includes('d left');}).length} accent="#f59e0b"/>
        <StatCard icon="🔴" label="Expired Warranty" value={devices.filter(d=>warrantyStatus(d.warrantyExpiry)?.label==='Expired').length} accent="#ef4444"/>
        <StatCard icon="📋" label="Expired Licenses" value={expLic}                                        accent="#ef4444"/>
        <StatCard icon="🔐" label="No MFA (Active)" value={noMfa}                                         accent={noMfa>0?'#ef4444':'#22c55e'}/>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        <BarChart title="Devices by Type"       data={byType}  max={mx(byType)}  color="#3b82f6"/>
        <BarChart title="Devices by Department" data={byDept}  max={mx(byDept)}  color="#0891b2"/>
        <BarChart title="Users by Department"   data={byUDept} max={mx(byUDept)} color="#0d9488"/>
        <BarChart title="Software by Category"  data={byCat}   max={mx(byCat)}   color="#7c3aed"/>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ROOT APP
// ═══════════════════════════════════════════════════════════════════
export default function App() {
  const [devices,  setDevices]  = useState([]);
  const [users,    setUsers]    = useState([]);
  const [software, setSoftware] = useState([]);
  const [swMap,    setSwMap]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [saveState, setSaveState] = useState({}); // { col: 'saving'|'saved'|'error' }
  const [tab, setTab] = useState('dashboard');

  // Load all from KV on mount
  useEffect(() => {
    Promise.all([
      api.get('devices'),
      api.get('users'),
      api.get('software'),
      api.get('swmap'),
    ]).then(([d,u,s,m]) => {
      setDevices(d.length  ? d : SEED_DEVICES);
      setUsers(u.length    ? u : SEED_USERS);
      setSoftware(s.length ? s : SEED_SOFTWARE);
      setSwMap(m.length    ? m : SEED_SWMAP);
      setLoading(false);
    }).catch(() => {
      // Fallback to seed data if KV not configured yet
      setDevices(SEED_DEVICES); setUsers(SEED_USERS);
      setSoftware(SEED_SOFTWARE); setSwMap(SEED_SWMAP);
      setLoading(false);
    });
  }, []);

  const persist = useCallback(async (col, data) => {
    setSaveState(s=>({...s,[col]:'saving'}));
    try {
      await api.save(col, data);
      setSaveState(s=>({...s,[col]:'saved'}));
      setTimeout(()=>setSaveState(s=>({...s,[col]:null})),2000);
    } catch {
      setSaveState(s=>({...s,[col]:'error'}));
    }
    // update local state
    if (col==='devices')  setDevices(data);
    if (col==='users')    setUsers(data);
    if (col==='software') setSoftware(data);
    if (col==='swmap')    setSwMap(data);
  }, []);

  const handleImport = useCallback(async (parsed) => {
    const tasks = [];
    if (parsed.devices)  tasks.push(persist('devices',  parsed.devices.map((r,i)=>({...r,id:r.id||Date.now()+i}))));
    if (parsed.users)    tasks.push(persist('users',    parsed.users.map((r,i)=>({...r,id:r.id||Date.now()+i}))));
    if (parsed.software) tasks.push(persist('software', parsed.software.map((r,i)=>({...r,id:r.id||Date.now()+i}))));
    if (parsed.swmap)    tasks.push(persist('swmap',    parsed.swmap.map((r,i)=>({...r,id:r.id||Date.now()+i}))));
    await Promise.all(tasks);
    alert(`✅ Import complete!\n${Object.entries(parsed).map(([k,v])=>`${k}: ${v.length} rows`).join('\n')}`);
  }, [persist]);

  const TABS = [
    { id:'dashboard', label:'📊 Dashboard' },
    { id:'devices',   label:'🖥 Devices',   badge:devices.length },
    { id:'users',     label:'👤 Users',     badge:users.length },
    { id:'software',  label:'📦 Software',  badge:software.length },
  ];

  const saveIndicator = Object.entries(saveState).find(([,v])=>v);

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh',
      background:'var(--bg-page)', color:'var(--text-secondary)', fontSize:16, gap:12 }}>
      <span style={{ fontSize:32, animation:'spin 1s linear infinite' }}>⏳</span> Loading inventory from Vercel KV…
    </div>
  );

  return (
    <div style={{ fontFamily:"'Sora', system-ui, sans-serif", background:'var(--bg-page)', minHeight:'100vh' }}>
      {/* ── Header ── */}
      <div style={{ background:'var(--bg-header)', padding:'0 22px', display:'flex',
        alignItems:'center', gap:14, height:58, position:'sticky', top:0, zIndex:200,
        borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ flexShrink:0 }}>
          <div style={{ color:'var(--text-header)', fontWeight:800, fontSize:16, letterSpacing:-.3 }}>🖥 IT Asset Inventory</div>
          <div style={{ color:'var(--text-header-sub)', fontSize:10 }}>Vercel KV · Entra ID</div>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:3, background:'rgba(255,255,255,0.10)', borderRadius:9, padding:3, marginLeft:6 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={()=>setTab(t.id)} style={{ padding:'7px 14px', borderRadius:7, border:'none', cursor:'pointer',
              fontFamily:'inherit', fontWeight:600, fontSize:13, transition:'all .15s',
              background: tab===t.id?'var(--tab-active-bg)':'transparent',
              color: tab===t.id?'var(--tab-active-text)':'var(--tab-idle-text)',
              boxShadow: tab===t.id?'0 1px 4px rgba(0,0,0,0.15)':'none' }}>
              {t.label}
              {t.badge!==undefined && <span style={{ marginLeft:5, background:tab===t.id?'#3b82f6':'rgba(255,255,255,0.2)',
                color:'#fff', borderRadius:99, padding:'1px 7px', fontSize:11, fontWeight:700 }}>{t.badge}</span>}
            </button>
          ))}
        </div>

        {/* Save indicator */}
        <div style={{ marginLeft:'auto', fontSize:12, color:'var(--text-header-sub)', minWidth:120, textAlign:'right' }}>
          {saveIndicator?.[1]==='saving' && '⏳ Saving to KV…'}
          {saveIndicator?.[1]==='saved'  && '✅ Saved'}
          {saveIndicator?.[1]==='error'  && '❌ Save failed — check KV config'}
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ padding:'20px 22px', maxWidth:1600, margin:'0 auto' }}>
        <ImportExportBar
          devices={devices} users={users} software={software} swMap={swMap}
          onImport={handleImport}
        />
        {tab==='dashboard' && <Dashboard devices={devices} users={users} software={software} swMap={swMap}/>}
        {tab==='devices'   && <DeviceSection devices={devices} onSave={persist} swMap={swMap}/>}
        {tab==='users'     && <UserSection users={users} onSave={persist} devices={devices}/>}
        {tab==='software'  && <SoftwareSection software={software} onSaveSw={d=>persist('software',d)} swMap={swMap} onSaveMap={d=>persist('swmap',d)} devices={devices}/>}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
