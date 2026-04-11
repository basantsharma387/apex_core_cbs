-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'RISK_ANALYST', 'COMPLIANCE_OFFICER', 'LOAN_OFFICER', 'CREDIT_ANALYST', 'BRANCH_MANAGER', 'COLLECTION_AGENT', 'COLLECTION_MANAGER', 'AUDITOR', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "KYCStatus" AS ENUM ('PENDING', 'VERIFIED', 'EXPIRED', 'REJECTED');

-- CreateEnum
CREATE TYPE "LoanStatus" AS ENUM ('ACTIVE', 'DISBURSED', 'CLOSED', 'NPA', 'RESTRUCTURED', 'WRITTEN_OFF');

-- CreateEnum
CREATE TYPE "DPDBucket" AS ENUM ('0-30', '31-60', '61-90', '90+');

-- CreateEnum
CREATE TYPE "AppStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'SCORING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'DISBURSED');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('OPEN', 'ASSIGNED', 'RESOLVED', 'ESCALATED');

-- CreateEnum
CREATE TYPE "AMLStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'CLEARED', 'FILED_STR', 'FILED_CTR');

-- CreateEnum
CREATE TYPE "STRStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'FILED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DocType" AS ENUM ('NATIONAL_ID', 'PASSPORT', 'DRIVING_LICENSE', 'ADDRESS_PROOF', 'INCOME_PROOF', 'BANK_STATEMENT', 'LOAN_FORM', 'PHOTO');

