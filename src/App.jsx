import { useState, useMemo } from "react";

// ── Lookup data ────────────────────────────────────────────────────
const DEVICE_TYPES  = ["Desktop","Laptop","Tablet","Mobile Phone","Printer","Monitor","Server","Peripheral","Other"];
const OS_OPTIONS    = ["Windows 11 Pro","Windows 10 Pro","macOS Sonoma","macOS Ventura","iOS","Android","Chrome OS","Windows Server 2022","Linux","N/A"];
const DEPARTMENTS   = ["IT","Finance","HR","Sales","Marketing","Operations","Engineering","Management","Other"];
const COMPLIANCE    = ["Compliant","Non-Compliant","Pending","N/A"];
const DEVICE_STATUS = ["Active","In Storage","Decommissioned","Lost/Stolen","In Repair"];
const USER_STATUS   = ["Active","Disabled","Locked Out","Guest","Service Account"];
const M365_LICENSES = ["Microsoft 365 Business Basic","Microsoft 365 Business Standard","Microsoft 365 Business Premium","Microsoft 365 E3","Microsoft 365 E5","Office 365 E1","Office 365 E3","No License"];
const SW_CATEGORIES = ["Productivity","Security","Design","Development","ERP/CRM","Communication","Backup","OS","Utility","Other"];
const LICENSE_TYPES = ["Perpetual","Subscription (Annual)","Subscription (Monthly)","Per Device","Per User","Volume","OEM","Freeware","Open Source"];
const SW_STATUS     = ["Active","Expired","Cancelled","Pending Renewal"];
const INSTALL_TYPES = ["Managed (Intune)","Manual","Pre-installed","Script/GPO","Other"];

const DEVICE_ICONS = { Desktop:"🖥", Laptop:"💻", Tablet:"🪄", "Mobile Phone":"📱", Printer:"🖨", Monitor:"🖥", Server:"🗄", Peripheral:"🖱", Other:"📦" };

// ── Sample data ────────────────────────────────────────────────────
const INIT_DEVICES = [
  { id:1, assetTag:"IT-001", deviceName:"DESKTOP-ABCD01", deviceType:"Desktop", makeModel:"Dell OptiPlex 7090", serialNumber:"SN123456789", os:"Windows 11 Pro", osVersion:"23H2", ram:16, storage:512, cpu:"Intel Core i7-11700", azureDeviceId:"a1b2c3d4-e5f6-7890-abcd-ef1234567890", entraJoinDate:"2023-06-15", compliance:"Compliant", intuneManaged:"Yes", lastSync:"2025-01-10", assignedUser:"john.smith@company.com", secondaryUser:"", department:"IT", location:"HQ – Floor 2", bitlockerKeyId:"AABB1122CC334455", bitlockerRecovery:"123456-234567-345678-456789-567890-678901", purchaseDate:"2023-06-15", vendor:"Dell Technologies", purchaseCost:1200, warrantyExpiry:"2026-06-14", supportContract:"Dell ProSupport", endOfLife:"2028-06-15", status:"Active", notes:"Primary workstation" },
  { id:2, assetTag:"IT-002", deviceName:"LAPTOP-XYZ99", deviceType:"Laptop", makeModel:"Lenovo ThinkPad X1 Carbon", serialNumber:"SN987654321", os:"Windows 11 Pro", osVersion:"23H2", ram:16, storage:256, cpu:"Intel Core i5-1235U", azureDeviceId:"b2c3d4e5-f6a7-8901-bcde-f12345678901", entraJoinDate:"2024-01-10", compliance:"Compliant", intuneManaged:"Yes", lastSync:"2025-01-09", assignedUser:"jane.doe@company.com", secondaryUser:"", department:"Finance", location:"HQ – Floor 3", bitlockerKeyId:"BBCC2233DD445566", bitlockerRecovery:"234567-345678-456789-567890-678901-789012", purchaseDate:"2024-01-10", vendor:"Lenovo", purchaseCost:1450, warrantyExpiry:"2027-01-09", supportContract:"Lenovo Premier", endOfLife:"2029-01-10", status:"Active", notes:"" },
  { id:3, assetTag:"IT-003", deviceName:"LAPTOP-MKT01", deviceType:"Laptop", makeModel:"Apple MacBook Pro 14", serialNumber:"SN-MAC-0042", os:"macOS Sonoma", osVersion:"14.3", ram:18, storage:512, cpu:"Apple M3 Pro", azureDeviceId:"c3d4e5f6-a7b8-9012-cdef-123456789012", entraJoinDate:"2024-03-01", compliance:"Compliant", intuneManaged:"Yes", lastSync:"2025-01-08", assignedUser:"alice.brown@company.com", secondaryUser:"", department:"Marketing", location:"HQ – Floor 4", bitlockerKeyId:"N/A", bitlockerRecovery:"N/A", purchaseDate:"2024-03-01", vendor:"Apple", purchaseCost:2499, warrantyExpiry:"2027-03-01", supportContract:"AppleCare+", endOfLife:"2030-03-01", status:"Active", notes:"Design workstation" },
  { id:4, assetTag:"IT-004", deviceName:"MOB-IPHONE14-03", deviceType:"Mobile Phone", makeModel:"Apple iPhone 14 Pro", serialNumber:"IMEI987654321", os:"iOS", osVersion:"17.4", ram:"", storage:"", cpu:"Apple A16", azureDeviceId:"d4e5f6a7-b8c9-0123-def0-234567890123", entraJoinDate:"2023-09-01", compliance:"Compliant", intuneManaged:"Yes", lastSync:"2025-01-10", assignedUser:"alice.brown@company.com", secondaryUser:"", department:"Marketing", location:"Remote", bitlockerKeyId:"N/A", bitlockerRecovery:"N/A", purchaseDate:"2023-09-01", vendor:"Apple", purchaseCost:1099, warrantyExpiry:"2025-09-01", supportContract:"N/A", endOfLife:"2026-09-01", status:"Active", notes:"Corporate MDM enrolled" },
  { id:5, assetTag:"IT-005", deviceName:"TAB-IPAD-05", deviceType:"Tablet", makeModel:"Apple iPad Pro 12.9", serialNumber:"SN-IPAD-007", os:"iPadOS", osVersion:"17.3", ram:8, storage:256, cpu:"Apple M2", azureDeviceId:"e5f6a7b8-c9d0-1234-ef01-345678901234", entraJoinDate:"2023-11-15", compliance:"Compliant", intuneManaged:"Yes", lastSync:"2025-01-07", assignedUser:"bob.johnson@company.com", secondaryUser:"", department:"Sales", location:"Remote", bitlockerKeyId:"N/A", bitlockerRecovery:"N/A", purchaseDate:"2023-11-15", vendor:"Apple", purchaseCost:1099, warrantyExpiry:"2026-11-15", supportContract:"N/A", endOfLife:"2027-11-15", status:"Active", notes:"Field sales device" },
  { id:6, assetTag:"IT-006", deviceName:"MON-DELL-06", deviceType:"Monitor", makeModel:"Dell UltraSharp U2722D", serialNumber:"SN-MON-4567", os:"N/A", osVersion:"N/A", ram:"", storage:"", cpu:"", azureDeviceId:"N/A", entraJoinDate:"", compliance:"N/A", intuneManaged:"N/A", lastSync:"", assignedUser:"john.smith@company.com", secondaryUser:"", department:"IT", location:"HQ – Floor 2", bitlockerKeyId:"N/A", bitlockerRecovery:"N/A", purchaseDate:"2022-03-20", vendor:"Dell Technologies", purchaseCost:650, warrantyExpiry:"2025-03-19", supportContract:"Dell Basic", endOfLife:"2027-03-20", status:"Active", notes:"Dual monitor setup" },
  { id:7, assetTag:"IT-007", deviceName:"PRT-HP-07", deviceType:"Printer", makeModel:"HP LaserJet Pro MFP M428fdw", serialNumber:"VNBST12345", os:"Embedded", osVersion:"N/A", ram:"", storage:"", cpu:"", azureDeviceId:"N/A", entraJoinDate:"", compliance:"N/A", intuneManaged:"N/A", lastSync:"", assignedUser:"Shared", secondaryUser:"", department:"Operations", location:"HQ – Floor 1", bitlockerKeyId:"N/A", bitlockerRecovery:"N/A", purchaseDate:"2021-11-01", vendor:"HP", purchaseCost:499, warrantyExpiry:"2024-10-31", supportContract:"HP Care Pack", endOfLife:"2026-11-01", status:"Active", notes:"Network printer – 192.168.1.50" },
  { id:8, assetTag:"IT-008", deviceName:"SRV-WIN-08", deviceType:"Server", makeModel:"Dell PowerEdge R750", serialNumber:"SN-SRV-0008", os:"Windows Server 2022", osVersion:"21H2", ram:128, storage:4096, cpu:"Intel Xeon Silver 4314", azureDeviceId:"f6a7b8c9-d0e1-2345-f012-456789012345", entraJoinDate:"2022-05-10", compliance:"Compliant", intuneManaged:"Yes", lastSync:"2025-01-10", assignedUser:"", secondaryUser:"", department:"IT", location:"Server Room", bitlockerKeyId:"CCDD3344EE556677", bitlockerRecovery:"345678-456789-567890-678901-789012-890123", purchaseDate:"2022-05-10", vendor:"Dell Technologies", purchaseCost:12000, warrantyExpiry:"2027-05-10", supportContract:"Dell ProSupport Plus", endOfLife:"2029-05-10", status:"Active", notes:"Primary file server" },
];

