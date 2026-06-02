import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

// Setup axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.detail || error.message || 'An error occurred';
    console.error('API Error:', message);
    return Promise.reject(error);
  }
);

// ==================== STANDALONE MOCK API SYSTEM ====================
// This allows the app to run seamlessly on Netlify without any backend, Ollama, or Qdrant server!
// It uses browser localStorage to persist states.

const isNetlify = window.location.hostname.includes('netlify') || 
                  window.location.hostname.includes('github') || 
                  window.location.hostname.includes('vercel');

// Initialize Mock Active state (default to true on Netlify/static hosting, false on localhost unless forced)
if (localStorage.getItem('use_mock_api') === null) {
  localStorage.setItem('use_mock_api', isNetlify ? 'true' : 'false');
}

export const isMockActive = () => {
  return localStorage.getItem('use_mock_api') === 'true';
};

export const setMockActive = (active) => {
  localStorage.setItem('use_mock_api', active ? 'true' : 'false');
  window.dispatchEvent(new Event('mock_api_state_changed'));
};

// --- MOCK DATABASE PRE-POPULATION ---
const INITIAL_PROJECTS = [
  {
    id: 'proj-1',
    name: 'Global Operations & Compliance Compliance',
    company_name: 'Acme Logistics Global',
    description: 'Core operational compliance handbook covering safety standards, logistics protocols, and security.',
    documents_count: 3,
    datasources_count: 1,
    policies_count: 1,
    created_at: '2026-05-15T09:30:00Z',
    updated_at: '2026-05-15T10:30:00Z'
  },
  {
    id: 'proj-2',
    name: 'Remote Workplace Ethics & Safety',
    company_name: 'Nexus Technology Solutions',
    description: 'Code of conduct, remote workplace policies, data protection guidelines, and team communication regulations.',
    documents_count: 2,
    datasources_count: 0,
    policies_count: 0,
    created_at: '2026-05-28T14:15:00Z',
    updated_at: '2026-05-28T14:15:00Z'
  }
];

const INITIAL_DOCUMENTS = [
  { id: 'doc-1', project_id: 'proj-1', name: 'logistics_safety_standards_2025.pdf', file_type: 'pdf', size: 2450000, created_at: '2026-05-15T09:35:00Z' },
  { id: 'doc-2', project_id: 'proj-1', name: 'vendor_audit_checklist_v2.docx', file_type: 'docx', size: 1240000, created_at: '2026-05-15T09:38:00Z' },
  { id: 'doc-3', project_id: 'proj-1', name: 'compliance_iso_mapping.json', file_type: 'json', size: 15400, created_at: '2026-05-15T09:42:00Z' },
  { id: 'doc-4', project_id: 'proj-2', name: 'employee_handbook_draft.docx', file_type: 'docx', size: 980000, created_at: '2026-05-28T14:20:00Z' },
  { id: 'doc-5', project_id: 'proj-2', name: 'remote_security_checklist.pdf', file_type: 'pdf', size: 1450000, created_at: '2026-05-28T14:22:00Z' }
];

const INITIAL_DATASOURCES = [
  {
    id: 'source-1',
    project_id: 'proj-1',
    type: 'url',
    name: 'National Logistics Rules',
    url: 'https://compliance.acme-logistics.com/rules',
    status: 'synced',
    last_synced: '2026-05-15T10:00:00Z',
    created_at: '2026-05-15T09:45:00Z'
  }
];

const INITIAL_POLICIES = [
  {
    id: 'pol-1',
    project_id: 'proj-1',
    title: 'Acme Logistics - Global Operations & Compliance Handbook',
    query: 'Generate a comprehensive organizational policy document for Acme Logistics Global covering safety protocols, logistics audits, and data protection.',
    status: 'completed',
    progress: 100,
    pdf_available: true,
    page_count: 28,
    error_message: null,
    generation_metadata: {
      sections_generated: 10,
      elapsed_time_sec: 42
    },
    created_at: '2026-05-15T10:30:00Z'
  }
];

