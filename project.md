Gatherly – Full-Stack Event Management Platform

Tech Stack:

Backend: Node.js, Express.js, Sequelize ORM, MySQL

Frontend: React.js, Redux, TailwindCSS/Bootstrap

Authentication: JWT for secure login and role-based access (Admin, Organizer, Attendee)

Deployment: Heroku / Render / Vercel

Project Description:
Gatherly is a full-featured event management platform that allows organizers to create, manage, and track events while providing attendees with a seamless registration and participation experience. It is designed to be fully deployable, visually polished, and production-ready.

Features & Build Plan:

User Roles & Authentication

Users: Admin, Organizer, Attendee

JWT-based login & registration

Password hashing (bcrypt) and session management

Role-based API access

Event Management (Organizer/ Admin)

CRUD operations for events (Create, Read, Update, Delete)

Event details: title, description, date/time, location, category, max attendees

Upload event images (optional)

Real-time updates for event modifications

Attendee Management

Attendee registration for events

Check-in system (QR code or manual)

Dynamic attendee list and stats per event

Email/notification reminders (optional: using a service like SendGrid)

Frontend Features

React.js SPA with clean and responsive UI

Event browsing & filtering by category, date, or organizer

Organizer dashboard for managing events and attendees

Attendee dashboard for registration and event updates

Backend Features

RESTful APIs for all operations (users, events, attendees)

Sequelize models for Users, Events, Registrations

Input validation & error handling

Logging and basic analytics (number of attendees per event, trending events)

Optional Advanced Features (to make it next-level)

Real-time notifications with Socket.io (event updates, live attendee stats)

Search & filter with full-text database queries

Payment integration (Stripe/PayPal) for paid events

Export attendee list to CSV

Dark mode and theme toggle

Deployment & Visibility

Deploy backend to Heroku / Render

Deploy frontend to Vercel / Netlify

Connect backend API with frontend

Add README with demo screenshots and instructions

Showcase live demo on portfolio / GitHub