const INIT_USERS = [
  { id:1, employeeId:"EMP-001", fullName:"John Smith", email:"john.smith@company.com", jobTitle:"IT Coordinator", department:"IT", manager:"ceo@company.com", location:"HQ – Floor 2", phone:"+1-555-0101", mobile:"+1-555-0201", accountStatus:"Active", accountType:"Member", azureObjectId:"11111111-aaaa-bbbb-cccc-000000000001", lastSignIn:"2025-01-09", createdDate:"2020-03-01", mfaEnabled:"Yes", m365License:"Microsoft 365 Business Premium", m365Apps:"Word, Excel, Outlook, Teams, SharePoint, Intune", primaryDevice:"IT-001", allDevices:"IT-001; IT-006", oneDriveQuota:50, mailboxSize:45, groups:"IT-Team; All-Staff; IT-Admins", notes:"IT Coordinator – Entra admin" },
  { id:2, employeeId:"EMP-002", fullName:"Jane Doe", email:"jane.doe@company.com", jobTitle:"Finance Manager", department:"Finance", manager:"cfo@company.com", location:"HQ – Floor 3", phone:"+1-555-0102", mobile:"+1-555-0202", accountStatus:"Active", accountType:"Member", azureObjectId:"22222222-aaaa-bbbb-cccc-000000000002", lastSignIn:"2025-01-10", createdDate:"2019-07-15", mfaEnabled:"Yes", m365License:"Microsoft 365 Business Premium", m365Apps:"Word, Excel, Outlook, Teams, SharePoint, Power BI", primaryDevice:"IT-002", allDevices:"IT-002", oneDriveQuota:50, mailboxSize:32, groups:"Finance-Team; All-Staff", notes:"Power BI Pro licensed separately" },
  { id:3, employeeId:"EMP-003", fullName:"Alice Brown", email:"alice.brown@company.com", jobTitle:"Marketing Designer", department:"Marketing", manager:"marketing.mgr@company.com", location:"HQ – Floor 4", phone:"+1-555-0103", mobile:"+1-555-0203", accountStatus:"Active", accountType:"Member", azureObjectId:"33333333-aaaa-bbbb-cccc-000000000003", lastSignIn:"2025-01-08", createdDate:"2021-05-10", mfaEnabled:"Yes", m365License:"Microsoft 365 E3", m365Apps:"Word, Excel, Outlook, Teams, SharePoint, Adobe CC", primaryDevice:"IT-003", allDevices:"IT-003; IT-004", oneDriveQuota:100, mailboxSize:28, groups:"Marketing-Team; All-Staff", notes:"Adobe CC licensed separately" },
  { id:4, employeeId:"EMP-004", fullName:"Bob Johnson", email:"bob.johnson@company.com", jobTitle:"Sales Representative", department:"Sales", manager:"sales.mgr@company.com", location:"Remote", phone:"+1-555-0104", mobile:"+1-555-0204", accountStatus:"Active", accountType:"Member", azureObjectId:"44444444-aaaa-bbbb-cccc-000000000004", lastSignIn:"2025-01-10", createdDate:"2022-01-20", mfaEnabled:"Yes", m365License:"Microsoft 365 Business Standard", m365Apps:"Word, Excel, Outlook, Teams, SharePoint", primaryDevice:"", allDevices:"IT-005", oneDriveQuota:50, mailboxSize:18, groups:"Sales-Team; All-Staff", notes:"Field sales – remote worker" },
  { id:5, employeeId:"EMP-005", fullName:"Carol White", email:"carol.white@company.com", jobTitle:"HR Manager", department:"HR", manager:"ceo@company.com", location:"HQ – Floor 2", phone:"+1-555-0105", mobile:"+1-555-0205", accountStatus:"Active", accountType:"Member", azureObjectId:"55555555-aaaa-bbbb-cccc-000000000005", lastSignIn:"2025-01-07", createdDate:"2018-11-05", mfaEnabled:"Yes", m365License:"Microsoft 365 Business Premium", m365Apps:"Word, Excel, Outlook, Teams, SharePoint", primaryDevice:"", allDevices:"", oneDriveQuota:50, mailboxSize:55, groups:"HR-Team; All-Staff; Managers", notes:"No device assigned yet" },
  { id:6, employeeId:"EMP-006", fullName:"David Lee", email:"david.lee@company.com", jobTitle:"Software Engineer", department:"Engineering", manager:"cto@company.com", location:"HQ – Floor 5", phone:"+1-555-0106", mobile:"", accountStatus:"Active", accountType:"Member", azureObjectId:"66666666-aaaa-bbbb-cccc-000000000006", lastSignIn:"2025-01-10", createdDate:"2023-03-14", mfaEnabled:"Yes", m365License:"Microsoft 365 E5", m365Apps:"Word, Excel, Outlook, Teams, SharePoint, GitHub, VS Code", primaryDevice:"", allDevices:"", oneDriveQuota:100, mailboxSize:22, groups:"Engineering-Team; All-Staff; Dev-Squad", notes:"GitHub Enterprise licensed separately" },
  { id:7, employeeId:"SVC-001", fullName:"Print Service Account", email:"print.svc@company.com", jobTitle:"Service Account", department:"IT", manager:"john.smith@company.com", location:"HQ – Floor 1", phone:"", mobile:"", accountStatus:"Active", accountType:"Service Account", azureObjectId:"77777777-aaaa-bbbb-cccc-000000000007", lastSignIn:"", createdDate:"2021-11-01", mfaEnabled:"No", m365License:"No License", m365Apps:"", primaryDevice:"", allDevices:"IT-007", oneDriveQuota:0, mailboxSize:0, groups:"", notes:"Printer service account – no interactive login" },
];

const INIT_SOFTWARE = [
  { id:1, licenseId:"LIC-001", softwareName:"Microsoft 365 Business Premium", vendor:"Microsoft", category:"Productivity", version:"Latest", licenseType:"Subscription (Annual)", licenseKey:"Managed via M365 Admin Centre", totalSeats:25, usedSeats:7, purchaseDate:"2024-01-01", expiryDate:"2025-01-01", annualCost:3500, costPerSeat:140, supportEmail:"m365support@microsoft.com", supportPhone:"+1-800-642-7676", contractPO:"PO-2024-001", autoRenew:"Yes", status:"Active", notes:"Covers all M365 apps + Intune + Defender" },
  { id:2, licenseId:"LIC-002", softwareName:"Adobe Creative Cloud", vendor:"Adobe", category:"Design", version:"2024", licenseType:"Subscription (Annual)", licenseKey:"Managed via Adobe Admin Console", totalSeats:3, usedSeats:1, purchaseDate:"2024-03-01", expiryDate:"2025-03-01", annualCost:1800, costPerSeat:600, supportEmail:"adobe-support@adobe.com", supportPhone:"+1-800-833-6687", contractPO:"PO-2024-002", autoRenew:"Yes", status:"Active", notes:"1 named user – Alice Brown" },
  { id:3, licenseId:"LIC-003", softwareName:"GitHub Enterprise", vendor:"GitHub", category:"Development", version:"Latest", licenseType:"Subscription (Annual)", licenseKey:"Managed via GitHub Org", totalSeats:10, usedSeats:1, purchaseDate:"2024-03-14", expiryDate:"2025-03-14", annualCost:2100, costPerSeat:210, supportEmail:"enterprise@github.com", supportPhone:"", contractPO:"PO-2024-003", autoRenew:"Yes", status:"Active", notes:"Engineering team" },
  { id:4, licenseId:"LIC-004", softwareName:"AutoCAD 2024", vendor:"Autodesk", category:"Design", version:"2024", licenseType:"Subscription (Annual)", licenseKey:"XXXX-XXXX-XXXX-XXXX-0042", totalSeats:2, usedSeats:0, purchaseDate:"2023-06-01", expiryDate:"2024-06-01", annualCost:1800, costPerSeat:900, supportEmail:"autodesk.support@autodesk.com", supportPhone:"+1-800-438-4239", contractPO:"PO-2023-007", autoRenew:"No", status:"Expired", notes:"RENEWAL REQUIRED – contact vendor" },
  { id:5, licenseId:"LIC-005", softwareName:"Malwarebytes Endpoint", vendor:"Malwarebytes", category:"Security", version:"4.6", licenseType:"Subscription (Annual)", licenseKey:"MB-ENDPOINT-KEY-2024", totalSeats:50, usedSeats:8, purchaseDate:"2024-01-15", expiryDate:"2025-01-15", annualCost:400, costPerSeat:8, supportEmail:"support@malwarebytes.com", supportPhone:"", contractPO:"PO-2024-004", autoRenew:"Yes", status:"Active", notes:"Endpoint protection – all devices" },
  { id:6, licenseId:"LIC-006", softwareName:"Zoom Business", vendor:"Zoom", category:"Communication", version:"Latest", licenseType:"Subscription (Annual)", licenseKey:"Managed via Zoom Admin", totalSeats:10, usedSeats:6, purchaseDate:"2024-02-01", expiryDate:"2025-02-01", annualCost:1500, costPerSeat:150, supportEmail:"support@zoom.us", supportPhone:"", contractPO:"PO-2024-005", autoRenew:"Yes", status:"Active", notes:"Video conferencing" },
  { id:7, licenseId:"LIC-007", softwareName:"Veeam Backup Essentials", vendor:"Veeam", category:"Backup", version:"12", licenseType:"Perpetual", licenseKey:"VBR-ESSENTIALS-SN-007", totalSeats:5, usedSeats:1, purchaseDate:"2022-05-10", expiryDate:"2025-05-10", annualCost:1200, costPerSeat:240, supportEmail:"support@veeam.com", supportPhone:"+1-800-681-9048", contractPO:"PO-2022-003", autoRenew:"No", status:"Active", notes:"Server backup – includes 3yr support" },
];