const getLocalDb = (key, initial) => {
  const data = localStorage.getItem(`policy_ai_${key}`);
  if (!data) {
    localStorage.setItem(`policy_ai_${key}`, JSON.stringify(initial));
    return initial;
  }
  return JSON.parse(data);
};

const setLocalDb = (key, data) => {
  localStorage.setItem(`policy_ai_${key}`, JSON.stringify(data));
};

// Mock operations helper
const mockDb = {
  getProjects: () => getLocalDb('projects', INITIAL_PROJECTS),
  saveProjects: (data) => setLocalDb('projects', data),
  getDocuments: () => getLocalDb('documents', INITIAL_DOCUMENTS),
  saveDocuments: (data) => setLocalDb('documents', data),
  getDatasources: () => getLocalDb('datasources', INITIAL_DATASOURCES),
  saveDatasources: (data) => setLocalDb('datasources', data),
  getPolicies: () => getLocalDb('policies', INITIAL_POLICIES),
  savePolicies: (data) => setLocalDb('policies', data),

  updateProjectCounts: (projectId) => {
    const projects = mockDb.getProjects();
    const docs = mockDb.getDocuments().filter(d => d.project_id === projectId);
    const sources = mockDb.getDatasources().filter(s => s.project_id === projectId);
    const policies = mockDb.getPolicies().filter(p => p.project_id === projectId);

    const updated = projects.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          documents_count: docs.length,
          datasources_count: sources.length,
          policies_count: policies.length
        };
      }
      return p;
    });
    mockDb.saveProjects(updated);
  }
};

