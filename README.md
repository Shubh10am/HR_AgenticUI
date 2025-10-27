# HR Streamline AI

HR Streamline AI is an intelligent, all-in-one platform designed to automate and simplify your HR operations. From recruitment and onboarding to attendance tracking and internal communications, this platform leverages the power of AI to make HR processes more efficient, data-driven, and user-friendly.

![HR Streamline AI Dashboard](https://www.agentic-hr.in/_next/image?url=%2Fimages%2Frecruitment.jpg&w=1200&q=75)

---

## ✨ Key Features

- **🤖 AI-Powered Recruitment**: Generate job descriptions, perform ATS-like resume analysis, and conduct initial screening interviews with an AI agent.
- **✉️ Smart Email Assistance**: Generate professional email drafts for common inquiries and compose new emails from simple prompts.
- **📈 Analytics Dashboard**: A comprehensive admin panel to monitor platform usage, user signups, feature adoption, and system health.
- **🤝 Employee Management**: Onboard new employees, manage roles and departments, and track activity within the organization.
- **📅 Attendance & Leave Management**: Clock-in/out functionality, attendance reporting, and a system for requesting and tracking leave.
- **🌐 Unified Communications**: A central hub to view and manage communications from integrated platforms like Gmail (more coming soon).
- **📝 Community Hub**: An internal social feed for company announcements and employee engagement.
- **🔐 Secure Authentication**: Robust authentication system with JWT, password reset, and secure magic links.

## 🚀 Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [ShadCN UI](https://ui.shadcn.com/)
- **Generative AI**: [Google AI & Genkit](https://firebase.google.com/docs/genkit)
- **Database**: [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/)
- **Authentication**: [JWT](https://jwt.io/) & [bcrypt.js](https://github.com/dcodeIO/bcrypt.js)
- **Deployment**: [Vercel](https://vercel.com/), [Docker](https://www.docker.com/), [Kubernetes](https://kubernetes.io/)

---

## 🏁 Getting Started

To set up and run this project locally, follow these steps.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [MongoDB](https://www.mongodb.com/try/download/community) instance (local or a cloud service like MongoDB Atlas)

### 1. Clone the Repository

```bash
git clone https://github.com/Shubh10am/HR_AgenticUI.git
cd HR_AgenticUI
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the root of your project and add the following environment variables. You can generate the secret keys using a secure method (e.g., `openssl rand -base64 32`).

```dotenv
# MongoDB Connection String
MONGODB_URI="your_mongodb_connection_string"

# JWT Secret for session authentication
JWT_SECRET="your_strong_jwt_secret_key"

# Encryption Key for sensitive data in the database (must be a 32-byte, base64-encoded string)
ENCRYPTION_KEY="your_32_byte_base64_encoded_encryption_key"

# Google AI API Key (for Genkit features)
GOOGLE_API_KEY="your_google_ai_api_key"

# Base URL for your application (for OAuth callbacks)
NEXT_PUBLIC_BASE_URL="http://localhost:9002"

# Google OAuth Credentials (for Gmail/Calendar integration)
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"

# Brevo API Key (for sending transactional emails)
BREVO_API_KEY="your_brevo_api_key"
```

### 4. Run the Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:9002](http://localhost:9002).

---

## ☁️ Deployment

### Vercel

The easiest way to deploy this Next.js app is to use the [Vercel Platform](https://vercel.com/new).

- Fork the repository.
- Create a new Vercel project and import the forked repository.
- **Important**: Add all the environment variables from your `.env.local` file to the Vercel project settings.

Vercel will automatically build and deploy your application.

### Docker

You can also run the application using Docker and Docker Compose.

1.  **Ensure you have a `.env.local` file** with the necessary environment variables as described in the "Getting Started" section.
2.  **Build and run the container**:

    ```bash
    docker-compose up --build
    ```

    The application will be available at [http://localhost:3000](http://localhost:3000).

### Kubernetes

To deploy the application to a Kubernetes cluster, you can use the manifest files provided in the `k8s/` directory.

1.  **Prerequisites**:
    - A running Kubernetes cluster.
    - `kubectl` command-line tool configured to communicate with your cluster.

2.  **Create the Secret**:
    - The `k8s/secret.yaml` file contains placeholder values. You must replace them with your actual secrets, encoded in Base64.
    - To encode a value, use the following command:
      ```bash
      echo -n 'your_secret_value' | base64
      ```
    - Update the `data` section in `k8s/secret.yaml` with your encoded values.

3.  **Apply the Manifests**:
    - Once the secret is configured, apply all the manifests to your cluster:
      ```bash
      kubectl apply -f k8s/
      ```
    - This will create the Deployment, Service, and Secret resources in your cluster. Your application will be exposed via a LoadBalancer service.
```