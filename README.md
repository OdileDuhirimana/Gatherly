# 🎉 Gatherly - Event Management Platform

A modern, full-stack event management platform built with React, Node.js, and Express. Gatherly provides a comprehensive solution for creating, managing, and attending events with a beautiful, responsive user interface.

![Gatherly Banner](https://via.placeholder.com/1200x400/3B82F6/FFFFFF?text=Gatherly+-+Event+Management+Platform)

## ✨ Features

### 🎯 Core Features
- **Event Creation & Management**: Create, edit, and delete events with rich details
- **User Authentication**: Secure JWT-based authentication with role-based access
- **Event Registration**: Easy registration and cancellation for attendees
- **Image Upload**: Support for event images with preview functionality
- **Search & Filtering**: Advanced search and filtering capabilities
- **Responsive Design**: Beautiful, mobile-first responsive design
- **Real-time Updates**: Dynamic UI updates with modern state management

### 🎨 UI/UX Features
- **Modern Design**: Clean, professional interface with glass effects and gradients
- **Dark/Light Theme**: Adaptive design with beautiful color schemes
- **Animations**: Smooth transitions and hover effects
- **Grid/List Views**: Multiple viewing options for events
- **Interactive Components**: Engaging user interactions and feedback
- **Loading States**: Professional loading indicators and skeleton screens

### 🔐 User Roles
- **Attendee**: Browse and register for events
- **Organizer**: Create and manage events
- **Admin**: Full system access and management

## 🚀 Tech Stack

### Frontend
- **React 19** - Modern React with hooks and functional components
- **TypeScript** - Type-safe development
- **Redux Toolkit** - State management
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icons
- **React Hot Toast** - Notifications
- **Axios** - HTTP client

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Sequelize** - ORM for database operations
- **SQLite** - Development database
- **MySQL** - Production database
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Multer** - File upload handling
- **express-validator** - Input validation

### Development Tools
- **Vite** - Fast build tool
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Git** - Version control

## 📦 Installation

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Git

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/gatherly.git
   cd gatherly
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   PORT=4000
   NODE_ENV=development
   JWT_SECRET=your-super-secret-jwt-key
   DB_DIALECT=sqlite
   DB_STORAGE=./database.sqlite
   FRONTEND_URL=http://localhost:5173
   ```

4. **Start the backend server**
   ```bash
   npm run start
   ```

### Frontend Setup

1. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Start the development server**
   ```bash
   npm run dev
   ```

3. **Open your browser**
   Navigate to `http://localhost:5173`

## 🎯 Usage

### Getting Started

1. **Visit the Landing Page**
   - Beautiful hero section with feature highlights
   - Call-to-action buttons for registration

2. **Create an Account**
   - Register as an attendee, organizer, or admin
   - Secure authentication with JWT tokens

3. **Explore Events**
   - Browse all available events
   - Use search and filtering options
   - Switch between grid and list views

4. **Create Events** (Organizers/Admins)
   - Rich event creation form
   - Image upload with preview
   - Category and attendee management

5. **Manage Your Dashboard**
   - View event statistics
   - Manage your events
   - Track registrations

### API Endpoints

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get user profile

#### Events
- `GET /api/events` - Get all events (with pagination, search, filters)
- `POST /api/events` - Create new event (Organizer/Admin)
- `GET /api/events/:id` - Get event details
- `PUT /api/events/:id` - Update event (Organizer/Admin)
- `DELETE /api/events/:id` - Delete event (Organizer/Admin)

#### Registrations
- `POST /api/registrations/:eventId` - Register for event
- `DELETE /api/registrations/:eventId` - Cancel registration
- `GET /api/registrations/user/my-registrations` - Get user registrations
- `GET /api/registrations/:eventId` - Get event attendees (Organizer/Admin)

## 🎨 Design System

### Color Palette
- **Primary**: Blue (#3B82F6)
- **Secondary**: Gray (#64748B)
- **Success**: Green (#10B981)
- **Warning**: Yellow (#F59E0B)
- **Error**: Red (#EF4444)

### Typography
- **Font Family**: Inter (Google Fonts)
- **Headings**: Bold, large sizes
- **Body**: Regular weight, readable sizes

### Components
- **Cards**: Rounded corners, subtle shadows
- **Buttons**: Multiple variants (primary, secondary, danger, success)
- **Forms**: Clean inputs with validation states
- **Modals**: Overlay with backdrop blur

## 🔧 Development

### Project Structure
```
gatherly/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Route handlers
│   │   ├── middleware/      # Custom middleware
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── config/         # Configuration files
│   │   └── server.js       # Main server file
│   ├── uploads/            # File uploads
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── store/          # Redux store
│   │   ├── types/          # TypeScript types
│   │   └── App.tsx         # Main app component
│   └── package.json
└── README.md
```

### Available Scripts

#### Backend
```bash
npm run start          # Start production server
npm run dev            # Start development server with nodemon
npm run test           # Run tests
```

#### Frontend
```bash
npm run dev            # Start development server
npm run build          # Build for production
npm run preview        # Preview production build
npm run lint           # Run ESLint
```

## 🚀 Deployment

### Backend Deployment
1. Set up a production database (MySQL/PostgreSQL)
2. Update environment variables
3. Deploy to your preferred platform (Heroku, AWS, DigitalOcean)
4. Configure file upload storage

### Frontend Deployment
1. Build the production bundle: `npm run build`
2. Deploy to static hosting (Vercel, Netlify, AWS S3)
3. Configure environment variables for API endpoints

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Your Name**
- GitHub: [@yourusername](https://github.com/yourusername)
- LinkedIn: [Your LinkedIn](https://linkedin.com/in/yourprofile)
- Email: your.email@example.com

## 🙏 Acknowledgments

- [React](https://reactjs.org/) - The web framework used
- [Express.js](https://expressjs.com/) - The web framework for Node.js
- [Tailwind CSS](https://tailwindcss.com/) - The CSS framework used
- [Lucide](https://lucide.dev/) - The icon library used
- [Vite](https://vitejs.dev/) - The build tool used

## 📊 Project Status

- ✅ Authentication & Authorization
- ✅ Event CRUD Operations
- ✅ User Registration System
- ✅ Image Upload Functionality
- ✅ Search & Filtering
- ✅ Responsive Design
- ✅ Modern UI/UX
- 🔄 Real-time Notifications (Coming Soon)
- 🔄 Advanced Analytics (Coming Soon)
- 🔄 Email Notifications (Coming Soon)

---

**Made with ❤️ by [Your Name]**

*This project showcases modern full-stack development practices with a focus on user experience and code quality.*