# SaaS ERP Multi-Tenant (Laravel 11)

A production-ready SaaS ERP system built with Laravel 11 and MySQL.

## 🚀 Architecture Overview

- Multi-tenant architecture using Global Scopes
- Service Layer pattern
- Subscription enforcement middleware
- Role-based authorization (Policies)
- Invoice calculation engine (server-side financial integrity)
- Dashboard analytics engine
- Centralized JSON exception handling
- Activity logging via model lifecycle hooks

---

## 🏗 Tech Stack

Backend:
- Laravel 11
- MySQL
- Sanctum (Token Authentication)

Architecture:
- Controllers
- Services
- Policies
- API Resources
- Middleware-based subscription enforcement

---

## 🔐 Multi-Tenancy Strategy

- Each model includes `company_id`
- Global Scope enforces tenant isolation
- `company_id` never mass assignable
- Automatic assignment on model creation

---

## 💳 Subscription System

- Trial expiration enforcement
- Account activation check
- Plan limits:
  - max_clients
  - max_users
  - max_products
  - max_invoices_per_month

---

## 🧾 Invoice Engine

- Server-side subtotal calculation
- Tax calculation from company settings
- Invoice number auto-generation (prefix-year-sequence)
- Monthly invoice limit enforcement
- Automatic overdue detection

---

## 📊 Dashboard Analytics

- Total revenue
- Monthly revenue
- Overdue invoices
- Paid invoices
- Revenue grouped by month

---

## 🧠 Security

- Sanctum token authentication
- Policy-based role control
- Global JSON exception standardization
- Tenant-level query isolation

---

## 📌 Status

Backend: Production-ready  
Frontend: (To be implemented)

---

## 📄 License

Educational project.