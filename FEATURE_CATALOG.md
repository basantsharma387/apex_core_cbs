# Feature Catalog — Data Networks Enterprise Banking Platform v2.0
> End-to-end banking solution covering both customer-facing and bank-internal operations
> April 2026 | Target markets: Bhutan, India, Sri Lanka, Kenya, Cambodia

---

## DOMAIN MAP

```
CUSTOMER-FACING                    BANK-INTERNAL (STAFF)
────────────────                   ─────────────────────
Customer Portal (future)           Executive Dashboard
Mobile Banking (future)            EWS — Risk Monitoring
Self-service KYC                   AML — Compliance
                                   DMS — Document Management
                                   LOS — Loan Origination
                                   CMS — Collections
                                   IFRS 9 — Provisioning
                                   ALM/FTP — Treasury
                                   Reports — Regulatory
                                   Settings — Administration
```

---

## MODULE 1: EXECUTIVE DASHBOARD (`/dashboard`)

### Purpose
Single-pane-of-glass view for senior management and CTOs across all platform modules.

### Features
| ID | Feature | Priority | Status |
|---|---|---|---|
| DB-001 | Platform KPI metric cards (5-column) | P0 | Not started |
| DB-002 | Loan portfolio trend chart (Recharts, Jan–Aug) | P0 | Not started |
| DB-003 | EWS risk distribution summary (High/Medium/Low counts) | P0 | Not started |
| DB-004 | Module status panel (CBS/LOS/AML/EWS/DMS/CMS/IFRS9/ALM) | P0 | Not started |
| DB-005 | Recent platform alerts feed table | P0 | Not started |
| DB-006 | Greeting with user name + date | P1 | Not started |
| DB-007 | Real-time data refresh (React Query 30s polling) | P1 | Not started |
| DB-008 | Clickable cards navigating to respective modules | P2 | Not started |
| DB-009 | Date range filter for trend charts | P2 | Not started |
| DB-010 | Export dashboard as PDF snapshot | P3 | Not started |

---

## MODULE 2: EARLY WARNING SYSTEM — EWS (`/ews`)

### Purpose
AI-powered risk monitoring. Detects borrowers at risk of default before they miss a payment. Feeds directly into Collection Management.

### Features
| ID | Feature | Priority | Status |
|---|---|---|---|
| EWS-001 | Real-time alert list with PD score coloring | P0 | Not started |
| EWS-002 | Customer risk profile panel (selected row → right panel) | P0 | Not started |
| EWS-003 | PD (Probability of Default) score gauge bar | P0 | Not started |
| EWS-004 | Risk indicators list (DPD, balance drop, cheque bounce, etc.) | P0 | Not started |
| EWS-005 | 5 metric cards (Total Alerts, High Risk, Avg PD, Auto Cases, Resolved) | P0 | Not started |
| EWS-006 | POST /ews/evaluate — trigger risk evaluation for a customer | P0 | Not started |
| EWS-007 | Alert severity filter (HIGH/MEDIUM/LOW) | P1 | Not started |
| EWS-008 | Auto-create CMS case when alert is HIGH (Kafka: ews.alert.high) | P1 | Not started |
| EWS-009 | Scenario simulation (GDP drop, interest rate change, recovery) | P1 | Not started |
| EWS-010 | "Assign to collection" action from risk profile panel | P1 | Not started |
| EWS-011 | "Add to watchlist" action | P1 | Not started |
| EWS-012 | Alert resolve workflow with comment | P1 | Not started |
| EWS-013 | 30-second live polling with React Query | P1 | Not started |
| EWS-014 | AI model reason codes (explainable AI) | P2 | Not started |
| EWS-015 | Monthly PD model retraining job (BullMQ) | P2 | Not started |
| EWS-016 | Browser push notification for HIGH alerts | P2 | Not started |
| EWS-017 | Alert history timeline per customer | P3 | Not started |
| EWS-018 | Bulk assign alerts to relationship managers | P3 | Not started |

---

## MODULE 3: AML COMPLIANCE MONITOR (`/aml`)