// Generates high-quality mock policy content
const generateMockPolicyDocumentText = (title, companyName) => {
  return `========================================================================
${title.toUpperCase()}
Document Code: POL-COMP-${Math.floor(1000 + Math.random() * 9000)}
Company: ${companyName}
Effective Date: June 1, 2026
Version: 1.0.0 (AI Generated Compliance Template)
========================================================================

SECTION 1: EXECUTIVE SUMMARY
This policy document establishes the core operational, safety, and ethics standards for ${companyName}.
It outlines employee code of conduct, digital security boundaries, financial integrity directives, and 
legal liability frameworks. Compliance is mandatory for all active employees, contractors, and affiliates.

SECTION 2: EMPLOYEE CODE OF CONDUCT & ETHICAL STANDARDS
All employees are expected to maintain the highest levels of professional integrity. 
nexus guidelines include:
1. Universal Mutual Respect: Zero tolerance for harassment, discrimination, or abusive conduct.
2. Conflict of Interest Disclosure: Mandatory reporting of external investments, secondary employment,
   or vendor agreements that overlap with operations.
3. Substance Abuse Safeguard: Prohibition of drug or alcohol consumption during operational duties.

SECTION 3: INFORMATION SECURITY & DATA PROTECTION (GDPR & CCPA COMPLIANCE)
Information assets must be safeguarded with robust technological and behavioral controls:
1. Strict Identity Access: Two-Factor Authentication (2FA) is mandatory on all organizational portals.
2. Data Privacy Isolation: Customer Identifiable Information (PII) must be encrypted both at-rest 
   and in-transit. Access is restricted on a strict Need-to-Know basis.
3. Phishing and Security Literacy: Mandatory quarterly training for security hygiene.

SECTION 4: REMOTE WORK & TELECOMMUTING SAFEGUARDS
Guidelines for remote personnel to uphold security and productivity standards:
1. Secure Home Terminals: Company hardware must only operate over secure, encrypted VPN channels.
2. Device Separation: Personal and family members are strictly forbidden from operating company devices.
3. Core Availability Standards: Remote employees must remain reachable during standard core working hours.

SECTION 5: WORKPLACE SAFETY & OCCUPATIONAL HEALTH
Providing a safe, danger-free operational environment:
1. Hazard Elimination: Immediate notification required for building hazards or safety malfunctions.
2. Disaster Readiness: Annual drills and local evacuation route maps must remain visible in all sectors.
3. Incident Documentation: Any on-site injury must be logged within 24 hours of occurrence.

SECTION 6: FINANCIAL INTEGRITY, AUDITING, & EXPENSE MANAGEMENT
Protecting institutional assets from waste, abuse, or unauthorized exploitation:
1. Expense Disbursement Thresholds: Managerial sign-off is mandatory for any expenditure over $500.
2. Vendor Competitive Bidding: Projects exceeding $10,000 must solicit a minimum of three independent bids.
3. Integrity Auditing: Semi-annual compliance checks conducted by certified independent external auditors.

SECTION 7: ENVIRONMENTAL SUSTAINABILITY STANDARDS
Commitment to reducing ecological footprint through clean operations:
1. Resource Waste Abatement: Strict paperless mandate for internal inter-departmental communications.
2. Recyclable Protocols: Hardware and server units must be decommissioned only through certified e-waste recyclers.
3. Power Allocation Audit: Smart LED and sensor configurations enforced to cut idle electricity use.

SECTION 8: INTELLECTUAL PROPERTY & BRAND PRESERVATION
Defining ownership of operational output and protecting brand integrity:
1. Inventions and Patent Assignment: All concepts, codebases, and methodologies generated during employment 
   remain the sole intellectual property of ${companyName}.
2. Brand Uniformity: Any public release of logo, styling, or documentation must follow brand standards.
3. Public Representative Guard: Individual employees are unauthorized to make media statements on behalf of the company.

SECTION 9: NON-DISCLOSURE & CONFIDENTIALITY AGREEMENT
Protecting trade secrets, roadmaps, and non-public data structures:
1. Absolute Confidentiality: Strict non-disclosure of internal schematics, vendor records, or pipeline timelines.
2. Separation Off-boarding Protocol: Revocation of all physical, network, and systemic credentials immediately upon departure.
3. Continuing Non-Disclosure: Confidentiality requirements persist for a period of 5 years post-employment termination.

SECTION 10: POLICY COMPLIANCE & VIOLATION PENALTY DIRECTIVES
Defining enforcement mechanisms and steps for systemic audits:
1. Internal Reporting Channels: Whistleblower lines guarantee anonymity and protection from retaliation.
2. Escalating Disciplinary Action: Violations trigger progressive responses: verbal warning -> written reprimand -> suspension -> termination.
3. Annual Review Board: Annual revision of policies to adapt to evolving compliance landscapes.

========================================================================
END OF POLICY DOCUMENT - GENERATED SUCCESSFULLY BY POLICY AI
========================================================================
`;
};