const INIT_SW_MAP = [
  { id:1, assetTag:"IT-001", deviceName:"DESKTOP-ABCD01", assignedUser:"john.smith@company.com", softwareName:"Microsoft 365 Business Premium", licenseId:"LIC-001", version:"Microsoft 365 Apps", installDate:"2023-06-15", lastUpdated:"2025-01-10", installType:"Managed (Intune)", approved:"Yes", notes:"" },
  { id:2, assetTag:"IT-001", deviceName:"DESKTOP-ABCD01", assignedUser:"john.smith@company.com", softwareName:"Malwarebytes Endpoint", licenseId:"LIC-005", version:"4.6.8", installDate:"2023-06-15", lastUpdated:"2025-01-05", installType:"Managed (Intune)", approved:"Yes", notes:"" },
  { id:3, assetTag:"IT-002", deviceName:"LAPTOP-XYZ99", assignedUser:"jane.doe@company.com", softwareName:"Microsoft 365 Business Premium", licenseId:"LIC-001", version:"Microsoft 365 Apps", installDate:"2024-01-10", lastUpdated:"2025-01-09", installType:"Managed (Intune)", approved:"Yes", notes:"" },
  { id:4, assetTag:"IT-003", deviceName:"LAPTOP-MKT01", assignedUser:"alice.brown@company.com", softwareName:"Adobe Creative Cloud", licenseId:"LIC-002", version:"2024.5", installDate:"2024-03-05", lastUpdated:"2024-12-15", installType:"Manual", approved:"Yes", notes:"Named user license" },
  { id:5, assetTag:"IT-003", deviceName:"LAPTOP-MKT01", assignedUser:"alice.brown@company.com", softwareName:"Microsoft 365 E3", licenseId:"LIC-001", version:"Microsoft 365 Apps", installDate:"2024-03-01", lastUpdated:"2025-01-08", installType:"Managed (Intune)", approved:"Yes", notes:"" },
];

// ── Helpers ────────────────────────────────────────────────────────
function warrantyStatus(expiry) {
  if (!expiry || expiry === "N/A") return null;
  const days = Math.ceil((new Date(expiry) - new Date()) / 86400000);
  if (days < 0)   return { label:"Expired",       color:"#ef4444", bg:"#fef2f2" };
  if (days <= 90) return { label:`${days}d left`,  color:"#f59e0b", bg:"#fffbeb" };
  return           { label:"Active",            color:"#22c55e", bg:"#f0fdf4" };
}
function licenseStatus(expiry, status) {
  if (status === "Expired") return { label:"Expired", color:"#ef4444", bg:"#fef2f2" };
  if (!expiry) return null;
  const days = Math.ceil((new Date(expiry) - new Date()) / 86400000);
  if (days < 0)   return { label:"Expired",       color:"#ef4444", bg:"#fef2f2" };
  if (days <= 90) return { label:`${days}d left`,  color:"#f59e0b", bg:"#fffbeb" };
  return           { label:"Active",            color:"#22c55e", bg:"#f0fdf4" };
}

const Pill = ({ label, color, bg, size = 11 }) => (
  <span style={{ background: bg, color, fontWeight: 600, fontSize: size,
    padding: "2px 9px", borderRadius: 99, border: `1px solid ${color}33`, whiteSpace:"nowrap" }}>{label}</span>
);

const COMP_COLOR = { Compliant:"#22c55e", "Non-Compliant":"#ef4444", Pending:"#f59e0b", "N/A":"#94a3b8" };
const STATUS_COLOR = { Active:"#22c55e", Disabled:"#94a3b8", "Locked Out":"#ef4444", Guest:"#8b5cf6", "Service Account":"#3b82f6" };
const SW_STATUS_COLOR = { Active:"#22c55e", Expired:"#ef4444", Cancelled:"#94a3b8", "Pending Renewal":"#f59e0b" };

// ── Reusable UI ────────────────────────────────────────────────────
const tdS = { padding:"10px 13px", borderBottom:"1px solid #f1f5f9", verticalAlign:"middle" };

function SearchBar({ value, onChange, placeholder }) {
  return (
    <input value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ flex:1, minWidth:240, padding:"9px 14px", borderRadius:9,
        border:"1px solid #e2e8f0", fontSize:13, fontFamily:"inherit",
        background:"#fff", outline:"none" }} />
  );
}
function FilterSelect({ value, onChange, opts, placeholder }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ padding:"9px 11px", borderRadius:9, border:"1px solid #e2e8f0",
        fontSize:13, fontFamily:"inherit", background:"#fff", cursor:"pointer" }}>
      <option value="All">{placeholder}</option>
      {opts.map(o => <option key={o}>{o}</option>)}
    </select>
  );
}
function TableHeader({ cols, color = "#1e3a5f" }) {
  return (
    <thead>
      <tr style={{ background: color }}>
        {cols.map(h => (
          <th key={h} style={{ padding:"11px 13px", textAlign:"left",
            color:"#fff", fontWeight:600, fontSize:12, whiteSpace:"nowrap" }}>{h}</th>
        ))}
      </tr>
    </thead>
  );
}
function EmptyRow({ cols }) {
  return <tr><td colSpan={cols} style={{ padding:36, textAlign:"center", color:"#94a3b8", fontSize:13 }}>
    No records found. Try adjusting your filters.
  </td></tr>;
}

// ── Modal scaffold ─────────────────────────────────────────────────
function Modal({ title, onClose, onSave, children }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"#0009", zIndex:1000,
      display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:"#fff", borderRadius:16, width:"100%", maxWidth:900,
        maxHeight:"92vh", overflow:"auto", boxShadow:"0 24px 64px #0005" }}>
        <div style={{ padding:"18px 26px", background:"#1e3a5f",
          borderRadius:"16px 16px 0 0", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ color:"#fff", fontWeight:700, fontSize:15 }}>{title}</span>
          <button onClick={onClose} style={{ background:"none", border:"none",
            color:"#fff", fontSize:22, cursor:"pointer", lineHeight:1 }}>✕</button>
        </div>
        <div style={{ padding:26 }}>
          {children}
          <div style={{ marginTop:22, display:"flex", gap:10, justifyContent:"flex-end" }}>
            <button onClick={onClose} style={{ padding:"9px 20px", borderRadius:8,
              border:"1px solid #e2e8f0", background:"#f8fafc", cursor:"pointer",
              fontWeight:600, fontSize:13 }}>Cancel</button>
            <button onClick={onSave} style={{ padding:"9px 22px", borderRadius:8,
              border:"none", background:"#1e3a5f", color:"#fff",
              cursor:"pointer", fontWeight:700, fontSize:13 }}>💾 Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormGrid({ children }) {
  return <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(210px,1fr))", gap:14 }}>{children}</div>;
}
function Field({ label, value, onChange, type="text", opts, wide }) {
  const input = opts
    ? <select value={value} onChange={e => onChange(e.target.value)} style={iS}>{opts.map(o=><option key={o}>{o}</option>)}</select>
    : <input type={type} value={value ?? ""} onChange={e => onChange(e.target.value)} style={iS} />;
  return (
    <div style={{ gridColumn: wide ? "1/-1" : undefined, display:"flex", flexDirection:"column", gap:3 }}>
      <label style={{ fontSize:11, fontWeight:600, color:"#64748b", textTransform:"uppercase", letterSpacing:.4 }}>{label}</label>
      {input}
    </div>
  );
}
const iS = { padding:"8px 10px", borderRadius:7, border:"1px solid #e2e8f0",
  fontSize:13, fontFamily:"inherit", outline:"none", background:"#f8fafc", width:"100%", boxSizing:"border-box" };