### Purpose
Anti-Money Laundering transaction monitoring. Detects suspicious transactions, manages STR/CTR filings, and maintains regulatory compliance.

### Features
| ID | Feature | Priority | Status |
|---|---|---|---|
| AML-001 | Transaction monitoring table (Txn ID, Amount, Country, Type, Risk) | P0 | Not started |
| AML-002 | 5 metric cards (Txn Monitored, Suspicious, STR Filed, CTR, Cases Open) | P0 | Not started |
| AML-003 | POST /aml/monitor — flag transaction as suspicious | P0 | Not started |
| AML-004 | Case statistics panel (vertical bar chart by status) | P0 | Not started |
| AML-005 | STR/CTR reports table | P0 | Not started |
| AML-006 | STR report creation form (Suspicious Transaction Report) | P0 | Not started |
| AML-007 | CTR auto-generation (Currency Transaction Report for >threshold) | P0 | Not started |
| AML-008 | Transaction risk scoring (rule-based + ML) | P1 | Not started |
| AML-009 | Case assignment to compliance officer | P1 | Not started |
| AML-010 | Maker-checker for STR filing | P1 | Not started |
| AML-011 | Country risk mapping (FATF list integration) | P1 | Not started |
| AML-012 | Bulk transaction import for batch screening | P2 | Not started |
| AML-013 | SAR (Suspicious Activity Report) workflow | P2 | Not started |
| AML-014 | AML typology rules engine (configurable) | P2 | Not started |
| AML-015 | Regulatory report export (PDF + XLSX + JSON) | P2 | Not started |
| AML-016 | Weekly ML model update with new typologies | P3 | Not started |
| AML-017 | Real-time SWIFT message screening | P3 | Not started |

---

## MODULE 4: DOCUMENT MANAGEMENT SYSTEM — DMS (`/dms`)

### Purpose
Digital KYC and document lifecycle management. Replaces paper-based branch processes with OCR-powered digital workflows.

### Features
| ID | Feature | Priority | Status |
|---|---|---|---|
| DMS-001 | Document upload form (Customer ID, Doc Type, Branch) | P0 | Not started |
| DMS-002 | Drag-and-drop file upload zone (PDF/JPG/PNG/XLSX, 10MB max) | P0 | Not started |
| DMS-003 | OCR preview panel with auto-extracted fields | P0 | Not started |
| DMS-004 | OCR confidence score display (green ≥70%, red <70%) | P0 | Not started |
| DMS-005 | Maker-checker approval queue | P0 | Not started |
| DMS-006 | 4 metric cards (Total Docs, Pending, KYC Expiring, Uploaded Today) | P0 | Not started |
| DMS-007 | Recent uploads panel (scrollable list) | P0 | Not started |
| DMS-008 | POST /dms/upload — multipart/form-data via Multer | P0 | Not started |
| DMS-009 | POST /dms/approve/:id — checker role, mandatory comment | P0 | Not started |
| DMS-010 | Document version history | P1 | Not started |
| DMS-011 | SHA-256 duplicate detection | P1 | Not started |
| DMS-012 | KYC expiry alert system (days-to-expiry counter) | P1 | Not started |
| DMS-013 | Full-text document search (Elasticsearch) | P1 | Not started |
| DMS-014 | Document viewer (full-screen overlay with metadata) | P1 | Not started |
| DMS-015 | Re-scan / re-OCR action | P1 | Not started |
| DMS-016 | Auto-link document to loan application (LOS integration) | P2 | Not started |
| DMS-017 | Bulk KYC renewal workflow | P2 | Not started |
| DMS-018 | Azure Blob Storage for file persistence | P2 | Not started |
| DMS-019 | Document retention policy enforcement (7-year rule) | P2 | Not started |
| DMS-020 | Mobile camera capture for field KYC | P3 | Not started |
| DMS-021 | eSign integration (DocuSign / native) | P3 | Not started |

---

## MODULE 5: LOAN ORIGINATION SYSTEM — LOS (`/los`)

### Purpose
End-to-end new loan application processing. From customer data entry to AI credit scoring to final approval with maker-checker control.

