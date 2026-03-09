// src/constants.js

export const LOCATIONS = {
  BON: 'Bondi',
  NET: 'Network HQ',
  LON: 'London',
  BAR: 'Barcelona',
  WIN: 'Winchester',
};

export const CATEGORIES = {
  DT:  { label: 'Desktop',            deviceType: 'Desktop' },
  LAP: { label: 'Laptop',             deviceType: 'Laptop' },
  MON: { label: 'Monitor',            deviceType: 'Monitor' },
  PRN: { label: 'Printer',            deviceType: 'Printer' },
  CAL: { label: 'Digital Calculator', deviceType: 'Calculator' },
  MOB: { label: 'Mobile Phone',       deviceType: 'Mobile Phone' },
  TAB: { label: 'Tablet',             deviceType: 'Tablet' },
  CAM: { label: 'Webcam',             deviceType: 'Webcam' },
  RTR: { label: 'Router',             deviceType: 'Router' },
  SWT: { label: 'Switch',             deviceType: 'Switch' },
  AP:  { label: 'Access Point',       deviceType: 'Access Point' },
  SRV: { label: 'Server',             deviceType: 'Server' },
  PER: { label: 'Keyboard & Mouse',   deviceType: 'Peripheral' },
  HDS: { label: 'Headset',            deviceType: 'Headset' },
};

export const LOCATION_CODES  = Object.keys(LOCATIONS);
export const CATEGORY_CODES  = Object.keys(CATEGORIES);
export const DEVICE_TYPES    = [...new Set(Object.values(CATEGORIES).map(c => c.deviceType))];

/** Generate next asset tag: MITS-<LOC>-<CAT>-### */
export function generateAssetTag(locationCode, categoryCode, existingDevices) {
  const prefix = `MITS-${locationCode}-${categoryCode}-`;
  const nums = existingDevices
    .map(d => d.assetTag)
    .filter(t => t?.startsWith(prefix))
    .map(t => parseInt(t.replace(prefix, ''), 10))
    .filter(n => !isNaN(n));
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `${prefix}${String(next).padStart(3, '0')}`;
}

export const OS_OPTIONS    = ['Windows 11 Pro','Windows 10 Pro','macOS Sonoma','macOS Ventura','iOS','iPadOS','Android','Chrome OS','Windows Server 2022','Linux','Embedded','N/A'];
export const DEPARTMENTS   = ['IT','Finance','HR','Sales','Marketing','Operations','Engineering','Management','Other'];
export const COMPLIANCE    = ['Compliant','Non-Compliant','Pending','N/A'];
export const DEVICE_STATUS = ['Active','In Storage','Decommissioned','Lost/Stolen','In Repair'];
export const USER_STATUS   = ['Active','Disabled','Locked Out','Guest','Service Account'];
export const M365_LICENSES = ['Microsoft 365 Business Basic','Microsoft 365 Business Standard','Microsoft 365 Business Premium','Microsoft 365 E3','Microsoft 365 E5','Office 365 E1','Office 365 E3','No License'];
export const SW_CATEGORIES = ['Productivity','Security','Design','Development','ERP/CRM','Communication','Backup','OS','Utility','Other'];
export const LICENSE_TYPES = ['Perpetual','Subscription (Annual)','Subscription (Monthly)','Per Device','Per User','Volume','OEM','Freeware','Open Source'];
export const SW_STATUS     = ['Active','Expired','Cancelled','Pending Renewal'];
export const INSTALL_TYPES = ['Managed (Intune)','Manual','Pre-installed','Script/GPO','Other'];
export const MFA_OPTIONS   = ['Yes','No','Enforced'];
export const ACCOUNT_TYPES = ['Member','Guest','Service Account','Shared Mailbox','Resource'];
export const INTUNE_OPTIONS = ['Yes','No','N/A'];
export const APPROVED_OPTIONS = ['Yes','No','Pending Approval'];

export const DEVICE_ICONS = {
  Desktop:'🖥', Laptop:'💻', Tablet:'📱', 'Mobile Phone':'📱',
  Printer:'🖨', Monitor:'🖵', Server:'🗄', Peripheral:'🖱',
  Webcam:'📷', Router:'📡', Switch:'🔀', 'Access Point':'📶',
  Headset:'🎧', Calculator:'🧮', Other:'📦',
};

export const COMP_COLORS = {
  Compliant:      { color:'var(--accent-green)',  bg:'var(--accent-green-bg)' },
  'Non-Compliant':{ color:'var(--accent-red)',    bg:'var(--accent-red-bg)' },
  Pending:        { color:'var(--accent-amber)',  bg:'var(--accent-amber-bg)' },
  'N/A':          { color:'var(--text-muted)',    bg:'var(--bg-surface-3)' },
};
export const STATUS_COLORS = {
  Active:           { color:'var(--accent-green)',  bg:'var(--accent-green-bg)' },
  Disabled:         { color:'var(--text-muted)',    bg:'var(--bg-surface-3)' },
  'Locked Out':     { color:'var(--accent-red)',    bg:'var(--accent-red-bg)' },
  Guest:            { color:'var(--accent-purple)', bg:'var(--accent-purple-bg)' },
  'Service Account':{ color:'var(--accent-blue)',   bg:'var(--accent-blue-bg)' },
};
export const SW_STATUS_COLORS = {
  Active:           { color:'var(--accent-green)',  bg:'var(--accent-green-bg)' },
  Expired:          { color:'var(--accent-red)',    bg:'var(--accent-red-bg)' },
  Cancelled:        { color:'var(--text-muted)',    bg:'var(--bg-surface-3)' },
  'Pending Renewal':{ color:'var(--accent-amber)',  bg:'var(--accent-amber-bg)' },
};

export function warrantyStatus(expiry) {
  if (!expiry || expiry === 'N/A') return null;
  const days = Math.ceil((new Date(expiry) - new Date()) / 86400000);
  if (days < 0)   return { label:'Expired',        color:'var(--accent-red)',   bg:'var(--accent-red-bg)' };
  if (days <= 90) return { label:`${days}d left`,  color:'var(--accent-amber)', bg:'var(--accent-amber-bg)' };
  return               { label:'Active',          color:'var(--accent-green)', bg:'var(--accent-green-bg)' };
}
export function licenseExpiryStatus(expiry, status) {
  if (status === 'Expired') return { label:'Expired', color:'var(--accent-red)', bg:'var(--accent-red-bg)' };
  if (!expiry) return null;
  const days = Math.ceil((new Date(expiry) - new Date()) / 86400000);
  if (days < 0)   return { label:'Expired',        color:'var(--accent-red)',   bg:'var(--accent-red-bg)' };
  if (days <= 90) return { label:`${days}d left`,  color:'var(--accent-amber)', bg:'var(--accent-amber-bg)' };
  return               { label:'Active',          color:'var(--accent-green)', bg:'var(--accent-green-bg)' };
}
