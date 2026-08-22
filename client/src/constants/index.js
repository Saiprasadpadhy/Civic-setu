export const APP_NAME = 'CivicSetu';
export const APP_TAGLINE = 'Evidence-Grounded Civic Grievance Triage & Participatory Budgeting Platform';

export const ROUTES = {
  // Public
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',

  // Citizen
  CITIZEN_DASHBOARD: '/citizen/dashboard',
  CITIZEN_SUBMIT_GRIEVANCE: '/citizen/grievances/new',
  CITIZEN_MY_GRIEVANCES: '/citizen/grievances',
  CITIZEN_GRIEVANCE_DETAIL: '/citizen/grievances/:id',
  CITIZEN_PUBLIC_WORKS: '/citizen/public-works',
  CITIZEN_PROFILE: '/citizen/profile',

  // Officer
  OFFICER_DASHBOARD: '/officer/dashboard',
  OFFICER_GRIEVANCES: '/officer/grievances',
  OFFICER_GRIEVANCE_DETAIL: '/officer/grievances/:id',

  // Admin
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_GRIEVANCES: '/admin/grievances',
  ADMIN_GRIEVANCE_DETAIL: '/admin/grievances/:id',
  ADMIN_ANALYTICS: '/admin/analytics',
  ADMIN_WARD_HEATMAP: '/admin/ward-heatmap',
  ADMIN_SLA_MONITORING: '/admin/sla-monitoring',
  ADMIN_DEPARTMENTS: '/admin/departments',
  ADMIN_PUBLIC_WORKS: '/admin/public-works',
};

export const STATUS_CONFIG = {
  submitted: { label: 'Submitted', color: 'bg-slate-100 text-slate-800 border-slate-300' },
  under_review: { label: 'Under Review', color: 'bg-blue-50 text-blue-900 border-blue-200' },
  assigned: { label: 'Assigned', color: 'bg-amber-50 text-amber-900 border-amber-300' },
  in_progress: { label: 'In Progress', color: 'bg-indigo-50 text-indigo-900 border-indigo-200' },
  resolved: { label: 'Resolved', color: 'bg-emerald-50 text-emerald-900 border-emerald-300' },
  closed: { label: 'Closed', color: 'bg-zinc-100 text-zinc-700 border-zinc-300' },
  rejected: { label: 'Rejected', color: 'bg-red-50 text-red-900 border-red-200' },
  reopened: { label: 'Reopened', color: 'bg-orange-50 text-orange-900 border-orange-200' },
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700 border-gray-200' },
};

export const PRIORITY_CONFIG = {
  critical: { label: 'Critical', color: 'bg-red-600 text-white shadow-red-200 shadow-sm' },
  high: { label: 'High', color: 'bg-amber-600 text-white shadow-amber-200 shadow-sm' },
  medium: { label: 'Medium', color: 'bg-[#173a60] text-white shadow-slate-200 shadow-sm' },
  low: { label: 'Low', color: 'bg-teal-600 text-white shadow-teal-200 shadow-sm' },
};

export const SEVERITY_CONFIG = {
  critical: { label: 'Critical Severity', color: 'text-red-700 bg-red-50 border-red-200' },
  high: { label: 'High Severity', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  medium: { label: 'Medium Severity', color: 'text-slate-800 bg-slate-100 border-slate-300' },
  low: { label: 'Low Severity', color: 'text-teal-700 bg-teal-50 border-teal-200' },
};

export const CATEGORIES = [
  { id: 'pothole', label: 'Pothole & Road Damage', icon: 'Construction' },
  { id: 'streetlight', label: 'Streetlight / Electrical', icon: 'Lightbulb' },
  { id: 'garbage', label: 'Garbage & Solid Waste', icon: 'Trash2' },
  { id: 'water', label: 'Water Pipeline & Supply Leakage', icon: 'Droplets' },
  { id: 'drainage', label: 'Drainage & Sewage Overflow', icon: 'Waves' },
  { id: 'sanitation', label: 'Sanitation & Public Health', icon: 'Sparkles' },
  { id: 'roads', label: 'Footpath & Traffic Signage', icon: 'Milestone' },
];

export const LANGUAGES = [
  { code: 'en', name: 'English', speechCode: 'en-IN', flag: '🇬🇧' },
  { code: 'hi', name: 'हिन्दी (Hindi)', speechCode: 'hi-IN', flag: '🇮🇳' },
  { code: 'or', name: 'ଓଡ଼ିଆ (Odia)', speechCode: 'or-IN', flag: '🇮🇳' },
];
