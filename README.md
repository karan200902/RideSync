# 🚗 RideSync — Full-Stack Ride-Sharing Platform

RideSync is a full-stack ride-sharing platform inspired by Uber and Ola. It is designed to connect passengers with drivers while providing ride management, route visualization, payment processing, and administrative controls.

The project focuses on building a secure, modular, and scalable web application using modern full-stack development technologies.

## ✨ Features

### 👤 Authentication & Authorization
- User registration and login.
- JWT-based authentication.
- Role-based access control for passengers, drivers, and administrators.
- Protected routes and role-specific dashboards.

### 🚕 Driver Management
- Driver profile and vehicle management.
- Driver verification workflow.
- Online/offline availability management.

### 📍 Ride Management
- Pickup and destination selection.
- Map-based route visualization using Google Maps.
- Fare estimation.
- Ride lifecycle and status management.
- Passenger, driver, and administrator ride views.

### 💳 Payments
- Razorpay integration for online payments.
- Payment verification workflow.
- Payment records and status tracking.

### 🛠️ Admin Dashboard
- User management.
- Driver management and verification.
- Ride monitoring.
- Payment management.
- Complaint management interface (coming soon).

## 🧰 Tech Stack

### Frontend
- React
- Vite
- JavaScript
- React Router
- Tailwind CSS

### Backend
- Node.js
- Express.js
- JavaScript
- REST APIs

### Database & Integrations
- MongoDB
- Mongoose
- JWT authentication
- Google Maps Platform
- Razorpay

## 🏗️ Project Structure

```text
RideSync/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── server.js
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── layouts/
│   │   ├── pages/
│   │   └── ...
│   ├── package.json
│   └── .env.example
├── .gitignore
└── README.md
```

*The directory structure above represents the intended organization; individual files may vary as development progresses.*

## ⚙️ Getting Started

### Prerequisites

Install the following before running the project:

- Node.js and npm
- MongoDB Atlas account or a local MongoDB instance
- Google Maps Platform API key
- Razorpay test account and API credentials

### 1. Clone the repository

```bash
git clone https://github.com/karan200902/RideSync.git
cd RideSync
```

### 2. Set up the backend

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory using the variables required by your backend configuration.

Example:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_strong_access_token_secret
JWT_REFRESH_SECRET=your_strong_refresh_token_secret
CLIENT_URL=http://localhost:5173
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

Use the exact variable names expected by your existing code. Additional variables may be required depending on your implementation.

Start the backend using the script configured in `backend/package.json`. For example:

```bash
npm run dev
```

### 3. Set up the frontend

Open another terminal:

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend/` directory with the variables required by your frontend configuration.

Example:

```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

Check your existing API client and Google Maps configuration for the exact variable names.

Start the frontend:

```bash
npm run dev
```

### 4. Open the application

Visit the local URL printed by Vite, usually:

```text
http://localhost:5173
```

The backend is expected to run on:

```text
http://localhost:5000
```

## 🔐 Security Notes

- Never commit `.env` files or API secrets.
- Use strong secrets for authentication.
- Restrict Google Maps API keys to the required APIs and applications.
- Use Razorpay test credentials during development.
- Validate incoming requests and enforce server-side authorization.
- Never trust payment amounts, user roles, or other sensitive values supplied by the client.

## 🗺️ Development Roadmap

- [x] Authentication and role-based dashboards
- [x] Driver profile and verification workflows
- [x] Ride management
- [x] Google Maps route visualization
- [x] Razorpay payment workflow
- [x] Admin user, driver, ride, and payment management
- [ ] Complaint management
- [ ] Real-time driver tracking and ride updates
- [ ] Automated testing and security hardening
- [ ] Production deployment

*Update this checklist as features are completed and tested.*

## 🎯 Project Goals

RideSync is being developed as a placement-focused full-stack project to explore:

- Modular backend architecture.
- REST API design and integration.
- Authentication and authorization.
- Database schema design and relationships.
- Payment gateway integration.
- Map and route integration.
- Real-world application workflows and edge cases.

## 👨‍💻 Author

**Karan**

GitHub: [@karan200902](https://github.com/karan200902)

---

⭐ If you find this project interesting, feel free to explore the repository and follow its development.
