# QuickDesk - Help Desk System

A modern, feature-rich help desk system built with React, Node.js, and MongoDB. QuickDesk provides a comprehensive solution for managing support tickets, user interactions, and team collaboration.

## Features

### 🎯 Core Functionality
- **Multi-role Support**: End Users, Support Agents, and Admins
- **Ticket Management**: Create, track, and resolve support tickets
- **Threaded Conversations**: Rich comment system with attachments
- **Voting System**: Upvote/downvote tickets and comments
- **File Attachments**: Support for images, documents, and PDFs
- **Email Notifications**: Automated notifications for ticket updates

### 👥 User Roles

#### End Users
- Create and track support tickets
- Add attachments to tickets
- Vote on tickets and comments
- View ticket status and updates
- Search and filter tickets

#### Support Agents
- View assigned and unassigned tickets
- Update ticket status and priority
- Add internal comments (not visible to end users)
- Assign tickets to themselves
- Respond to user inquiries

#### Admins
- Manage user roles and permissions
- Create and manage ticket categories
- View system analytics and reports
- Oversee all ticket operations

### 🔧 Technical Features
- **Real-time Updates**: Live ticket status changes
- **Advanced Filtering**: Search by status, category, priority, and more
- **Pagination**: Efficient handling of large ticket volumes
- **Responsive Design**: Works on desktop, tablet, and mobile
- **File Upload**: Drag-and-drop file attachments
- **Email Integration**: SMTP-based notifications

## Tech Stack

### Frontend
- **React 18** with Vite
- **React Router** for navigation
- **Tailwind CSS** for styling
- **React Icons** for UI icons
- **Axios** for API communication

### Backend
- **Node.js** with Express
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Multer** for file uploads
- **Nodemailer** for email notifications
- **Helmet** for security headers

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- SMTP server for email notifications (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd QuickDesk
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   cd backend
   npm install
   
   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Backend environment variables
   cd backend
   cp env.example .env
   ```
   
   Edit `.env` file:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/quickdesk
   JWT_SECRET=your-secret-key
   NODE_ENV=development
   
   # Email configuration (optional)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   ```

4. **Start the development servers**
   ```bash
   # Start backend (from backend directory)
   npm run dev
   
   # Start frontend (from frontend directory)
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Tickets
- `GET /api/tickets` - Get all tickets (with filtering)
- `GET /api/tickets/:id` - Get single ticket with comments
- `POST /api/tickets` - Create new ticket
- `PUT /api/tickets/:id` - Update ticket
- `DELETE /api/tickets/:id` - Delete ticket
- `POST /api/tickets/:id/comments` - Add comment to ticket
- `POST /api/tickets/:id/vote` - Vote on ticket

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category (admin only)
- `PUT /api/categories/:id` - Update category (admin only)
- `DELETE /api/categories/:id` - Delete category (admin only)

## Database Schema

### User Model
```javascript
{
  email: String,
  password: String,
  firstName: String,
  lastName: String,
  role: ['end_user', 'support_agent', 'admin'],
  isVerified: Boolean,
  isActive: Boolean
}
```

### Ticket Model
```javascript
{
  subject: String,
  description: String,
  category: ObjectId,
  status: ['open', 'in_progress', 'resolved', 'closed'],
  priority: ['low', 'medium', 'high', 'urgent'],
  creator: ObjectId,
  assignedTo: ObjectId,
  attachments: Array,
  upvotes: [ObjectId],
  downvotes: [ObjectId]
}
```

### Comment Model
```javascript
{
  ticket: ObjectId,
  author: ObjectId,
  content: String,
  isInternal: Boolean,
  attachments: Array,
  upvotes: [ObjectId],
  downvotes: [ObjectId]
}
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions, please create an issue in the repository or contact the development team.
