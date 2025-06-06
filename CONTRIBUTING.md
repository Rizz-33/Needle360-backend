# Contributing to needle360° Backend

We welcome and appreciate all contributions to the needle360° backend repository! 🎉

Whether you're fixing a bug, adding a feature, improving documentation, or enhancing performance, your work will benefit the tailoring sector of Sri Lanka. Thank you!

## 🧵 How to Contribute

### 1. Fork the Repository
Click the “Fork” button at the top right of this page to create your own copy of the repo.

### 2. Clone Your Fork
```bash
git clone https://github.com/your-username/needle360-backend.git
cd needle360-backend
```

### 3. Create a New Branch
```bash
git checkout -b feature/your-feature-name
```

### 4. Install Dependencies
```bash
npm install
# or
pnpm install
# or
yarn install
```

### 5. Make Changes
Update code, fix bugs, or improve documentation.

### 6. Run Tests (If Applicable)
```bash
npm test
```

### 7. Commit and Push Changes
```bash
git add .
git commit -m "Add: short description of your change"
git push origin feature/your-feature-name
```

### 8. Submit a Pull Request
Go to the original repo (https://github.com/Rizz-33/needle360-backend), and click "Compare & Pull Request". Provide a clear explanation of your changes.

## 🛠️ Code Style Guide

- Follow the structure and naming conventions used in the repository.
- Use clear and meaningful commit messages.
- Keep pull requests focused and limited to a single purpose.
- Ensure no linting or formatting issues exist.

## 🧪 Testing

Before submitting a PR, ensure all tests pass:

```bash
npm test
```

Include tests for any new features or changes.

## Sample `.env` Configuration

```env
MONGODB_CONNECTION_STRING="mongodb://localhost:27017/needle360"
MONGODB_PASSWORD=your_mongodb_password

# Example URI
# MONGODB_URI=mongodb+srv://username:password@clustername.mongodb.net/database?retryWrites=true&w=majority

PORT=4000

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

## 💬 Communication

If you're unsure about anything or need help, feel free to open an issue or contact the maintainer directly via:

- GitHub: [@Rizz-33](https://github.com/Rizz-33)
- Email: aarruwanthie@gmail.com

## 🧾 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to **needle360°** – Where Tailoring Meets Technology! ✂️🧵
---