### Features
| ID | Feature | Priority | Status |
|---|---|---|---|
| LOS-001 | 5-step application stepper (Details → Financial → Docs → Score → Review) | P0 | Not started |
| LOS-002 | Customer details form (Name, Mobile, Email, CID) | P0 | Not started |
| LOS-003 | Loan product + purpose selector | P0 | Not started |
| LOS-004 | Loan amount + tenure input with repayment preview | P0 | Not started |
| LOS-005 | AI credit score panel (CIBIL gauge, PD Score, LTV, FOIR) | P0 | Not started |
| LOS-006 | POST /los/application — create new application | P0 | Not started |
| LOS-007 | POST /rating/calculate — trigger AI credit scoring | P0 | Not started |
| LOS-008 | "Recommend Approval" / "Send for Review" actions | P0 | Not started |
| LOS-009 | Financial information form (income, liabilities, assets) | P1 | Not started |
| LOS-010 | Document attachment step (DMS integration) | P1 | Not started |
| LOS-011 | Auto-save draft every 30 seconds | P1 | Not started |
| LOS-012 | Application status tracking (Submitted → Scored → Approved/Rejected) | P1 | Not started |
| LOS-013 | Maker-checker approval for loan sanction | P1 | Not started |
| LOS-014 | Loan application dashboard (all active applications) | P1 | Not started |
| LOS-015 | Bureau credit check integration (CIBIL/CRIF stub) | P1 | Not started |
| LOS-016 | Repayment schedule generator | P2 | Not started |
| LOS-017 | Loan offer letter generation (PDF) | P2 | Not started |
| LOS-018 | Disbursement instruction to CBS | P2 | Not started |
| LOS-019 | Relationship manager assignment | P2 | Not started |
| LOS-020 | Branch-level application pipeline view | P3 | Not started |
| LOS-021 | Customer self-service application portal | P3 | Not started |

---

## MODULE 6: COLLECTION MANAGEMENT SYSTEM — CMS (`/cms`)

### Purpose
Loan recovery and NPA control. AI-driven Next Best Action for field agents. GPS-guided collection with offline mobile PWA support.

### Features
| ID | Feature | Priority | Status |
|---|---|---|---|
| CMS-001 | 5 metric cards (Total Overdue, NPA %, Recovery Rate, Agents, Cases) | P0 | Not started |
| CMS-002 | DPD bucket chart (0-30, 31-60, 61-90, 90+ NPA) | P0 | Not started |
| CMS-003 | Collection case list with NBA column | P0 | Not started |
| CMS-004 | AI Next Best Action panel (Field Visit, Call, SMS, Legal) | P0 | Not started |
| CMS-005 | POST /collection/case — assign case to agent | P0 | Not started |
| CMS-006 | POST /collection/payment — record payment receipt | P0 | Not started |
| CMS-007 | GPS field agent tracking map (React Leaflet) | P1 | Not started |
| CMS-008 | Agent assignment + route optimization | P1 | Not started |
| CMS-009 | Payment receipt generation (QR code support) | P1 | Not started |
| CMS-010 | Case history + activity log per loan | P1 | Not started |
| CMS-011 | Escalation workflow (Field Visit → Legal → Write-off) | P1 | Not started |
| CMS-012 | EWS integration — auto-case creation from HIGH alerts | P1 | Not started |
| CMS-013 | Mobile PWA for field agents (offline-first, Android/iOS) | P1 | Not started |
| CMS-014 | Offline case cache (last 100 cases in IndexedDB) | P1 | Not started |
| CMS-015 | Sync on reconnection (queue offline actions) | P1 | Not started |
| CMS-016 | Field visit proof-of-visit camera capture | P2 | Not started |
| CMS-017 | NPA prediction alert (before bucket moves) | P2 | Not started |
| CMS-018 | Bulk case import from CBS | P2 | Not started |
| CMS-019 | Write-off workflow with ADMIN approval | P2 | Not started |
| CMS-020 | Collection agent performance dashboard | P3 | Not started |
| CMS-021 | Legal case tracking integration | P3 | Not started |

---

