# Gatherly - Full-Stack Event Management Platform

A comprehensive event management platform built with Node.js, Express, React, and Redux. Gatherly allows organizers to create and manage events while providing attendees with a seamless registration and participation experience.

## 🚀 Features

### User Management
- **Role-based Authentication**: Admin, Organizer, and Attendee roles
- **JWT-based Security**: Secure login and session management
- **Password Hashing**: bcrypt for secure password storage

### Event Management
- **CRUD Operations**: Create, read, update, and delete events
- **Rich Event Details**: Title, description, date/time, location, category, max attendees
- **Image Upload**: Optional event images
- **Real-time Updates**: Dynamic event modifications

### Attendee Management
- **Event Registration**: Easy attendee registration
- **Check-in System**: QR code or manual check-in
- **Dynamic Stats**: Real-time attendee counts and analytics
- **Email Notifications**: Optional reminder system

### Frontend Features
- **Modern React SPA**: Clean and responsive UI with TailwindCSS
- **State Management**: Redux Toolkit for efficient state handling
- **Event Browsing**: Filter by category, date, or organizer
- **Role-based Dashboards**: Customized views for different user types
- **Responsive Design**: Mobile-first approach

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **Sequelize ORM** with SQLite (dev) / MySQL (prod)
- **JWT Authentication** with bcrypt password hashing
- **RESTful APIs** with comprehensive error handling
- **Input Validation** with express-validator

### Frontend
- **React 18** with TypeScript
- **Redux Toolkit** for state management
- **TailwindCSS** for styling
- **React Router** for navigation
- **Axios** for API communication

### Development & Deployment
- **Vite** for fast development and building
- **GitHub Actions** for CI/CD
- **ESLint** for code quality
- **SQLite** for local development
- **MySQL** for production

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Gatherly
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env  # Configure your environment variables
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:4000
   - API Health Check: http://localhost:4000/api/health

### Environment Variables

Create a `.env` file in the backend directory:

```env
PORT=4000
DB_DIALECT=sqlite
# For production MySQL:
# DATABASE_URL=mysql://username:password@localhost:3306/gatherly
JWT_SECRET=your-super-secret-jwt-key
```

## 🚀 Deployment

### Backend Deployment (Heroku/Render)

1. **Prepare for Production**
   ```bash
   cd backend
   # Update .env with production DATABASE_URL
   npm run build  # If you have a build step
   ```

2. **Deploy to Heroku**
   ```bash
   heroku create your-app-name
   heroku addons:create cleardb:ignite  # For MySQL
   heroku config:set JWT_SECRET=your-production-secret
   git push heroku main
   ```

3. **Deploy to Render**
   - Connect your GitHub repository
   - Set environment variables
   - Deploy automatically on push

### Frontend Deployment (Vercel/Netlify)

1. **Build the Frontend**
   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy to Vercel**
   ```bash
   npx vercel --prod
   ```

3. **Deploy to Netlify**
   - Connect repository
   - Build command: `npm run build`
   - Publish directory: `dist`

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile

### Event Endpoints
- `GET /api/events` - List all events
- `POST /api/events` - Create new event (Organizer/Admin)
- `GET /api/events/:id` - Get event details
- `PUT /api/events/:id` - Update event (Owner/Admin)
- `DELETE /api/events/:id` - Delete event (Owner/Admin)
- `GET /api/events/:id/stats` - Get event statistics

### Registration Endpoints
- `POST /api/events/:id/register` - Register for event
- `POST /api/events/:id/registrations/:regId/check-in` - Check-in attendee
- `GET /api/events/:id/registrations` - List event attendees

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

### Integration Tests
The GitHub Actions workflow includes automated integration tests that verify:
- Backend health endpoints
- Frontend build process
- API connectivity

## 🔧 Development

### Project Structure
```
Gatherly/
├── backend/                 # Express.js API server
│   ├── src/
│   │   ├── config/         # Database configuration
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/     # Auth & validation middleware
│   │   ├── models/         # Sequelize models
│   │   ├── routes/         # API routes
│   │   └── server.js       # Main server file
│   └── package.json
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── store/          # Redux store & slices
│   │   └── App.tsx         # Main app component
│   └── package.json
├── .github/workflows/      # GitHub Actions CI/CD
└── README.md
```

### Available Scripts

**Backend:**
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm test` - Run tests

**Frontend:**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm test` - Run tests

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Workflow
- Follow conventional commit messages
- Ensure all tests pass
- Update documentation for new features
- Follow the existing code style

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎯 Roadmap

### Planned Features
- [ ] Real-time notifications with Socket.io
- [ ] Advanced search and filtering
- [ ] Payment integration (Stripe/PayPal)
- [ ] CSV export for attendee lists
- [ ] Dark mode and theme customization
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Email marketing integration

### Performance Improvements
- [ ] Database query optimization
- [ ] Frontend code splitting
- [ ] Image optimization and CDN
- [ ] Caching strategies
- [ ] API rate limiting

## 📞 Support

For support, email support@gatherly.com or create an issue in the GitHub repository.

## 🙏 Acknowledgments

- React team for the amazing framework
- Redux team for state management
- TailwindCSS for utility-first styling
- Express.js community for the robust backend framework
- All contributors who help make this project better

---

**Built with ❤️ by the Gatherly Team**