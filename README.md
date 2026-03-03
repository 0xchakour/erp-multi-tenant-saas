Nexora ERP – Multi-Tenant SaaS Platform

Nexora ERP is a modern multi-tenant SaaS platform designed to manage finance, operations, and organizational workflows within a unified and secure workspace.

The project follows a decoupled full-stack architecture using Laravel as an API backend and React + Vite as a frontend client application.


---

Architecture Overview

This system is built using a clean separation between frontend and backend layers.

Backend

Laravel (RESTful API)

Laravel Sanctum authentication

MySQL database

Multi-tenant ready structure


Frontend

React

Vite

Component-based architecture

Responsive SaaS UI design


The application is structured to support tenant isolation, secure authentication, and scalable SaaS growth.


---

Project Structure

erp-multi-tenant-saas/
│
├── backend/        # Laravel API (authentication, business logic, tenants)
├── frontend/       # React client application
└── .gitignore


---

Core Features (Current Implementation)

Multi-tenant backend foundation

Sanctum-based authentication

Unified authentication modal (Sign In / Get Started)

Modern SaaS landing page

Responsive navigation with dynamic header behavior

Clean UI/UX structure ready for expansion

API-first architecture



---

Product Vision

Nexora ERP is designed to evolve into a scalable SaaS ERP platform capable of:

Tenant-based authentication and isolation

Workspace management

Financial and operational modules

Subscription-ready SaaS architecture

Secure API-driven communication



---

Local Development Setup

1. Clone Repository

git clone https://github.com/your-username/erp-multi-tenant-saas.git
cd erp-multi-tenant-saas


---

2. Backend Setup

cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve

Configure your database credentials inside the .env file before running migrations.


---

3. Frontend Setup

cd frontend
npm install
npm run dev

Frontend runs by default on:

http://localhost:5173


---

Environment Configuration

Sensitive data is managed through .env files and is excluded from version control.

Ensure correct configuration of:

Database credentials

APP_URL

Sanctum settings

Frontend API base URL



---

Development Workflow

Recommended branching strategy:

main → stable production-ready branch

dev → active development branch


Commit examples:

feat: implement unified auth modal

refactor: improve navbar behavior

style: enhance login interface



---

Current Status

Project is under active development.

The core UI structure and authentication flow are implemented.
Multi-tenant logic expansion and business modules are in progress.


---

License

License to be defined prior to production release.