// ── Side Detail Panel ──────────────────────────────────────────────
function DetailPanel({ title, icon, subtitle, tags, sections, onClose, onEdit }) {
  return (
    <div style={{ position:"fixed", right:0, top:0, bottom:0, width:450, background:"#fff",
      boxShadow:"-6px 0 32px #0003", zIndex:500, display:"flex", flexDirection:"column" }}>
      <div style={{ padding:"18px 22px", background:"#1e3a5f",
        display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div>
          <div style={{ color:"#fff", fontWeight:700, fontSize:17 }}>{icon} {title}</div>
          {subtitle && <div style={{ color:"#93c5fd", fontSize:12, marginTop:3 }}>{subtitle}</div>}
        </div>
        <button onClick={onClose} style={{ background:"none", border:"none",
          color:"#fff", fontSize:22, cursor:"pointer" }}>✕</button>
      </div>
      {tags?.length > 0 && (
        <div style={{ padding:"12px 20px", display:"flex", gap:8, flexWrap:"wrap",
          borderBottom:"1px solid #f1f5f9", background:"#f8fafc" }}>
          {tags.map((t, i) => t && <Pill key={i} {...t} />)}
        </div>
      )}
      <div style={{ overflowY:"auto", flex:1, padding:"16px 20px" }}>
        {sections.map(({ heading, rows }) => (
          <div key={heading} style={{ marginBottom:18 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#1e3a5f", textTransform:"uppercase",
              letterSpacing:.7, borderBottom:"2px solid #1e3a5f22", paddingBottom:4, marginBottom:6 }}>{heading}</div>
            {rows.filter(r => r.value).map(({ label, value }) => (
              <div key={label} style={{ display:"flex", gap:8, padding:"5px 0",
                borderBottom:"1px solid #f8fafc" }}>
                <div style={{ width:170, fontSize:12, color:"#64748b", fontWeight:600, flexShrink:0 }}>{label}</div>
                <div style={{ fontSize:13, color:"#1e293b", wordBreak:"break-all" }}>{value}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div style={{ padding:"14px 20px", borderTop:"1px solid #f1f5f9" }}>
        <button onClick={onEdit} style={{ width:"100%", padding:10, borderRadius:9,
          background:"#1e3a5f", color:"#fff", border:"none", fontWeight:700, fontSize:13, cursor:"pointer" }}>
          ✏️ Edit Record
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// DEVICE SECTION
// ══════════════════════════════════════════════════════════════════════
const EMPTY_DEVICE = { assetTag:"", deviceName:"", deviceType:"Desktop", makeModel:"", serialNumber:"", os:"Windows 11 Pro", osVersion:"", ram:"", storage:"", cpu:"", azureDeviceId:"", entraJoinDate:"", compliance:"Compliant", intuneManaged:"Yes", lastSync:"", assignedUser:"", secondaryUser:"", department:"IT", location:"", bitlockerKeyId:"", bitlockerRecovery:"", purchaseDate:"", vendor:"", purchaseCost:"", warrantyExpiry:"", supportContract:"", endOfLife:"", status:"Active", notes:"" };

function DeviceSection({ devices, setDevices, swMap }) {
  const [search, setSearch] = useState("");
  const [fType, setFType] = useState("All");
  const [fDept, setFDept] = useState("All");
  const [fComp, setFComp] = useState("All");
  const [selected, setSelected] = useState(null);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_DEVICE);

  const set = (k,v) => setForm(f => ({ ...f, [k]:v }));

  const filtered = useMemo(() => devices.filter(d => {
    const q = search.toLowerCase();
    return (!q || [d.assetTag,d.deviceName,d.makeModel,d.assignedUser,d.serialNumber,d.azureDeviceId].some(v=>String(v).toLowerCase().includes(q)))
      && (fType==="All"||d.deviceType===fType) && (fDept==="All"||d.department===fDept) && (fComp==="All"||d.compliance===fComp);
  }), [devices,search,fType,fDept,fComp]);

  const openNew  = () => { setForm({...EMPTY_DEVICE}); setModal("edit"); };
  const openEdit = (d) => { setForm({...d}); setModal("edit"); };
  const save = () => {
    if (form.id) { setDevices(ds => ds.map(d => d.id===form.id ? form : d)); setSelected(form); }
    else { const n={...form,id:Date.now()}; setDevices(ds=>[n,...ds]); }
    setModal(null);
  };
  const del = id => { if(window.confirm("Delete device?")){ setDevices(ds=>ds.filter(d=>d.id!==id)); setSelected(null); }};

  const deviceSoftware = selected ? swMap.filter(s => s.assetTag === selected.assetTag) : [];

  return (
    <div>
      <div style={{ display:"flex", gap:10, marginBottom:18, flexWrap:"wrap", alignItems:"center" }}>
        <SearchBar value={search} onChange={setSearch} placeholder="🔍  Search devices, users, serials, Azure IDs…" />
        <FilterSelect value={fType} onChange={setFType} opts={DEVICE_TYPES} placeholder="All Types" />
        <FilterSelect value={fDept} onChange={setFDept} opts={DEPARTMENTS} placeholder="All Depts" />
        <FilterSelect value={fComp} onChange={setFComp} opts={COMPLIANCE} placeholder="Compliance" />
        <span style={{ fontSize:12, color:"#64748b" }}>{filtered.length} / {devices.length}</span>
        <button onClick={openNew} style={{ marginLeft:"auto", padding:"9px 16px", borderRadius:8,
          background:"#1e3a5f", color:"#fff", border:"none", fontWeight:700, fontSize:13, cursor:"pointer" }}>+ Add Device</button>
      </div>
      <div style={{ background:"#fff", borderRadius:12, overflow:"hidden", boxShadow:"0 1px 4px #0001",
        marginRight: selected ? 460 : 0, transition:"margin .2s" }}>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <TableHeader cols={["Asset Tag","Device","Type","Model","User","Dept","OS","Compliance","Warranty","Status",""]} />
            <tbody>
              {filtered.length===0 && <EmptyRow cols={11} />}
              {filtered.map((d,i) => {
                const ws = warrantyStatus(d.warrantyExpiry);
                const sel = selected?.id===d.id;
                return (
                  <tr key={d.id} onClick={()=>setSelected(sel?null:d)}
                    style={{ background:sel?"#eff6ff":i%2===0?"#fff":"#f8fafc", cursor:"pointer",
                      borderLeft:`3px solid ${sel?"#3b82f6":"transparent"}` }}>
                    <td style={tdS}><code style={{ fontSize:11, background:"#f1f5f9", padding:"2px 6px", borderRadius:4 }}>{d.assetTag}</code></td>
                    <td style={tdS}><span style={{ fontWeight:600 }}>{DEVICE_ICONS[d.deviceType]} {d.deviceName}</span></td>
                    <td style={tdS}>{d.deviceType}</td>
                    <td style={tdS}>{d.makeModel}</td>
                    <td style={tdS}><span style={{ fontSize:12 }}>{d.assignedUser || <em style={{color:"#94a3b8"}}>Unassigned</em>}</span></td>
                    <td style={tdS}>{d.department}</td>
                    <td style={tdS}><span style={{ fontSize:11 }}>{d.os}</span></td>
                    <td style={tdS}><Pill label={d.compliance} color={COMP_COLOR[d.compliance]||"#94a3b8"} bg={(COMP_COLOR[d.compliance]||"#94a3b8")+"22"} /></td>
                    <td style={tdS}>{ws?<Pill {...ws}/>:<span style={{color:"#cbd5e1"}}>—</span>}</td>
                    <td style={tdS}><span style={{ fontSize:11, color:"#64748b" }}>{d.status}</span></td>
                    <td style={tdS}>
                      <div style={{ display:"flex", gap:5 }}>
                        <button onClick={e=>{e.stopPropagation();openEdit(d)}} style={btnS}>✏️</button>
                        <button onClick={e=>{e.stopPropagation();del(d.id)}} style={{...btnS,borderColor:"#fee2e2",background:"#fff5f5",color:"#ef4444"}}>🗑</button>
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
        <DetailPanel
          title={selected.deviceName} icon={DEVICE_ICONS[selected.deviceType]}
          subtitle={selected.assetTag} onClose={()=>setSelected(null)} onEdit={()=>openEdit(selected)}
          tags={[
            { label:selected.deviceType, color:"#3b82f6", bg:"#eff6ff" },
            { label:selected.compliance, color:COMP_COLOR[selected.compliance]||"#94a3b8", bg:(COMP_COLOR[selected.compliance]||"#94a3b8")+"22" },
            warrantyStatus(selected.warrantyExpiry),
          ].filter(Boolean)}
          sections={[
            { heading:"🔧 Hardware", rows:[
              {label:"Make / Model",    value:selected.makeModel},
              {label:"Serial Number",  value:selected.serialNumber},
              {label:"CPU",            value:selected.cpu},
              {label:"RAM",            value:selected.ram ? selected.ram+" GB" : null},
              {label:"Storage",        value:selected.storage ? selected.storage+" GB" : null},
              {label:"OS",             value:`${selected.os} ${selected.osVersion}`},
            ]},
            { heading:"☁️ Azure AD / Entra", rows:[
              {label:"Device ID",      value:selected.azureDeviceId},
              {label:"Join Date",      value:selected.entraJoinDate},
              {label:"Compliance",     value:selected.compliance},
              {label:"Intune Managed", value:selected.intuneManaged},
              {label:"Last Sync",      value:selected.lastSync},
            ]},
            { heading:"👤 Assignment", rows:[
              {label:"Assigned User",  value:selected.assignedUser},
              {label:"Secondary User", value:selected.secondaryUser},
              {label:"Department",     value:selected.department},
              {label:"Location",       value:selected.location},
            ]},
            { heading:"🔐 BitLocker", rows:[
              {label:"Key ID",         value:selected.bitlockerKeyId},
              {label:"Recovery Key",   value:selected.bitlockerRecovery},
            ]},
            { heading:"📋 Procurement", rows:[
              {label:"Vendor",         value:selected.vendor},
              {label:"Purchase Date",  value:selected.purchaseDate},
              {label:"Purchase Cost",  value:selected.purchaseCost ? `$${selected.purchaseCost}` : null},
              {label:"Warranty Expiry",value:selected.warrantyExpiry},
              {label:"Support Contract",value:selected.supportContract},
              {label:"End of Life",    value:selected.endOfLife},
              {label:"Status",         value:selected.status},
              {label:"Notes",          value:selected.notes},
            ]},
            { heading:"📦 Installed Software", rows:
              deviceSoftware.length > 0
                ? deviceSoftware.map(s => ({ label:s.licenseId, value:`${s.softwareName} v${s.version}` }))
                : [{ label:"No entries", value:"No software mapped to this device yet" }]
            },
          ]}
        />
      )}

      {modal==="edit" && (
        <Modal title={form.id?"✏️ Edit Device":"➕ Add Device"} onClose={()=>setModal(null)} onSave={save}>
          <FormGrid>
            <Field label="Asset Tag"        value={form.assetTag}       onChange={v=>set("assetTag",v)} />
            <Field label="Device Name"      value={form.deviceName}     onChange={v=>set("deviceName",v)} />
            <Field label="Device Type"      value={form.deviceType}     onChange={v=>set("deviceType",v)} opts={DEVICE_TYPES} />
            <Field label="Make / Model"     value={form.makeModel}      onChange={v=>set("makeModel",v)} />
            <Field label="Serial Number"    value={form.serialNumber}   onChange={v=>set("serialNumber",v)} />
            <Field label="CPU"              value={form.cpu}            onChange={v=>set("cpu",v)} />
            <Field label="OS"               value={form.os}             onChange={v=>set("os",v)} opts={OS_OPTIONS} />
            <Field label="OS Version"       value={form.osVersion}      onChange={v=>set("osVersion",v)} />
            <Field label="RAM (GB)"         value={form.ram}            onChange={v=>set("ram",v)} type="number" />
            <Field label="Storage (GB)"     value={form.storage}        onChange={v=>set("storage",v)} type="number" />
            <Field label="Azure AD Device ID" value={form.azureDeviceId} onChange={v=>set("azureDeviceId",v)} />
            <Field label="Entra Join Date"  value={form.entraJoinDate}  onChange={v=>set("entraJoinDate",v)} type="date" />
            <Field label="Compliance"       value={form.compliance}     onChange={v=>set("compliance",v)} opts={COMPLIANCE} />
            <Field label="Intune Managed"   value={form.intuneManaged}  onChange={v=>set("intuneManaged",v)} opts={["Yes","No","N/A"]} />
            <Field label="Last Sync"        value={form.lastSync}       onChange={v=>set("lastSync",v)} type="date" />
            <Field label="Assigned User"    value={form.assignedUser}   onChange={v=>set("assignedUser",v)} />
            <Field label="Secondary User"   value={form.secondaryUser}  onChange={v=>set("secondaryUser",v)} />
            <Field label="Department"       value={form.department}     onChange={v=>set("department",v)} opts={DEPARTMENTS} />
            <Field label="Location"         value={form.location}       onChange={v=>set("location",v)} />
            <Field label="BitLocker Key ID" value={form.bitlockerKeyId} onChange={v=>set("bitlockerKeyId",v)} />
            <Field label="BitLocker Recovery Key" value={form.bitlockerRecovery} onChange={v=>set("bitlockerRecovery",v)} />
            <Field label="Vendor"           value={form.vendor}         onChange={v=>set("vendor",v)} />
            <Field label="Purchase Date"    value={form.purchaseDate}   onChange={v=>set("purchaseDate",v)} type="date" />
            <Field label="Purchase Cost ($)"value={form.purchaseCost}   onChange={v=>set("purchaseCost",v)} type="number" />
            <Field label="Warranty Expiry"  value={form.warrantyExpiry} onChange={v=>set("warrantyExpiry",v)} type="date" />
            <Field label="Support Contract" value={form.supportContract} onChange={v=>set("supportContract",v)} />
            <Field label="End of Life"      value={form.endOfLife}      onChange={v=>set("endOfLife",v)} type="date" />
            <Field label="Status"           value={form.status}         onChange={v=>set("status",v)} opts={DEVICE_STATUS} />
          </FormGrid>
          <div style={{ marginTop:14 }}>
            <Field label="Notes" value={form.notes} onChange={v=>set("notes",v)} wide />
          </div>
        </Modal>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// USER SECTION
// ══════════════════════════════════════════════════════════════════════
const EMPTY_USER = { employeeId:"", fullName:"", email:"", jobTitle:"", department:"IT", manager:"", location:"", phone:"", mobile:"", accountStatus:"Active", accountType:"Member", azureObjectId:"", lastSignIn:"", createdDate:"", mfaEnabled:"Yes", m365License:"Microsoft 365 Business Standard", m365Apps:"", primaryDevice:"", allDevices:"", oneDriveQuota:"", mailboxSize:"", groups:"", notes:"" };

function UserSection({ users, setUsers, devices }) {
  const [search, setSearch] = useState("");
  const [fDept, setFDept] = useState("All");
  const [fStatus, setFStatus] = useState("All");
  const [selected, setSelected] = useState(null);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_USER);

  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const filtered = useMemo(() => users.filter(u => {
    const q = search.toLowerCase();
    return (!q || [u.fullName,u.email,u.jobTitle,u.employeeId,u.azureObjectId].some(v=>String(v).toLowerCase().includes(q)))
      && (fDept==="All"||u.department===fDept) && (fStatus==="All"||u.accountStatus===fStatus);
  }), [users,search,fDept,fStatus]);

  const openEdit = d => { setForm({...d}); setModal("edit"); };
  const save = () => {
    if(form.id){ setUsers(us=>us.map(u=>u.id===form.id?form:u)); setSelected(form); }
    else { const n={...form,id:Date.now()}; setUsers(us=>[n,...us]); }
    setModal(null);
  };
  const del = id => { if(window.confirm("Delete user?")){ setUsers(us=>us.filter(u=>u.id!==id)); setSelected(null); }};

  const userDevices = selected
    ? devices.filter(d => d.assignedUser===selected.email || d.secondaryUser===selected.email || (selected.allDevices||"").includes(d.assetTag))
    : [];

  return (
    <div>
      <div style={{ display:"flex", gap:10, marginBottom:18, flexWrap:"wrap", alignItems:"center" }}>
        <SearchBar value={search} onChange={setSearch} placeholder="🔍  Search users, email, job title, Azure Object ID…" />
        <FilterSelect value={fDept} onChange={setFDept} opts={DEPARTMENTS} placeholder="All Depts" />
        <FilterSelect value={fStatus} onChange={setFStatus} opts={USER_STATUS} placeholder="All Statuses" />
        <span style={{ fontSize:12, color:"#64748b" }}>{filtered.length} / {users.length}</span>
        <button onClick={()=>{setForm({...EMPTY_USER});setModal("edit")}} style={{ marginLeft:"auto", padding:"9px 16px",
          borderRadius:8, background:"#1a7a6e", color:"#fff", border:"none", fontWeight:700, fontSize:13, cursor:"pointer" }}>+ Add User</button>
      </div>
      <div style={{ background:"#fff", borderRadius:12, overflow:"hidden", boxShadow:"0 1px 4px #0001",
        marginRight:selected?460:0, transition:"margin .2s" }}>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <TableHeader cols={["ID","Full Name","Email","Title","Dept","License","Status","MFA","Devices",""]} color="#1a7a6e" />
            <tbody>
              {filtered.length===0 && <EmptyRow cols={10} />}
              {filtered.map((u,i) => {
                const sel = selected?.id===u.id;
                const devCount = u.allDevices ? u.allDevices.split(";").filter(Boolean).length : 0;
                return (
                  <tr key={u.id} onClick={()=>setSelected(sel?null:u)}
                    style={{ background:sel?"#f0fdfa":i%2===0?"#fff":"#f8fafc", cursor:"pointer",
                      borderLeft:`3px solid ${sel?"#1a7a6e":"transparent"}`,
                      opacity:u.accountStatus==="Disabled"?0.5:1 }}>
                    <td style={tdS}><code style={{ fontSize:11,background:"#f1f5f9",padding:"2px 6px",borderRadius:4 }}>{u.employeeId}</code></td>
                    <td style={tdS}><span style={{ fontWeight:600 }}>👤 {u.fullName}</span></td>
                    <td style={tdS}><span style={{ fontSize:12, color:"#3b82f6" }}>{u.email}</span></td>
                    <td style={tdS}><span style={{ fontSize:12 }}>{u.jobTitle}</span></td>
                    <td style={tdS}>{u.department}</td>
                    <td style={tdS}><span style={{ fontSize:11 }}>{u.m365License}</span></td>
                    <td style={tdS}><Pill label={u.accountStatus} color={STATUS_COLOR[u.accountStatus]||"#94a3b8"} bg={(STATUS_COLOR[u.accountStatus]||"#94a3b8")+"22"} /></td>
                    <td style={tdS}><Pill label={u.mfaEnabled==="Yes"?"✅ MFA":"⚠️ No MFA"} color={u.mfaEnabled==="Yes"?"#22c55e":"#ef4444"} bg={u.mfaEnabled==="Yes"?"#f0fdf4":"#fef2f2"} /></td>
                    <td style={tdS}>{devCount>0?<Pill label={`${devCount} device${devCount>1?"s":""}`} color="#3b82f6" bg="#eff6ff"/>:<span style={{color:"#cbd5e1",fontSize:12}}>None</span>}</td>
                    <td style={tdS}>
                      <div style={{ display:"flex", gap:5 }}>
                        <button onClick={e=>{e.stopPropagation();openEdit(u)}} style={btnS}>✏️</button>
                        <button onClick={e=>{e.stopPropagation();del(u.id)}} style={{...btnS,borderColor:"#fee2e2",background:"#fff5f5",color:"#ef4444"}}>🗑</button>
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
        <DetailPanel
          title={selected.fullName} icon="👤" subtitle={selected.email}
          onClose={()=>setSelected(null)} onEdit={()=>openEdit(selected)}
          tags={[
            { label:selected.accountStatus, color:STATUS_COLOR[selected.accountStatus]||"#94a3b8", bg:(STATUS_COLOR[selected.accountStatus]||"#94a3b8")+"22" },
            { label:selected.mfaEnabled==="Yes"?"✅ MFA On":"⚠️ No MFA", color:selected.mfaEnabled==="Yes"?"#22c55e":"#ef4444", bg:selected.mfaEnabled==="Yes"?"#f0fdf4":"#fef2f2" },
            { label:selected.accountType, color:"#8b5cf6", bg:"#f5f3ff" },
          ]}
          sections={[
            { heading:"👤 Identity", rows:[
              {label:"Employee ID",    value:selected.employeeId},
              {label:"Job Title",      value:selected.jobTitle},
              {label:"Department",     value:selected.department},
              {label:"Manager",        value:selected.manager},
              {label:"Office",         value:selected.location},
              {label:"Phone",          value:selected.phone},
              {label:"Mobile",         value:selected.mobile},
            ]},
            { heading:"☁️ Azure AD / Entra", rows:[
              {label:"Azure Object ID",value:selected.azureObjectId},
              {label:"Account Type",   value:selected.accountType},
              {label:"Last Sign-In",   value:selected.lastSignIn},
              {label:"Created Date",   value:selected.createdDate},
              {label:"MFA Enabled",    value:selected.mfaEnabled},
            ]},
            { heading:"📧 Microsoft 365", rows:[
              {label:"License",        value:selected.m365License},
              {label:"Apps",           value:selected.m365Apps},
              {label:"OneDrive Quota", value:selected.oneDriveQuota ? selected.oneDriveQuota+" GB" : null},
              {label:"Mailbox Size",   value:selected.mailboxSize ? selected.mailboxSize+" GB" : null},
              {label:"Groups / Teams", value:selected.groups},
            ]},
            { heading:"🖥 Assigned Devices", rows:
              userDevices.length>0
                ? userDevices.map(d=>({ label:d.assetTag, value:`${DEVICE_ICONS[d.deviceType]} ${d.deviceName} — ${d.makeModel}` }))
                : [{label:"No devices", value:"No devices currently assigned"}]
            },
            { heading:"📋 Notes", rows:[{label:"Notes", value:selected.notes}] },
          ]}
        />
      )}

      {modal==="edit" && (
        <Modal title={form.id?"✏️ Edit User":"➕ Add User"} onClose={()=>setModal(null)} onSave={save}>
          <FormGrid>
            <Field label="Employee ID"    value={form.employeeId}    onChange={v=>set("employeeId",v)} />
            <Field label="Full Name"      value={form.fullName}      onChange={v=>set("fullName",v)} />
            <Field label="Email (UPN)"    value={form.email}         onChange={v=>set("email",v)} type="email" />
            <Field label="Job Title"      value={form.jobTitle}      onChange={v=>set("jobTitle",v)} />
            <Field label="Department"     value={form.department}    onChange={v=>set("department",v)} opts={DEPARTMENTS} />
            <Field label="Manager Email"  value={form.manager}       onChange={v=>set("manager",v)} />
            <Field label="Office / Location" value={form.location}  onChange={v=>set("location",v)} />
            <Field label="Phone"          value={form.phone}         onChange={v=>set("phone",v)} />
            <Field label="Mobile"         value={form.mobile}        onChange={v=>set("mobile",v)} />
            <Field label="Account Status" value={form.accountStatus} onChange={v=>set("accountStatus",v)} opts={USER_STATUS} />
            <Field label="Account Type"   value={form.accountType}   onChange={v=>set("accountType",v)} opts={["Member","Guest","Service Account","Shared Mailbox","Resource"]} />
            <Field label="Azure Object ID" value={form.azureObjectId} onChange={v=>set("azureObjectId",v)} />
            <Field label="Last Sign-In"   value={form.lastSignIn}    onChange={v=>set("lastSignIn",v)} type="date" />
            <Field label="Created Date"   value={form.createdDate}   onChange={v=>set("createdDate",v)} type="date" />
            <Field label="MFA Enabled"    value={form.mfaEnabled}    onChange={v=>set("mfaEnabled",v)} opts={["Yes","No","Enforced"]} />
            <Field label="M365 License"   value={form.m365License}   onChange={v=>set("m365License",v)} opts={M365_LICENSES} />
            <Field label="Primary Device" value={form.primaryDevice} onChange={v=>set("primaryDevice",v)} />
            <Field label="All Devices"    value={form.allDevices}    onChange={v=>set("allDevices",v)} />
            <Field label="OneDrive (GB)"  value={form.oneDriveQuota} onChange={v=>set("oneDriveQuota",v)} type="number" />
            <Field label="Mailbox (GB)"   value={form.mailboxSize}   onChange={v=>set("mailboxSize",v)} type="number" />
          </FormGrid>
          <div style={{ marginTop:14, display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            <Field label="M365 Apps"      value={form.m365Apps}      onChange={v=>set("m365Apps",v)} wide />
            <Field label="Groups / Teams" value={form.groups}        onChange={v=>set("groups",v)} wide />
            <Field label="Notes"          value={form.notes}         onChange={v=>set("notes",v)} wide />
          </div>
        </Modal>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// SOFTWARE SECTION
// ══════════════════════════════════════════════════════════════════════
const EMPTY_SW = { licenseId:"", softwareName:"", vendor:"", category:"Productivity", version:"", licenseType:"Subscription (Annual)", licenseKey:"", totalSeats:"", usedSeats:"", purchaseDate:"", expiryDate:"", annualCost:"", costPerSeat:"", supportEmail:"", supportPhone:"", contractPO:"", autoRenew:"Yes", status:"Active", notes:"" };

function SoftwareSection({ software, setSoftware, swMap, setSwMap, devices }) {
  const [search, setSearch] = useState("");
  const [fCat, setFCat] = useState("All");
  const [fStat, setFStat] = useState("All");
  const [selected, setSelected] = useState(null);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_SW);
  const [mapModal, setMapModal] = useState(null);
  const [mapForm, setMapForm] = useState({ assetTag:"", softwareName:"", licenseId:"", version:"", installDate:"", lastUpdated:"", installType:"Managed (Intune)", approved:"Yes", notes:"" });

  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const filtered = useMemo(() => software.filter(s => {
    const q = search.toLowerCase();
    return (!q||[s.softwareName,s.vendor,s.licenseId,s.licenseKey].some(v=>String(v).toLowerCase().includes(q)))
      && (fCat==="All"||s.category===fCat) && (fStat==="All"||s.status===fStat);
  }), [software,search,fCat,fStat]);

  const openEdit = s => { setForm({...s}); setModal("edit"); };
  const save = () => {
    if(form.id){ setSoftware(ss=>ss.map(s=>s.id===form.id?form:s)); setSelected(form); }
    else { const n={...form,id:Date.now()}; setSoftware(ss=>[n,...ss]); }
    setModal(null);
  };
  const del = id => { if(window.confirm("Delete license?")){ setSoftware(ss=>ss.filter(s=>s.id!==id)); setSelected(null); }};

  const saveMap = () => {
    const d = devices.find(d=>d.assetTag===mapForm.assetTag);
    const entry = { ...mapForm, id:Date.now(), deviceName:d?.deviceName||"", assignedUser:d?.assignedUser||"" };
    setSwMap(m=>[...m,entry]);
    setMapModal(null);
  };

  const selectedInstalls = selected ? swMap.filter(m=>m.licenseId===selected.licenseId) : [];
  const avail = selected ? (Number(selected.totalSeats)||0) - (Number(selected.usedSeats)||0) : 0;

  return (
    <div>
      <div style={{ display:"flex", gap:10, marginBottom:18, flexWrap:"wrap", alignItems:"center" }}>
        <SearchBar value={search} onChange={setSearch} placeholder="🔍  Search software, vendor, license ID…" />
        <FilterSelect value={fCat} onChange={setFCat} opts={SW_CATEGORIES} placeholder="All Categories" />
        <FilterSelect value={fStat} onChange={setFStat} opts={SW_STATUS} placeholder="All Statuses" />
        <span style={{ fontSize:12, color:"#64748b" }}>{filtered.length} / {software.length}</span>
        <div style={{ marginLeft:"auto", display:"flex", gap:8 }}>
          <button onClick={()=>{setMapForm({assetTag:"",softwareName:"",licenseId:"",version:"",installDate:"",lastUpdated:"",installType:"Managed (Intune)",approved:"Yes",notes:""});setMapModal(true)}}
            style={{ padding:"9px 16px", borderRadius:8, background:"#5b4a8a", color:"#fff", border:"none", fontWeight:700, fontSize:13, cursor:"pointer" }}>🔗 Map Install</button>
          <button onClick={()=>{setForm({...EMPTY_SW});setModal("edit")}}
            style={{ padding:"9px 16px", borderRadius:8, background:"#5b4a8a", color:"#fff", border:"none", fontWeight:700, fontSize:13, cursor:"pointer" }}>+ Add License</button>
        </div>
      </div>

      <div style={{ background:"#fff", borderRadius:12, overflow:"hidden", boxShadow:"0 1px 4px #0001",
        marginRight:selected?460:0, transition:"margin .2s" }}>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <TableHeader cols={["License ID","Software","Vendor","Category","Seats Used","Seats Left","Expiry","Status","Cost/yr",""]} color="#5b4a8a" />
            <tbody>
              {filtered.length===0 && <EmptyRow cols={10} />}
              {filtered.map((s,i) => {
                const ls = licenseStatus(s.expiryDate, s.status);
                const sel = selected?.id===s.id;
                const left = (Number(s.totalSeats)||0)-(Number(s.usedSeats)||0);
                return (
                  <tr key={s.id} onClick={()=>setSelected(sel?null:s)}
                    style={{ background:sel?"#f5f3ff":i%2===0?"#fff":"#f8fafc", cursor:"pointer",
                      borderLeft:`3px solid ${sel?"#7c3aed":"transparent"}` }}>
                    <td style={tdS}><code style={{ fontSize:11,background:"#f1f5f9",padding:"2px 6px",borderRadius:4 }}>{s.licenseId}</code></td>
                    <td style={tdS}><span style={{ fontWeight:600 }}>📦 {s.softwareName}</span></td>
                    <td style={tdS}><span style={{ fontSize:12 }}>{s.vendor}</span></td>
                    <td style={tdS}><Pill label={s.category} color="#8b5cf6" bg="#f5f3ff" /></td>
                    <td style={tdS}>{s.usedSeats} / {s.totalSeats}</td>
                    <td style={tdS}><Pill label={`${left} left`} color={left<=0?"#ef4444":left<=3?"#f59e0b":"#22c55e"} bg={left<=0?"#fef2f2":left<=3?"#fffbeb":"#f0fdf4"} /></td>
                    <td style={tdS}>{s.expiryDate||<span style={{color:"#cbd5e1"}}>—</span>}</td>
                    <td style={tdS}>{ls?<Pill {...ls}/>:<Pill label={s.status} color={SW_STATUS_COLOR[s.status]||"#64748b"} bg={(SW_STATUS_COLOR[s.status]||"#64748b")+"22"} />}</td>
                    <td style={tdS}>{s.annualCost?`$${Number(s.annualCost).toLocaleString()}`:""}</td>
                    <td style={tdS}>
                      <div style={{ display:"flex", gap:5 }}>
                        <button onClick={e=>{e.stopPropagation();openEdit(s)}} style={btnS}>✏️</button>
                        <button onClick={e=>{e.stopPropagation();del(s.id)}} style={{...btnS,borderColor:"#fee2e2",background:"#fff5f5",color:"#ef4444"}}>🗑</button>
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
        <DetailPanel
          title={selected.softwareName} icon="📦" subtitle={selected.licenseId}
          onClose={()=>setSelected(null)} onEdit={()=>openEdit(selected)}
          tags={[
            { label:selected.category, color:"#8b5cf6", bg:"#f5f3ff" },
            licenseStatus(selected.expiryDate, selected.status) || { label:selected.status, color:SW_STATUS_COLOR[selected.status]||"#64748b", bg:(SW_STATUS_COLOR[selected.status]||"#64748b")+"22" },
            { label:`${avail} seats left`, color:avail<=0?"#ef4444":avail<=3?"#f59e0b":"#22c55e", bg:avail<=0?"#fef2f2":avail<=3?"#fffbeb":"#f0fdf4" },
          ].filter(Boolean)}
          sections={[
            { heading:"📋 License Details", rows:[
              {label:"Vendor",          value:selected.vendor},
              {label:"Version",         value:selected.version},
              {label:"License Type",    value:selected.licenseType},
              {label:"License Key / ID",value:selected.licenseKey},
              {label:"Total Seats",     value:String(selected.totalSeats)},
              {label:"Used Seats",      value:String(selected.usedSeats)},
              {label:"Available Seats", value:String(avail)},
            ]},
            { heading:"💰 Financial", rows:[
              {label:"Purchase Date",   value:selected.purchaseDate},
              {label:"Expiry / Renewal",value:selected.expiryDate},
              {label:"Annual Cost",     value:selected.annualCost?`$${Number(selected.annualCost).toLocaleString()}`:null},
              {label:"Cost per Seat",   value:selected.costPerSeat?`$${selected.costPerSeat}`:null},
              {label:"Auto-Renew",      value:selected.autoRenew},
              {label:"Contract / PO",  value:selected.contractPO},
            ]},
            { heading:"📞 Vendor Support", rows:[
              {label:"Support Email",   value:selected.supportEmail},
              {label:"Support Phone",   value:selected.supportPhone},
            ]},
            { heading:"🖥 Installed On", rows:
              selectedInstalls.length>0
                ? selectedInstalls.map(m=>({label:m.assetTag, value:`${m.deviceName} — ${m.assignedUser||"Unassigned"} (v${m.version})`}))
                : [{label:"No installs", value:"No installs mapped yet"}]
            },
            { heading:"📝 Notes", rows:[{label:"Notes", value:selected.notes}] },
          ]}
        />
      )}

      {modal==="edit" && (
        <Modal title={form.id?"✏️ Edit License":"➕ Add License"} onClose={()=>setModal(null)} onSave={save}>
          <FormGrid>
            <Field label="License ID"     value={form.licenseId}    onChange={v=>set("licenseId",v)} />
            <Field label="Software Name"  value={form.softwareName} onChange={v=>set("softwareName",v)} />
            <Field label="Vendor"         value={form.vendor}       onChange={v=>set("vendor",v)} />
            <Field label="Category"       value={form.category}     onChange={v=>set("category",v)} opts={SW_CATEGORIES} />
            <Field label="Version"        value={form.version}      onChange={v=>set("version",v)} />
            <Field label="License Type"   value={form.licenseType}  onChange={v=>set("licenseType",v)} opts={LICENSE_TYPES} />
            <Field label="Total Seats"    value={form.totalSeats}   onChange={v=>set("totalSeats",v)} type="number" />
            <Field label="Used Seats"     value={form.usedSeats}    onChange={v=>set("usedSeats",v)} type="number" />
            <Field label="Purchase Date"  value={form.purchaseDate} onChange={v=>set("purchaseDate",v)} type="date" />
            <Field label="Expiry Date"    value={form.expiryDate}   onChange={v=>set("expiryDate",v)} type="date" />
            <Field label="Annual Cost ($)"value={form.annualCost}   onChange={v=>set("annualCost",v)} type="number" />
            <Field label="Cost/Seat ($)"  value={form.costPerSeat}  onChange={v=>set("costPerSeat",v)} type="number" />
            <Field label="Support Email"  value={form.supportEmail} onChange={v=>set("supportEmail",v)} />
            <Field label="Support Phone"  value={form.supportPhone} onChange={v=>set("supportPhone",v)} />
            <Field label="Contract / PO"  value={form.contractPO}   onChange={v=>set("contractPO",v)} />
            <Field label="Auto-Renew"     value={form.autoRenew}    onChange={v=>set("autoRenew",v)} opts={["Yes","No"]} />
            <Field label="Status"         value={form.status}       onChange={v=>set("status",v)} opts={SW_STATUS} />
          </FormGrid>
          <div style={{ marginTop:14 }}>
            <Field label="License Key / ID" value={form.licenseKey} onChange={v=>set("licenseKey",v)} wide />
            <div style={{ marginTop:10 }}>
              <Field label="Notes" value={form.notes} onChange={v=>set("notes",v)} wide />
            </div>
          </div>
        </Modal>
      )}

      {mapModal && (
        <Modal title="🔗 Map Software to Device" onClose={()=>setMapModal(null)} onSave={saveMap}>
          <FormGrid>
            {[
              ["Asset Tag (Device)", "assetTag"], ["Software Name", "softwareName"],
              ["License ID", "licenseId"], ["Version Installed", "version"],
            ].map(([label, key]) => (
              <Field key={key} label={label} value={mapForm[key]} onChange={v=>setMapForm(f=>({...f,[key]:v}))} />
            ))}
            <Field label="Install Date"   value={mapForm.installDate}  onChange={v=>setMapForm(f=>({...f,installDate:v}))} type="date" />
            <Field label="Last Updated"   value={mapForm.lastUpdated}  onChange={v=>setMapForm(f=>({...f,lastUpdated:v}))} type="date" />
            <Field label="Install Type"   value={mapForm.installType}  onChange={v=>setMapForm(f=>({...f,installType:v}))} opts={INSTALL_TYPES} />
            <Field label="Approved"       value={mapForm.approved}     onChange={v=>setMapForm(f=>({...f,approved:v}))} opts={["Yes","No","Pending Approval"]} />
          </FormGrid>
          <div style={{ marginTop:14 }}>
            <Field label="Notes" value={mapForm.notes} onChange={v=>setMapForm(f=>({...f,notes:v}))} wide />
          </div>
        </Modal>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════════════════════
function StatCard({ icon, label, value, accent, sub }) {
  return (
    <div style={{ background:"#fff", borderRadius:12, padding:"16px 20px",
      boxShadow:"0 1px 4px #0001", borderLeft:`4px solid ${accent}`,
      display:"flex", alignItems:"center", gap:14, flex:"1 1 160px" }}>
      <div style={{ fontSize:26 }}>{icon}</div>
      <div>
        <div style={{ fontSize:24, fontWeight:800, color:"#1e293b", lineHeight:1 }}>{value}</div>
        <div style={{ fontSize:12, color:"#64748b", marginTop:2 }}>{label}</div>
        {sub && <div style={{ fontSize:11, color:accent, marginTop:2, fontWeight:600 }}>{sub}</div>}
      </div>
    </div>
  );
}
function BarChart({ title, data, max, color, accent }) {
  return (
    <div style={{ background:"#fff", borderRadius:12, padding:"18px 22px", boxShadow:"0 1px 4px #0001" }}>
      <div style={{ fontWeight:700, fontSize:14, color:"#1e293b", marginBottom:14,
        borderBottom:`2px solid ${color}33`, paddingBottom:8 }}>{title}</div>
      {data.filter(d=>d.count>0).map(({ label, count }) => (
        <div key={label} style={{ marginBottom:9 }}>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#64748b", marginBottom:3 }}>
            <span>{label}</span><span style={{ fontWeight:700, color:"#1e293b" }}>{count}</span>
          </div>
          <div style={{ background:"#f1f5f9", borderRadius:99, height:7 }}>
            <div style={{ width:`${(count/max)*100}%`, background:color, height:"100%", borderRadius:99, transition:"width .4s" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Dashboard({ devices, users, software, swMap }) {
  const totalCost = software.reduce((a,s) => a + (Number(s.annualCost)||0), 0);
  const expiredLic = software.filter(s => { const ls=licenseStatus(s.expiryDate,s.status); return ls?.label==="Expired"; }).length;
  const noMfa = users.filter(u => u.accountStatus==="Active" && u.mfaEnabled!=="Yes" && u.mfaEnabled!=="Enforced").length;
  const byType = DEVICE_TYPES.map(t=>({ label:t, count:devices.filter(d=>d.deviceType===t).length }));
  const byDept = DEPARTMENTS.map(t=>({ label:t, count:devices.filter(d=>d.department===t).length }));
  const byUserDept = DEPARTMENTS.map(t=>({ label:t, count:users.filter(u=>u.department===t).length }));
  const byCat = SW_CATEGORIES.map(t=>({ label:t, count:software.filter(s=>s.category===t).length }));
  const maxType = Math.max(...byType.map(x=>x.count),1);
  const maxDept = Math.max(...byDept.map(x=>x.count),1);
  const maxUD = Math.max(...byUserDept.map(x=>x.count),1);
  const maxCat = Math.max(...byCat.map(x=>x.count),1);

  return (
    <div>
      <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:24 }}>
        <StatCard icon="🖥" label="Total Devices" value={devices.length} accent="#3b82f6" sub={`${devices.filter(d=>d.status==="Active").length} active`} />
        <StatCard icon="👤" label="Active Users" value={users.filter(u=>u.accountStatus==="Active").length} accent="#1a7a6e" sub={`${users.filter(u=>u.accountStatus==="Disabled").length} disabled`} />
        <StatCard icon="📦" label="Software Titles" value={software.length} accent="#7c3aed" sub={`$${totalCost.toLocaleString()} / yr`} />
        <StatCard icon="✅" label="Compliant Devices" value={devices.filter(d=>d.compliance==="Compliant").length} accent="#22c55e" />
        <StatCard icon="⚠️" label="Warranty Expiring" value={devices.filter(d=>{const w=warrantyStatus(d.warrantyExpiry);return w&&w.label.includes("d left");}).length} accent="#f59e0b" sub="within 90 days" />
        <StatCard icon="🔴" label="Expired Warranties" value={devices.filter(d=>{const w=warrantyStatus(d.warrantyExpiry);return w?.label==="Expired";}).length} accent="#ef4444" />
        <StatCard icon="📋" label="Expired Licenses" value={expiredLic} accent="#ef4444" />
        <StatCard icon="🔐" label="No MFA (Active)" value={noMfa} accent={noMfa>0?"#ef4444":"#22c55e"} />
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <BarChart title="Devices by Type"       data={byType}    max={maxType} color="#3b82f6" />
        <BarChart title="Devices by Department" data={byDept}    max={maxDept} color="#0891b2" />
        <BarChart title="Users by Department"   data={byUserDept} max={maxUD}  color="#1a7a6e" />
        <BarChart title="Software by Category"  data={byCat}     max={maxCat}  color="#7c3aed" />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// ROOT APP
// ══════════════════════════════════════════════════════════════════════
const btnS = { padding:"4px 10px", borderRadius:6, border:"1px solid #e2e8f0",
  background:"#f8fafc", cursor:"pointer", fontSize:12 };

export default function App() {
  const [tab, setTab]         = useState("dashboard");
  const [devices, setDevices] = useState(INIT_DEVICES);
  const [users, setUsers]     = useState(INIT_USERS);
  const [software, setSoftware] = useState(INIT_SOFTWARE);
  const [swMap, setSwMap]     = useState(INIT_SW_MAP);

  const tabs = [
    { id:"dashboard", label:"📊 Dashboard" },
    { id:"devices",   label:"🖥 Devices",  badge: devices.length },
    { id:"users",     label:"👤 Users",    badge: users.length },
    { id:"software",  label:"📦 Software", badge: software.length },
    { id:"swmap",     label:"🔗 Install Map", badge: swMap.length },
  ];

  const tBtn = (t) => ({
    padding:"10px 18px", borderRadius:7, border:"none", cursor:"pointer",
    fontWeight:600, fontSize:13, fontFamily:"inherit", transition:"all .15s",
    background: tab===t.id ? "#fff" : "transparent",
    color: tab===t.id ? "#1e3a5f" : "#93c5fd",
    boxShadow: tab===t.id ? "0 1px 4px #0002" : "none",
  });

  return (
    <div style={{ fontFamily:"'Segoe UI',system-ui,sans-serif", background:"#f0f4f8", minHeight:"100vh" }}>
      {/* Header */}
      <div style={{ background:"#1e3a5f", padding:"0 24px", display:"flex",
        alignItems:"center", gap:16, height:58, flexWrap:"wrap" }}>
        <div>
          <div style={{ color:"#fff", fontWeight:800, fontSize:16 }}>🖥 IT Asset & User Inventory</div>
          <div style={{ color:"#93c5fd", fontSize:10 }}>Microsoft Entra ID (Azure AD)</div>
        </div>
        <div style={{ display:"flex", gap:4, marginLeft:8, background:"#ffffff18",
          borderRadius:9, padding:4 }}>
          {tabs.map(t => (
            <button key={t.id} style={tBtn(t)} onClick={() => setTab(t.id)}>
              {t.label}
              {t.badge !== undefined && (
                <span style={{ marginLeft:6, background: tab===t.id?"#1e3a5f":"#ffffff33",
                  color: tab===t.id?"#fff":"#fff", borderRadius:99, padding:"1px 7px",
                  fontSize:11, fontWeight:700 }}>{t.badge}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding:"22px 24px", maxWidth:1600, margin:"0 auto" }}>
        {tab==="dashboard" && <Dashboard devices={devices} users={users} software={software} swMap={swMap} />}
        {tab==="devices"   && <DeviceSection devices={devices} setDevices={setDevices} swMap={swMap} />}
        {tab==="users"     && <UserSection users={users} setUsers={setUsers} devices={devices} />}
        {tab==="software"  && <SoftwareSection software={software} setSoftware={setSoftware} swMap={swMap} setSwMap={setSwMap} devices={devices} />}
        {tab==="swmap"     && (
          <div style={{ background:"#fff", borderRadius:12, overflow:"hidden", boxShadow:"0 1px 4px #0001" }}>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                <TableHeader cols={["Asset Tag","Device","User","Software","License ID","Version","Install Date","Install Type","Approved",""]} color="#375623" />
                <tbody>
                  {swMap.length===0 && <EmptyRow cols={10} />}
                  {swMap.map((m,i) => (
                    <tr key={m.id} style={{ background:i%2===0?"#fff":"#f8fafc" }}>
                      <td style={tdS}><code style={{ fontSize:11,background:"#f1f5f9",padding:"2px 6px",borderRadius:4 }}>{m.assetTag}</code></td>
                      <td style={tdS}>{m.deviceName}</td>
                      <td style={tdS}><span style={{ fontSize:12,color:"#3b82f6" }}>{m.assignedUser}</span></td>
                      <td style={tdS}><span style={{ fontWeight:600 }}>📦 {m.softwareName}</span></td>
                      <td style={tdS}><code style={{ fontSize:11,background:"#f1f5f9",padding:"2px 6px",borderRadius:4 }}>{m.licenseId}</code></td>
                      <td style={tdS}>{m.version}</td>
                      <td style={tdS}>{m.installDate}</td>
                      <td style={tdS}><Pill label={m.installType} color="#64748b" bg="#f1f5f9" /></td>
                      <td style={tdS}><Pill label={m.approved} color={m.approved==="Yes"?"#22c55e":m.approved==="No"?"#ef4444":"#f59e0b"} bg={m.approved==="Yes"?"#f0fdf4":m.approved==="No"?"#fef2f2":"#fffbeb"} /></td>
                      <td style={tdS}><button onClick={()=>{ if(window.confirm("Remove this mapping?")) setSwMap(mm=>mm.filter(x=>x.id!==m.id)); }} style={{...btnS,borderColor:"#fee2e2",background:"#fff5f5",color:"#ef4444"}}>🗑</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
