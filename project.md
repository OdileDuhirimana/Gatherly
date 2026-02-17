
# 📘 Gatherly – Advanced Event Management System (Node.js + MySQL)

### Project Overview

Gatherly is a **scalable, enterprise-grade backend system** for event management.
It is designed to handle **thousands of events and attendees**, provide **real-time analytics**, integrate **payments**, support **notifications**, and offer **organizer dashboards**.

The system is built with:

* **Node.js + Express.js** (backend)
* **MySQL** (data storage) via **Sequelize ORM**
* **JWT authentication + bcrypt** (security)
* **Stripe API** (payments)
* **Docker** (deployment)
* **Swagger/OpenAPI** (API docs)

---

## 🌟 Key Features

### 1️⃣ User & Role Management

* User registration and login
* Roles: Admin, Organizer, Attendee
* Profile management (name, email, profile photo, preferences)
* Social login (Google, Facebook optional)
* Password reset via email

### 2️⃣ Event Management

* Create, update, delete events
* Event fields: title, description, location, images, categories, start/end date, ticket tiers
* Recurring events support
* Event publishing/unpublishing
* Event tags and categories
* Featured events

### 3️⃣ Ticketing & Payment

* Multiple ticket types (Regular, VIP, Early Bird, Group)
* Ticket availability limits and expiry dates
* Stripe API integration for secure payments
* Generate unique ticket codes or QR codes
* Ticket refund handling (full or partial)
* Downloadable e-ticket PDF/email confirmation

### 4️⃣ Attendee Management

* Register attendees for events
* Track attendance (check-in/check-out)
* Waitlist management for sold-out events
* VIP/priority attendees
* Feedback collection (post-event surveys)

### 5️⃣ Notifications & Communication

* Email notifications (event confirmation, reminders, cancellations)
* Push notifications (via Firebase optional)
* SMS reminders (Twilio optional)
* Automated notification templates

### 6️⃣ Analytics & Reporting

* Real-time dashboard for organizers
* Ticket sales, revenue, and attendance reports
* Event performance analytics (popular events, high-demand tickets)
* Export reports (CSV, PDF)
* Dashboard charts for quick insights

### 7️⃣ Social & Engagement Features

* Event sharing via social media
* Attendee comments and reviews
* Event rating system
* Organizer announcements to attendees

### 8️⃣ Security & Compliance

* JWT-based API authentication
* Role-based access control (RBAC)
* Input validation and sanitization
* HTTPS ready (SSL)
* Secure storage of sensitive data
* Audit logs for critical operations

### 9️⃣ Admin Panel

* Manage all users, events, and payments
* View platform-wide analytics
* Manual refund handling
* Manage featured events and categories
* Monitor flagged tickets or suspicious activity

---

## 🏗️ Database Design (ERD Overview)

**Tables and Relationships**

1. **Users** – `id, name, email, password, role, profile_photo, createdAt, updatedAt`
2. **Events** – `id, organizerId, title, description, category, location, startDate, endDate, published, createdAt, updatedAt`
3. **Tickets** – `id, eventId, type, price, quantity, sold, uniqueCode, createdAt, updatedAt`
4. **Payments** – `id, ticketId, userId, amount, currency, status, stripePaymentId, createdAt, updatedAt`
5. **Attendees** – `id, userId, eventId, ticketId, checkedIn, createdAt, updatedAt`
6. **Notifications** – `id, userId, eventId, type, message, read, createdAt`
7. **Comments** – `id, eventId, userId, content, rating, createdAt, updatedAt`
8. **AuditLogs** – `id, action, userId, targetType, targetId, timestamp`

Relationships:

* Users → Events (1:N)
* Events → Tickets (1:N)
* Tickets → Payments (1:1)
* Users → Attendees (1:N)
* Events → Comments (1:N)

---

## ⚙️ API Endpoints (RESTful)

### User & Auth

* `POST /api/auth/register` → register new user
* `POST /api/auth/login` → login (JWT)
* `POST /api/auth/social` → social login
* `POST /api/auth/forgot-password` → send reset link
* `POST /api/auth/reset-password` → reset password

### Events

* `GET /api/events` → list events
* `GET /api/events/:id` → get event details
* `POST /api/events` → create event (organizer)
* `PUT /api/events/:id` → update event
* `DELETE /api/events/:id` → delete event

### Tickets

* `GET /api/events/:id/tickets` → list ticket types
* `POST /api/events/:id/tickets` → create ticket
* `POST /api/tickets/:id/purchase` → purchase ticket (Stripe)
* `POST /api/tickets/:id/checkin` → check-in attendee

### Payments

* `GET /api/payments/:userId` → get user payments
* `POST /api/payments/refund/:id` → refund a ticket

### Notifications

* `GET /api/notifications` → list user notifications
* `POST /api/notifications/send` → send notification

### Analytics

* `GET /api/analytics/events/:id` → event stats (tickets sold, revenue)
* `GET /api/analytics/users` → user engagement metrics

---

## 🐳 Deployment (Docker Ready)

**docker-compose.yml**:

```yaml
version: '3.8'
services:
  mysql:
    image: mysql:8
    container_name: gatherly-mysql
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: gatherly
      MYSQL_USER: nova_user
      MYSQL_PASSWORD: nova_password
    ports:
      - "3306:3306"
    volumes:
      - gatherly_data:/var/lib/mysql

  app:
    build: .
    container_name: gatherly-app
    depends_on:
      - mysql
    environment:
      DB_HOST: mysql
      DB_USER: nova_user
      DB_PASSWORD: nova_password
      DB_NAME: gatherly
      JWT_SECRET: your_jwt_secret
      STRIPE_SECRET: your_stripe_secret
    ports:
      - "5000:5000"
volumes:
  gatherly_data:
```

**Dockerfile**:

```dockerfile
FROM node:20
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["npm", "run", "dev"]
```

---

## 🧪 Testing & QA

* Unit tests (Jest) for controllers, services
* Integration tests for API routes
* Test payment flows with Stripe test keys
* Test notifications via console logs / mock service

---

## 📜 Step-by-Step Instructions for Junie AI

1. Initialize **Node.js + Express project**
2. Setup **MySQL database** and Sequelize models for all tables
3. Implement **JWT authentication** and role-based middleware
4. Build **REST API routes** for users, events, tickets, payments, notifications, analytics
5. Integrate **Stripe payment API**
6. Implement **email/push notifications**
7. Add **analytics aggregation** (tickets sold, revenue, event popularity)
8. Create **Swagger documentation** for all endpoints
9. Containerize using **Docker + Docker Compose**
10. Include **unit and integration tests** for key features
11. Provide **seed scripts** for demo events, users, and tickets

---

If you want, I can also create a **ready-to-feed JSON/YAML “Junie AI project blueprint”** that it can literally read and generate **everything automatically**, step by step — including **models, routes, services, controllers, and Docker setup**.

Do you want me to do that next?
