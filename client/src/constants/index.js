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
  submitted: { label: 'Submitted', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  under_review: { label: 'Under Review', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  assigned: { label: 'Assigned', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  in_progress: { label: 'In Progress', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  resolved: { label: 'Resolved', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  closed: { label: 'Closed', color: 'bg-slate-100 text-slate-700 border-slate-300' },
  rejected: { label: 'Rejected', color: 'bg-rose-100 text-rose-800 border-rose-200' },
  reopened: { label: 'Reopened', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700 border-gray-200' },
};

export const PRIORITY_CONFIG = {
  critical: { label: 'Critical', color: 'bg-rose-500 text-white shadow-rose-200 shadow-sm' },
  high: { label: 'High', color: 'bg-amber-500 text-white shadow-amber-200 shadow-sm' },
  medium: { label: 'Medium', color: 'bg-blue-500 text-white shadow-blue-200 shadow-sm' },
  low: { label: 'Low', color: 'bg-emerald-500 text-white shadow-emerald-200 shadow-sm' },
};

export const SEVERITY_CONFIG = {
  critical: { label: 'Critical Severity', color: 'text-rose-600 bg-rose-50 border-rose-200' },
  high: { label: 'High Severity', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  medium: { label: 'Medium Severity', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  low: { label: 'Low Severity', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
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