## MODULE 7: IFRS 9 — PROVISIONING (`/ifrs9`)

### Purpose
IFRS 9 financial instrument provisioning. Automates Expected Credit Loss (ECL) calculation, stage migration, and regulatory reporting.

### Features
| ID | Feature | Priority | Status |
|---|---|---|---|
| IFRS-001 | Loan stage classification (Stage 1/2/3) dashboard | P0 | Not started |
| IFRS-002 | ECL calculation per loan + portfolio | P0 | Not started |
| IFRS-003 | Stage migration triggers (DPD-based + qualitative) | P0 | Not started |
| IFRS-004 | Monthly ECL batch run (BullMQ scheduled job) | P0 | Not started |
| IFRS-005 | ECL provision matrix by product + risk grade | P1 | Not started |
| IFRS-006 | Portfolio summary by stage (count + amount) | P1 | Not started |
| IFRS-007 | ECL movement report (period comparison) | P1 | Not started |
| IFRS-008 | Regulatory submission export (PDF + XLSX) | P1 | Not started |
| IFRS-009 | Scenario analysis (base/adverse/optimistic) | P2 | Not started |
| IFRS-010 | PD/LGD/EAD model input editor | P2 | Not started |
| IFRS-011 | Macro-economic overlay variables | P2 | Not started |
| IFRS-012 | Audit trail for every stage change | P2 | Not started |

---

## MODULE 8: ALM / FTP (`/alm`)

### Purpose
Asset Liability Management and Fund Transfer Pricing for treasury operations.

### Features
| ID | Feature | Priority | Status |
|---|---|---|---|
| ALM-001 | Liquidity gap analysis chart | P1 | Not started |
| ALM-002 | Interest rate risk dashboard | P1 | Not started |
| ALM-003 | FTP rate table by product and tenor | P1 | Not started |
| ALM-004 | Maturity profile of assets and liabilities | P1 | Not started |
| ALM-005 | NSFR / LCR ratio monitoring | P2 | Not started |
| ALM-006 | Stress testing scenarios | P2 | Not started |
| ALM-007 | FTP curve management | P2 | Not started |
| ALM-008 | ALM report generation | P2 | Not started |

---

## MODULE 9: REPORTS (`/reports`)

### Purpose
Regulatory and management reporting. All reports generated without manual intervention.

### Features
| ID | Feature | Priority | Status |
|---|---|---|---|
| RPT-001 | Report catalog (list of all available reports) | P0 | Not started |
| RPT-002 | PDF export for all reports | P0 | Not started |
| RPT-003 | XLSX export for all reports | P0 | Not started |
| RPT-004 | Scheduled report generation (BullMQ cron) | P1 | Not started |
| RPT-005 | IFRS 9 provisioning report | P1 | Not started |
| RPT-006 | AML CTR/STR submission report | P1 | Not started |
| RPT-007 | NPA + credit risk regulatory report | P1 | Not started |
| RPT-008 | Loan portfolio MIS report | P1 | Not started |
| RPT-009 | Collection efficiency report | P2 | Not started |
| RPT-010 | JSON export for regulator API submission | P2 | Not started |
| RPT-011 | Report delivery via email (scheduled) | P2 | Not started |
| RPT-012 | Custom report builder (drag-and-drop fields) | P3 | Not started |

---

## MODULE 10: SETTINGS & ADMINISTRATION (`/settings`)

### Features
| ID | Feature | Priority | Status |
|---|---|---|---|
| SET-001 | User management (create, edit, deactivate) | P0 | Not started |
| SET-002 | Role assignment (ADMIN only, audit-logged) | P0 | Not started |
| SET-003 | RBAC — 10 platform roles | P0 | Not started |
| SET-004 | Tenant configuration | P0 | Not started |
| SET-005 | Audit log viewer (all data-changing operations) | P1 | Not started |
| SET-006 | Branch management | P1 | Not started |
| SET-007 | Loan product configuration | P1 | Not started |
| SET-008 | Currency + timezone settings | P1 | Not started |
| SET-009 | SAML 2.0 SSO configuration | P2 | Not started |
| SET-010 | Notification preferences | P2 | Not started |
| SET-011 | API key management (partner integrations) | P2 | Not started |
| SET-012 | System health dashboard | P2 | Not started |