-- CreateEnum
CREATE TYPE "DocStatus" AS ENUM ('PENDING_OCR', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "NBA" AS ENUM ('FIELD_VISIT', 'PHONE_CALL', 'SMS', 'EMAIL', 'LEGAL_NOTICE', 'RESTRUCTURE');

-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'PAYMENT_RECEIVED', 'ESCALATED', 'CLOSED', 'WRITTEN_OFF');

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'LOAN_OFFICER',
    "branchId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "nationalId" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "kycStatus" "KYCStatus" NOT NULL DEFAULT 'PENDING',
    "kycVerifiedAt" TIMESTAMP(3),
    "kycExpiresAt" TIMESTAMP(3),
    "riskGrade" TEXT NOT NULL DEFAULT 'C',
    "relationshipManagerId" TEXT,
    "branchId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_users" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "portal_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_refresh_tokens" (
    "id" TEXT NOT NULL,
    "portalUserId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portal_refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loans" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "applicationId" TEXT,
    "productType" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "disbursedAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "outstandingBalance" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "interestRate" DECIMAL(5,4) NOT NULL,
    "tenureMonths" INTEGER NOT NULL,
    "dpd" INTEGER NOT NULL DEFAULT 0,
    "bucket" "DPDBucket" NOT NULL DEFAULT '0-30',
    "stage" INTEGER NOT NULL DEFAULT 1,
    "status" "LoanStatus" NOT NULL DEFAULT 'ACTIVE',
    "branchId" TEXT NOT NULL,
    "officerId" TEXT NOT NULL,
    "disbursedAt" TIMESTAMP(3),
    "maturityDate" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "loans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loan_applications" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "productType" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "requestedAmount" DECIMAL(18,2) NOT NULL,
    "requestedTenure" INTEGER NOT NULL,
    "approvedAmount" DECIMAL(18,2),
    "creditScore" INTEGER,
    "pdScore" DECIMAL(4,3),
    "status" "AppStatus" NOT NULL DEFAULT 'DRAFT',
    "officerId" TEXT NOT NULL,
    "reviewerId" TEXT,
    "branchId" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "comments" TEXT,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "loan_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repayment_schedules" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "installment" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "principal" DECIMAL(18,2) NOT NULL,
    "interest" DECIMAL(18,2) NOT NULL,
    "totalDue" DECIMAL(18,2) NOT NULL,
    "paidAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "paidAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "repayment_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ews_alerts" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "alertId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "riskLevel" "RiskLevel" NOT NULL,
    "pdScore" DECIMAL(4,3) NOT NULL,
    "indicators" TEXT[],
    "dpd" INTEGER NOT NULL,
    "outstandingBalance" DECIMAL(18,2) NOT NULL,
    "status" "AlertStatus" NOT NULL DEFAULT 'OPEN',
    "assignedTo" TEXT,
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolution" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ews_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aml_alerts" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "alertId" TEXT NOT NULL,
    "txnId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "country" CHAR(2) NOT NULL,
    "txnType" TEXT NOT NULL,
    "riskLevel" "RiskLevel" NOT NULL,
    "riskScore" INTEGER NOT NULL,
    "reasons" TEXT[],
    "status" "AMLStatus" NOT NULL DEFAULT 'OPEN',
    "assignedTo" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aml_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "str_reports" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "alertId" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "description" TEXT NOT NULL,
    "filedBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "status" "STRStatus" NOT NULL DEFAULT 'DRAFT',
    "filedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "str_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "docId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "docType" "DocType" NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "storageUrl" TEXT NOT NULL,
    "sha256Hash" TEXT NOT NULL,
    "ocrConfidence" DECIMAL(4,3),
    "ocrData" JSONB,
    "status" "DocStatus" NOT NULL DEFAULT 'PENDING_OCR',
    "uploadedBy" TEXT NOT NULL,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "reviewComments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collection_cases" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "dpd" INTEGER NOT NULL,
    "bucket" "DPDBucket" NOT NULL,
    "outstandingAmount" DECIMAL(18,2) NOT NULL,
    "nba" "NBA" NOT NULL DEFAULT 'PHONE_CALL',
    "assignedAgentId" TEXT,
    "status" "CaseStatus" NOT NULL DEFAULT 'OPEN',
    "lastActivityAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collection_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "paymentMode" TEXT NOT NULL,
    "receivedBy" TEXT NOT NULL,
    "gpsLat" DECIMAL(9,6),
    "gpsLng" DECIMAL(9,6),
    "receiptUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ifrs_staging" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "stage" INTEGER NOT NULL,
    "pdScore" DECIMAL(4,3) NOT NULL,
    "lgd" DECIMAL(4,3) NOT NULL,
    "ead" DECIMAL(18,2) NOT NULL,
    "ecl" DECIMAL(18,2) NOT NULL,
    "batchId" TEXT NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ifrs_staging_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "userId" TEXT NOT NULL,
    "requestId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_code_key" ON "tenants"("code");

-- CreateIndex
CREATE INDEX "users_tenantId_idx" ON "users"("tenantId");

-- CreateIndex
CREATE INDEX "users_tenantId_role_idx" ON "users"("tenantId", "role");

-- CreateIndex
CREATE INDEX "users_tenantId_isActive_idx" ON "users"("tenantId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "users_tenantId_email_key" ON "users"("tenantId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_idx" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "customers_tenantId_idx" ON "customers"("tenantId");

-- CreateIndex
CREATE INDEX "customers_tenantId_kycStatus_idx" ON "customers"("tenantId", "kycStatus");

-- CreateIndex
CREATE INDEX "customers_tenantId_branchId_idx" ON "customers"("tenantId", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "customers_tenantId_customerId_key" ON "customers"("tenantId", "customerId");

-- CreateIndex
CREATE UNIQUE INDEX "portal_users_customerId_key" ON "portal_users"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "portal_users_email_key" ON "portal_users"("email");

-- CreateIndex
CREATE INDEX "portal_users_tenantId_idx" ON "portal_users"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "portal_refresh_tokens_token_key" ON "portal_refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "portal_refresh_tokens_portalUserId_idx" ON "portal_refresh_tokens"("portalUserId");

-- CreateIndex
CREATE UNIQUE INDEX "loans_applicationId_key" ON "loans"("applicationId");

-- CreateIndex
CREATE INDEX "loans_tenantId_idx" ON "loans"("tenantId");

-- CreateIndex
CREATE INDEX "loans_tenantId_customerId_idx" ON "loans"("tenantId", "customerId");

-- CreateIndex
CREATE INDEX "loans_tenantId_status_idx" ON "loans"("tenantId", "status");

-- CreateIndex
CREATE INDEX "loans_tenantId_bucket_idx" ON "loans"("tenantId", "bucket");

-- CreateIndex
CREATE INDEX "loans_tenantId_dpd_idx" ON "loans"("tenantId", "dpd");

-- CreateIndex
CREATE UNIQUE INDEX "loans_tenantId_loanId_key" ON "loans"("tenantId", "loanId");

-- CreateIndex
CREATE INDEX "loan_applications_tenantId_idx" ON "loan_applications"("tenantId");

-- CreateIndex
CREATE INDEX "loan_applications_tenantId_status_idx" ON "loan_applications"("tenantId", "status");

-- CreateIndex
CREATE INDEX "loan_applications_tenantId_customerId_idx" ON "loan_applications"("tenantId", "customerId");

-- CreateIndex
CREATE UNIQUE INDEX "loan_applications_tenantId_applicationId_key" ON "loan_applications"("tenantId", "applicationId");

-- CreateIndex
CREATE INDEX "repayment_schedules_loanId_idx" ON "repayment_schedules"("loanId");

-- CreateIndex
CREATE INDEX "repayment_schedules_tenantId_dueDate_idx" ON "repayment_schedules"("tenantId", "dueDate");

-- CreateIndex
CREATE INDEX "ews_alerts_tenantId_idx" ON "ews_alerts"("tenantId");

-- CreateIndex
CREATE INDEX "ews_alerts_tenantId_riskLevel_idx" ON "ews_alerts"("tenantId", "riskLevel");

-- CreateIndex
CREATE INDEX "ews_alerts_tenantId_status_idx" ON "ews_alerts"("tenantId", "status");

-- CreateIndex
CREATE INDEX "ews_alerts_tenantId_customerId_idx" ON "ews_alerts"("tenantId", "customerId");

-- CreateIndex
CREATE UNIQUE INDEX "ews_alerts_tenantId_alertId_key" ON "ews_alerts"("tenantId", "alertId");

-- CreateIndex
CREATE INDEX "aml_alerts_tenantId_idx" ON "aml_alerts"("tenantId");

-- CreateIndex
CREATE INDEX "aml_alerts_tenantId_status_idx" ON "aml_alerts"("tenantId", "status");

-- CreateIndex
CREATE INDEX "aml_alerts_tenantId_riskLevel_idx" ON "aml_alerts"("tenantId", "riskLevel");

-- CreateIndex
CREATE UNIQUE INDEX "aml_alerts_tenantId_alertId_key" ON "aml_alerts"("tenantId", "alertId");

-- CreateIndex
CREATE UNIQUE INDEX "str_reports_alertId_key" ON "str_reports"("alertId");

-- CreateIndex
CREATE INDEX "str_reports_tenantId_idx" ON "str_reports"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "str_reports_tenantId_reportId_key" ON "str_reports"("tenantId", "reportId");

-- CreateIndex
CREATE INDEX "documents_tenantId_idx" ON "documents"("tenantId");

-- CreateIndex
CREATE INDEX "documents_tenantId_customerId_idx" ON "documents"("tenantId", "customerId");

-- CreateIndex
CREATE INDEX "documents_tenantId_status_idx" ON "documents"("tenantId", "status");

-- CreateIndex
CREATE INDEX "documents_tenantId_expiresAt_idx" ON "documents"("tenantId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "documents_tenantId_docId_key" ON "documents"("tenantId", "docId");

-- CreateIndex
CREATE UNIQUE INDEX "documents_tenantId_sha256Hash_key" ON "documents"("tenantId", "sha256Hash");

-- CreateIndex
CREATE INDEX "collection_cases_tenantId_idx" ON "collection_cases"("tenantId");

-- CreateIndex
CREATE INDEX "collection_cases_tenantId_status_idx" ON "collection_cases"("tenantId", "status");

-- CreateIndex
CREATE INDEX "collection_cases_tenantId_assignedAgentId_idx" ON "collection_cases"("tenantId", "assignedAgentId");

-- CreateIndex
CREATE UNIQUE INDEX "collection_cases_tenantId_caseId_key" ON "collection_cases"("tenantId", "caseId");

-- CreateIndex
CREATE INDEX "payments_tenantId_caseId_idx" ON "payments"("tenantId", "caseId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_tenantId_paymentId_key" ON "payments"("tenantId", "paymentId");

-- CreateIndex
CREATE INDEX "ifrs_staging_tenantId_batchId_idx" ON "ifrs_staging"("tenantId", "batchId");

-- CreateIndex
CREATE INDEX "ifrs_staging_tenantId_loanId_idx" ON "ifrs_staging"("tenantId", "loanId");

-- CreateIndex
CREATE INDEX "audit_logs_tenantId_entityType_entityId_idx" ON "audit_logs"("tenantId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_tenantId_userId_idx" ON "audit_logs"("tenantId", "userId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal_users" ADD CONSTRAINT "portal_users_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal_refresh_tokens" ADD CONSTRAINT "portal_refresh_tokens_portalUserId_fkey" FOREIGN KEY ("portalUserId") REFERENCES "portal_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_applications" ADD CONSTRAINT "loan_applications_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_applications" ADD CONSTRAINT "loan_applications_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repayment_schedules" ADD CONSTRAINT "repayment_schedules_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "loans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ews_alerts" ADD CONSTRAINT "ews_alerts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ews_alerts" ADD CONSTRAINT "ews_alerts_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ews_alerts" ADD CONSTRAINT "ews_alerts_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "loans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aml_alerts" ADD CONSTRAINT "aml_alerts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aml_alerts" ADD CONSTRAINT "aml_alerts_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "str_reports" ADD CONSTRAINT "str_reports_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "str_reports" ADD CONSTRAINT "str_reports_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "aml_alerts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_cases" ADD CONSTRAINT "collection_cases_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_cases" ADD CONSTRAINT "collection_cases_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_cases" ADD CONSTRAINT "collection_cases_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "loans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "collection_cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ifrs_staging" ADD CONSTRAINT "ifrs_staging_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ifrs_staging" ADD CONSTRAINT "ifrs_staging_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "loans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
