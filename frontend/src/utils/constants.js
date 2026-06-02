export const FILE_TYPES = {
  PDF: { ext: '.pdf', label: 'PDF', icon: '📄' },
  DOCX: { ext: '.docx', label: 'Word Document', icon: '📝' },
  CSV: { ext: '.csv', label: 'CSV', icon: '📊' },
  XLSX: { ext: '.xlsx', label: 'Excel', icon: '📈' },
  XLS: { ext: '.xls', label: 'Excel (Legacy)', icon: '📈' },
  JSON: { ext: '.json', label: 'JSON', icon: '{ }' },
};

export const ALLOWED_FILE_TYPES = Object.values(FILE_TYPES)
  .map(type => type.ext)
  .join(',');

export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  error: 'bg-red-100 text-red-800',
  generating: 'bg-purple-100 text-purple-800',
};

export const ROUTES = {
  HOME: '/',
  ADMIN: '/admin',
  USER: '/user',
};

export const POLICY_SECTIONS = [
  'Executive Summary',
  'Purpose & Scope',
  'Governance & Organizational Roles',
  'Data Protection & Security Policies',
  'Employee Conduct & Compliance',
  'Remote Work & Operational Policies',
  'Vendor & Third-Party Management',
  'Incident Reporting & Response',
  'Audit, Review & Continuous Improvement',
  'Future Outlook & Recommendations',
];
