# needle360 Backend - Digital Marketplace and Community Hub for the tailoring sector in Sri Lanka

<div align="center">
    <br><br>
    <img src="https://github.com/Rizz-33/needle360-frontend/blob/main/public/logo-white-full.png" alt="needle360 Logo">
    <br><br>
</div>

## Overview

This repository contains the backend services for **needle360**, a web-based e-commerce platform designed specifically for tailor shops. The platform enables tailor shop owners to showcase and sell custom garments while allowing customers to design their own clothing, submit customizations, and interact with tailor shops seamlessly.

This project aims to revolutionize the tailor industry by providing a one-stop digital solution for custom apparel shopping and order management.

## System Architecture

needle360 follows a layered architecture to ensure scalability and maintainability:

### Integration Layer

- **API Gateway**: Manages API requests between frontend and backend
- **Event Bus**: Facilitates real-time communication between services
- **External Integrations**:
  - Stripe (Payment Gateway)
  - Mailtrap (Email Service)
  - SocketIO (Message Queue)
  - Cloudinary (Cloud Storage)

### Backend Layer

Multiple microservices handle specific business domains:

- **Authentication Service**: Signup, Login, JWT, Role-Based Access Control (Admin, Tailor, Customer)
- **Admin Service**: Administrative functions and platform management
- **Customer Service**: Customer account management and related features
- **Tailor Service**: Tailor account and service management
- **Order Service**: Order processing and tracking for both tailors and customers
- **Inventory Service**: Stock management for tailor shops
- **Reporting Service**: Analytics and business intelligence for admins
- **Design Service**: Collaborative design tools and customization
- **Offer Service**: Special offers and promotions from tailors
- **Conversation & Message Service**: In-app communication between users
- **Review Service**: Customer feedback system for tailors and services
- **Availability Service**: Tailor scheduling and availability management
- **User Interaction Service**: User engagement features and notifications
- **Appointment Service**: Scheduling system for tailor-customer meetings
- **Services Service**: Core service definitions and configurations

### Data Layer

- **MongoDB**: Primary database storing collections for:
  - Users (Admin, Tailor, Customer)
  - Orders, Inventory, Designs
  - Appointments, Payments
  - Reviews, Messages, Services
- **Redis**: Caching for:
  - Session data
  - In-memory caching for frequent data
  - JWT token storage
  - User preferences
- **Cloudinary**: Cloud storage for:
  - Design images
  - User profile pictures
  - Product images
  - Order documents

## Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **Caching**: Redis
- **Authentication**: JWT with role-based access control
- **Message Queue**: SocketIO
- **Email Service**: Mailtrap
- **File Storage**: Cloudinary
- **Deployment**: AWS/DigitalOcean

## Getting Started

### Prerequisites

Ensure you have the following installed before setting up the project:

- **Node.js** (v18+ recommended)
- **Git**
- **PNPM/Yarn/NPM**
- **MongoDB** (local or Atlas connection)
- **Redis** (for caching and sessions)

### Installation

Clone the repository and navigate into the project directory:

```bash
# Clone the repository
git clone https://github.com/Rizz-33/needle360-backend.git
cd needle360-backend

# Install dependencies
npm install  # or pnpm install / yarn install
```

### Running the Backend Server

```bash
# Development mode with hot-reload
npm node app.js

# Production mode
npm node app.js
```

The API server will be available at `http://localhost:4000` by default.

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
MONGODB_CONNECTION_STRING="mongodb://localhost:27017/needle360"
MONGODB_PASSWORD=your_mongodb_password

# Example URI
# MONGODB_URI=mongodb+srv://username:password@clustername.mongodb.net/database?retryWrites=true&w=majority

port=4000

JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1d

NODE_ENV=development

MAILTRAP_ENDPOINT=https://send.api.mailtrap.io
MAILTRAP_TOKEN=your_mailtrap_token
MAILTRAP_WEBHOOK_SECRET=your_mailtrap_webhook_secret
MAILTRAP_WEBHOOK_URL=http://needle360.online:4000/api/mailtrap-webhook

CLIENT_URL=http://13.61.16.74:5173
API_URL=http://localhost:5173

CLOUD_NAME=your_cloudinary_cloud_name
CLOUD_API_KEY=your_cloudinary_api_key
CLOUD_API_SECRET=your_cloudinary_api_secret

STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

SESSION_SECRET=your_session_secret

```

### API Documentation

Once the server is running, API documentation will be available at:

- Swagger UI: `http://localhost:4000/api-docs`

### Testing

```bash
# Run all tests
npm test

# Run tests with coverage report
npm run test:coverage
```

## Service Architecture

The backend is structured as a set of microservices that can be deployed together or independently:

```
needle360-backend/
├── services/
│   ├── auth-service/         # User authentication and authorization
│   ├── admin-service/        # Admin functionalities
│   ├── customer-service/     # Customer functionalities
│   ├── tailor-service/       # Tailor functionalities
│   ├── order-service/        # Order management
│   ├── inventory-service/    # Inventory management
│   ├── design-service/       # Design collaboration
│   ├── message-service/      # In-app messaging
│   ├── appointment-service/  # Scheduling
│   └── ...
├── shared/                   # Shared utilities and middleware
│   ├── middleware/
│   ├── utils/
│   └── models/
└── gateway/                  # API Gateway
```

## Contributing

We welcome contributions from the community! Follow these steps to contribute:

1. Fork the repository.
2. Create a new branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m "Add feature description"`
4. Push to the branch: `git push origin feature-name`
5. Submit a Pull Request.

## Roadmap

- ✅ Basic API & Authentication
- ✅ Order & Payment Processing
- ✅ Core Service Implementation
- ⏳ AI-based Design Recommendation Engine (Upcoming)
- ⏳ Enhanced Analytics Services (Upcoming)
- ⏳ Real-time Notifications (Upcoming)
- ⏳ API Performance Optimization (Upcoming)

## License

This project is licensed under the [MIT License](LICENSE).

## Contact

For any queries, feel free to reach out:

- **GitHub**: [@Rizz-33](https://github.com/Rizz-33)
- **Email**: TBD

---

Craft your style with **needle360** – Where Tailoring Meets Technology! ✂️🧵