---

## PLATFORM-LEVEL FEATURES

### Authentication & Security
| ID | Feature | Priority |
|---|---|---|
| AUTH-001 | Email + bcrypt login | P0 |
| AUTH-002 | JWT access token (15min) + refresh (7d, httpOnly cookie) | P0 |
| AUTH-003 | Account lockout: 5 fails → 30 min block | P0 |
| AUTH-004 | SAML 2.0 SSO for enterprise banks | P1 |
| AUTH-005 | Audit every auth event | P0 |
| AUTH-006 | Rate limiting per tenant/IP | P1 |
| AUTH-007 | PCI DSS security controls | P1 |

### Multi-Tenancy
| ID | Feature | Priority |
|---|---|---|
| MT-001 | Row-level tenant isolation (tenantId on every table) | P0 |
| MT-002 | Tenant provisioning (< 4 hours) | P1 |
| MT-003 | Cross-tenant access architecturally impossible | P0 |
| MT-004 | Tenant-specific configurations | P1 |

### Core Banking Integration (CBS)
| ID | Feature | Priority |
|---|---|---|
| CBS-001 | CBS adapter pattern (Temenos T24, Finacle) | P1 |
| CBS-002 | 15-minute sync cycle (BullMQ) | P1 |
| CBS-003 | Graceful degradation on CBS failure | P1 |
| CBS-004 | New CBS vendor in < 5 days (adapter contract) | P2 |

### Real-time & Notifications
| ID | Feature | Priority |
|---|---|---|
| RT-001 | EWS alerts pushed within 30 seconds | P1 |
| RT-002 | AML alerts pushed within 60 seconds | P1 |
| RT-003 | FCM push notifications for critical alerts | P2 |
| RT-004 | In-app notification bell + dropdown | P1 |
| RT-005 | Kafka event streaming backbone | P1 |

### Data Warehouse
| ID | Feature | Priority |
|---|---|---|
| DWH-001 | 1M+ records/hour ingestion | P1 |
| DWH-002 | 7-year historical data retention | P1 |
| DWH-003 | BI query response < 2s on 10M rows | P2 |
| DWH-004 | Multi-tenant row-level analytics security | P1 |

### Internationalisation
| ID | Feature | Priority |
|---|---|---|
| I18N-001 | English + Hindi + Dzongkha + Sinhala + Khmer | P2 |
| I18N-002 | Multi-currency (BTN/INR/LKR/KES/KHR/USD) | P1 |
| I18N-003 | Tenant timezone support | P1 |
| I18N-004 | RTL layout ready (CSS logical properties) | P3 |

---

## PRIORITY SUMMARY

| Priority | Count | Meaning |
|---|---|---|
| P0 | ~60 | MVP — must ship in Phase 1-7 |
| P1 | ~70 | Core product — ship in Phase 8-11 |
| P2 | ~40 | Full banking suite — Phase 12+ |
| P3 | ~20 | Advanced / future roadmap |

---

## RBAC — 10 PLATFORM ROLES

| Role | Modules | Key Permissions |
|---|---|---|
| SUPER_ADMIN | All | Full platform access, tenant management |
| ADMIN | All | User management, role assignment, settings |
| RISK_ANALYST | EWS, IFRS9 | EWS evaluate, IFRS calculations |
| COMPLIANCE_OFFICER | AML, Reports | STR/CTR filing, AML case management |
| LOAN_OFFICER | LOS | Create/submit loan applications |
| CREDIT_ANALYST | LOS, EWS | Credit scoring, risk assessment |
| BRANCH_MANAGER | Dashboard, LOS, DMS | Approve DMS, view branch loans |
| COLLECTION_AGENT | CMS | Mobile PWA, record payments |
| COLLECTION_MANAGER | CMS | Assign cases, view all agents |
| AUDITOR | Reports, Settings | Read-only access, audit logs |

---

*Feature Catalog — Data Networks Engineering · April 2026*