// Generates a valid, minimal single-page binary PDF document on the fly in the browser!
const generateMockPDFBlob = (title, companyName) => {
  const cleanTitle = title.replace(/[()]/g, '');
  const cleanCompany = companyName.replace(/[()]/g, '');
  const docCode = `POL-COMP-${Math.floor(1000 + Math.random() * 9000)}`;
  
  const streamContent = `BT
/F1 18 Tf
50 780 Td
(${cleanTitle.toUpperCase()}) Tj
/F1 11 Tf
0 -30 Td
(Company Name: ${cleanCompany}) Tj
0 -20 Td
(Document Code: ${docCode}  |  Version: 1.0.0  |  Status: ACTIVE) Tj
0 -20 Td
(Classification: Internal Enterprise Compliance) Tj
0 -20 Td
(Effective Date: June 1, 2026) Tj
/F1 9 Tf
0 -30 Td
(Notice: This PDF was generated dynamically in Standalone Demo Mode. To run the full) Tj
0 -13 Td
(Retrieval-Augmented Generation (RAG) compiler, run the FastAPI backend locally.) Tj
/F1 11 Tf
0 -30 Td
(SECTION 1: EXECUTIVE SUMMARY) Tj
/F1 9 Tf
0 -15 Td
(This policy outlines operational directives, data protection protocols, and conduct standards.) Tj
0 -13 Td
(All personnel, contractors, and corporate affiliates must read and maintain compliance.) Tj
/F1 11 Tf
0 -25 Td
(SECTION 2: INFORMATION SECURITY & PRIVACY (GDPR & CCPA COMPLIANCE)) Tj
/F1 9 Tf
0 -15 Td
(1. Strict Identity Access: Multifactor Authentication (MFA) is mandatory on all organizational nodes.) Tj
0 -13 Td
(2. Customer PII Encryption: Data assets must remain encrypted both in-transit and at-rest.) Tj
0 -13 Td
(3. Operational Auditability: All network configurations are cataloged for security integrity reviews.) Tj
/F1 11 Tf
0 -25 Td
(SECTION 3: WORKPLACE ETHICS & REMOTE EMPLOYMENT CODES) Tj
/F1 9 Tf
0 -15 Td
(1. Mutual Integrity: Zero tolerance for harassment, discrimination, or conflict-of-interest abuses.) Tj
0 -13 Td
(2. Dedicated Hardware Channels: Company tasks must only proceed on secure, encrypted virtual lines.) Tj
0 -13 Td
(3. Professional Conduct Boundaries: Virtual collaboration workspaces follow standard code guidelines.) Tj
/F1 11 Tf
0 -25 Td
(SECTION 4: REGULATORY GOVERNANCE & DISCIPLINARY DIRECTIVES) Tj
/F1 9 Tf
0 -15 Td
(Violations will result in standard internal remediation protocols, including warnings, suspension,) Tj
0 -13 Td
(or immediate termination of engagement based on escalation severity. Board review is annual.) Tj
/F1 9 Tf
0 -40 Td
(Generated by Policy AI - Professional automated policy system) Tj
ET`;

  const streamLength = streamContent.length;
  
  const pdfBody = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources 4 0 R /MediaBox [0 0 595.275 841.89] /Contents 5 0 R >>
endobj
4 0 obj
<< /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >>
endobj
5 0 obj
<< /Length ${streamLength} >>
stream
${streamContent}
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000056 00000 n 
0000000118 00000 n 
0000000222 00000 n 
0000000305 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
${305 + streamLength + 20}
%%EOF`;

  return new Blob([pdfBody], { type: 'application/pdf' });
};

// ==================== PROJECT APIs ====================
export const projectAPI = {
  getAll: () => {
    if (isMockActive()) {
      return Promise.resolve({ data: mockDb.getProjects() });
    }
    return api.get('/admin/projects');
  },
  getById: (id) => {
    if (isMockActive()) {
      const proj = mockDb.getProjects().find(p => p.id === id);
      if (!proj) return Promise.reject({ response: { data: { detail: 'Project not found' } } });
      return Promise.resolve({ data: proj });
    }
    return api.get(`/admin/projects/${id}`);
  },
  create: (data) => {
    if (isMockActive()) {
      const projects = mockDb.getProjects();
      const newProj = {
        id: `proj-${Math.floor(100 + Math.random() * 900)}`,
        name: data.name,
        company_name: data.company_name,
        description: data.description || '',
        documents_count: 0,
        datasources_count: 0,
        policies_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      projects.push(newProj);
      mockDb.saveProjects(projects);
      return Promise.resolve({ data: newProj });
    }
    return api.post('/admin/projects', data);
  },
  update: (id, data) => {
    if (isMockActive()) {
      const projects = mockDb.getProjects();
      const idx = projects.findIndex(p => p.id === id);
      if (idx === -1) return Promise.reject({ response: { data: { detail: 'Project not found' } } });
      
      const updated = {
        ...projects[idx],
        ...data,
        updated_at: new Date().toISOString()
      };
      projects[idx] = updated;
      mockDb.saveProjects(projects);
      return Promise.resolve({ data: updated });
    }
    return api.patch(`/admin/projects/${id}`, data);
  },
  delete: (id) => {
    if (isMockActive()) {
      let projects = mockDb.getProjects();
      projects = projects.filter(p => p.id !== id);
      mockDb.saveProjects(projects);

      // Clean up child nodes
      let docs = mockDb.getDocuments().filter(d => d.project_id !== id);
      mockDb.saveDocuments(docs);

      let sources = mockDb.getDatasources().filter(s => s.project_id !== id);
      mockDb.saveDatasources(sources);

      let policies = mockDb.getPolicies().filter(p => p.project_id !== id);
      mockDb.savePolicies(policies);

      return Promise.resolve({ data: { message: 'Project deleted successfully' } });
    }
    return api.delete(`/admin/projects/${id}`);
  },
};

// ==================== DOCUMENT APIs ====================
export const documentAPI = {
  getByProject: (projectId) => {
    if (isMockActive()) {
      const docs = mockDb.getDocuments().filter(d => d.project_id === projectId);
      return Promise.resolve({ data: docs });
    }
    return api.get(`/admin/projects/${projectId}/documents`);
  },
  getById: (id) => {
    if (isMockActive()) {
      const doc = mockDb.getDocuments().find(d => d.id === id);
      if (!doc) return Promise.reject({ response: { data: { detail: 'Document not found' } } });
      return Promise.resolve({ data: doc });
    }
    return api.get(`/admin/documents/${id}`);
  },
  upload: (projectId, file, onUploadProgress) => {
    if (isMockActive()) {
      // Simulate file upload progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += 20;
        if (progress > 100) {
          clearInterval(interval);
        } else if (onUploadProgress) {
          onUploadProgress({ loaded: progress, total: 100 });
        }
      }, 200);

      return new Promise((resolve) => {
        setTimeout(() => {
          clearInterval(interval);
          const docs = mockDb.getDocuments();
          const newDoc = {
            id: `doc-${Math.floor(100 + Math.random() * 900)}`,
            project_id: projectId,
            name: file.name,
            file_type: file.name.split('.').pop() || 'pdf',
            size: file.size || 102400,
            created_at: new Date().toISOString()
          };
          docs.push(newDoc);
          mockDb.saveDocuments(docs);
          mockDb.updateProjectCounts(projectId);

          resolve({
            data: {
              document: newDoc,
              message: 'Document uploaded and analyzed successfully'
            }
          });
        }, 1200); // 1.2s delay for realism
      });
    }
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/admin/projects/${projectId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    });
  },
  delete: (id) => {
    if (isMockActive()) {
      const docs = mockDb.getDocuments();
      const doc = docs.find(d => d.id === id);
      if (!doc) return Promise.reject({ response: { data: { detail: 'Document not found' } } });

      const filtered = docs.filter(d => d.id !== id);
      mockDb.saveDocuments(filtered);
      mockDb.updateProjectCounts(doc.project_id);

      return Promise.resolve({ data: { message: 'Document deleted successfully' } });
    }
    return api.delete(`/admin/documents/${id}`);
  },
};

// ==================== DATA SOURCE APIs ====================
export const datasourceAPI = {
  getByProject: (projectId) => {
    if (isMockActive()) {
      const sources = mockDb.getDatasources().filter(s => s.project_id === projectId);
      return Promise.resolve({ data: sources });
    }
    return api.get(`/admin/projects/${projectId}/datasources`);
  },
  getById: (id) => {
    if (isMockActive()) {
      const source = mockDb.getDatasources().find(s => s.id === id);
      if (!source) return Promise.reject({ response: { data: { detail: 'DataSource not found' } } });
      return Promise.resolve({ data: source });
    }
    return api.get(`/admin/datasources/${id}`);
  },
  
  addDatabase: (projectId, data) => {
    if (isMockActive()) {
      const { project_id, ...payload } = data;
      const sources = mockDb.getDatasources();
      const newSource = {
        id: `source-${Math.floor(100 + Math.random() * 900)}`,
        project_id: projectId,
        type: 'database',
        name: `${payload.db_type.toUpperCase()} DB: ${payload.database}`,
        url: `${payload.host}:${payload.port}/${payload.database}`,
        status: 'synced',
        last_synced: new Date().toISOString(),
        created_at: new Date().toISOString(),
        metadata: payload
      };
      sources.push(newSource);
      mockDb.saveDatasources(sources);
      mockDb.updateProjectCounts(projectId);
      return Promise.resolve({ data: newSource });
    }
    const { project_id, ...payload } = data;
    return api.post(`/admin/projects/${projectId}/datasources/database`, payload);
  },
  
  addURL: (projectId, data) => {
    if (isMockActive()) {
      const { project_id, ...payload } = data;
      const sources = mockDb.getDatasources();
      const newSource = {
        id: `source-${Math.floor(100 + Math.random() * 900)}`,
        project_id: projectId,
        type: 'url',
        name: payload.name || 'External URL Resource',
        url: payload.url,
        status: 'synced',
        last_synced: new Date().toISOString(),
        created_at: new Date().toISOString(),
        metadata: payload
      };
      sources.push(newSource);
      mockDb.saveDatasources(sources);
      mockDb.updateProjectCounts(projectId);
      return Promise.resolve({ data: newSource });
    }
    const { project_id, ...payload } = data;
    return api.post(`/admin/projects/${projectId}/datasources/url`, payload);
  },
  
  update: (id, data) => {
    if (isMockActive()) {
      const sources = mockDb.getDatasources();
      const idx = sources.findIndex(s => s.id === id);
      if (idx === -1) return Promise.reject({ response: { data: { detail: 'DataSource not found' } } });
      
      const updated = {
        ...sources[idx],
        ...data,
        last_synced: new Date().toISOString()
      };
      sources[idx] = updated;
      mockDb.saveDatasources(sources);
      return Promise.resolve({ data: updated });
    }
    return api.patch(`/admin/datasources/${id}`, data);
  },
  
  delete: (id) => {
    if (isMockActive()) {
      const sources = mockDb.getDatasources();
      const src = sources.find(s => s.id === id);
      if (!src) return Promise.reject({ response: { data: { detail: 'DataSource not found' } } });

      const filtered = sources.filter(s => s.id !== id);
      mockDb.saveDatasources(filtered);
      mockDb.updateProjectCounts(src.project_id);

      return Promise.resolve({ data: { message: 'DataSource deleted successfully' } });
    }
    return api.delete(`/admin/datasources/${id}`);
  },
  
  resync: (id) => {
    if (isMockActive()) {
      const sources = mockDb.getDatasources();
      const idx = sources.findIndex(s => s.id === id);
      if (idx === -1) return Promise.reject({ response: { data: { detail: 'DataSource not found' } } });

      // Return syncing state immediately, but update to synced in localStorage
      const updated = {
        ...sources[idx],
        status: 'synced',
        last_synced: new Date().toISOString()
      };
      sources[idx] = updated;
      mockDb.saveDatasources(sources);

      return Promise.resolve({ data: { message: 'Data synchronization completed successfully', datasource: updated } });
    }
    return api.post(`/admin/datasources/${id}/resync`);
  },
};

// ==================== POLICY APIs ====================
export const policyAPI = {
  generate: (data) => {
    if (isMockActive()) {
      const policies = mockDb.getPolicies();
      
      // Get project details to customize title
      const projects = mockDb.getProjects();
      const project = projects.find(p => p.id === data.project_id) || { company_name: 'Acme', name: 'Compliance' };

      const newPolicy = {
        id: `pol-${Math.floor(100 + Math.random() * 900)}`,
        project_id: data.project_id,
        title: data.title || `${project.company_name} - ${project.name} Policy Guide`,
        query: data.query,
        status: 'generating',
        progress: 0,
        pdf_available: false,
        page_count: 0,
        error_message: null,
        generation_metadata: null,
        created_at: new Date().toISOString() // Used to compute elapsed progress deterministically!
      };
      
      policies.push(newPolicy);
      mockDb.savePolicies(policies);
      mockDb.updateProjectCounts(data.project_id);

      return Promise.resolve({ data: newPolicy });
    }
    return api.post('/policies/generate', data);
  },
  
  getById: (id) => {
    if (isMockActive()) {
      const policies = mockDb.getPolicies();
      const policy = policies.find(p => p.id === id);
      if (!policy) return Promise.reject({ response: { data: { detail: 'Policy not found' } } });
      return Promise.resolve({ data: policy });
    }
    return api.get(`/policies/${id}`);
  },
  
  getStatus: (id) => {
    if (isMockActive()) {
      const policies = mockDb.getPolicies();
      const idx = policies.findIndex(p => p.id === id);
      if (idx === -1) return Promise.reject({ response: { data: { detail: 'Policy not found' } } });

      const policy = policies[idx];

      if (policy.status === 'completed' || policy.status === 'failed') {
        return Promise.resolve({ data: policy });
      }

      // Compute incremental progress based on elapsed time (150ms per percent -> 15 seconds to finish)
      const elapsedMs = Date.now() - new Date(policy.created_at).getTime();
      const computedProgress = Math.min(100, Math.floor(elapsedMs / 150));

      let updated = { ...policy };
      if (computedProgress >= 100) {
        updated.status = 'completed';
        updated.progress = 100;
        updated.pdf_available = true;
        updated.page_count = 28;
        updated.generation_metadata = {
          sections_generated: 10,
          elapsed_time_sec: 15
        };
        
        // Save back to db
        policies[idx] = updated;
        mockDb.savePolicies(policies);
      } else {
        updated.progress = computedProgress;
        updated.status = 'generating';
      }

      return Promise.resolve({ data: updated });
    }
    return api.get(`/policies/${id}/status`);
  },
  
  getByProject: (projectId) => {
    if (isMockActive()) {
      const policies = mockDb.getPolicies().filter(p => p.project_id === projectId);
      return Promise.resolve({ data: policies });
    }
    return api.get(`/policies/project/${projectId}/policies`);
  },
  
  download: (id) => {
    if (isMockActive()) {
      const policy = mockDb.getPolicies().find(p => p.id === id);
      const title = policy ? policy.title : 'Compliance Policy Document';
      
      // Find company name
      let companyName = 'Acme Logistics Global';
      if (policy) {
        const proj = mockDb.getProjects().find(p => p.id === policy.project_id);
        if (proj) companyName = proj.company_name;
      }

      const blob = generateMockPDFBlob(title, companyName);
      return Promise.resolve({ data: blob });
    }
    return api.get(`/policies/${id}/download`, { responseType: 'blob' });
  },
  
  delete: (id) => {
    if (isMockActive()) {
      const policies = mockDb.getPolicies();
      const pol = policies.find(p => p.id === id);
      if (!pol) return Promise.reject({ response: { data: { detail: 'Policy not found' } } });

      const filtered = policies.filter(p => p.id !== id);
      mockDb.savePolicies(filtered);
      mockDb.updateProjectCounts(pol.project_id);

      return Promise.resolve({ data: { message: 'Policy deleted successfully' } });
    }
    return api.delete(`/policies/${id}`);
  },
};

// ==================== USER APIs ====================
export const userAPI = {
  getProjects: () => {
    if (isMockActive()) {
      return Promise.resolve({ data: mockDb.getProjects() });
    }
    return api.get('/user/projects');
  },
  getProjectInfo: (projectId) => {
    if (isMockActive()) {
      const projects = mockDb.getProjects();
      const project = projects.find(p => p.id === projectId);
      if (!project) return Promise.reject({ response: { data: { detail: 'Project not found' } } });

      const documents = mockDb.getDocuments().filter(d => d.project_id === projectId);
      const datasources = mockDb.getDatasources().filter(s => s.project_id === projectId);
      const policies = mockDb.getPolicies().filter(p => p.project_id === projectId);

      return Promise.resolve({
        data: {
          project,
          documents,
          datasources,
          policies
        }
      });
    }
    return api.get(`/user/projects/${projectId}/info`);
  },
};

export default api;

