Getting Started & Running the Project

1. Installation
Clone the repository and install dependencies:

Bash
git clone [https://github.com/your-username/task-manager-backend.git](https://github.com/your-username/task-manager-backend.git)
cd task-manager-backend
npm install

2. How to Run the Server (Loyiha serverini yoqish)
Development Mode (Nodemon bilan - kod o'zgarganda server avto-restart bo'ladi):

Bash
npm run dev

Production Mode (Oddiy Node.js orqali yoqish):
Bash
node index.js
Server muvaffaqiyatli yoqilgach, quyidagi natijani ko'rasiz:


Plaintext
Server running on port 5000
MongoDB connected: ...

# Task & Team Management Tool - Backend API

Professional RESTful API and Telegram Bot service built with Node.js, Express, MongoDB, and Telegraf.js for managing tasks, teams, and sending automated notifications via Telegram.

---

## 🚀 Features

* **Authentication & Authorization:** JWT-based user login and registration with encrypted passwords (`bcryptjs`).
* **Task Management (CRUD):** Complete API for creating, reading, updating, and deleting tasks with role-based access control.
* **Telegram Integration:** Built-in Telegram Bot using Telegraf.js to dynamically link user accounts via `/start <userId>`.
* **Instant Alerts:** Real-time Telegram notifications sent when a task is assigned or its status changes.
* **Database Management:** Object modeling and schema validation powered by Mongoose (MongoDB Atlas).

---

## 🛠 Tech Stack

* **Runtime Environment:** Node.js
* **Framework:** Express.js
* **Database:** MongoDB Atlas (Mongoose)
* **Authentication:** JSON Web Tokens (JWT) & bcryptjs
* **Telegram Bot SDK:** Telegraf.js
* **Development Utilities:** Nodemon, Dotenv, CORS

---

## 📁 Directory Structure

```text
task-manager-backend/
├── config/
│   ├── db.js           # Database connection logic
│   └── bot.js          # Telegram bot initialization and handlers
├── controllers/
│   ├── authController.js
│   └── taskController.js
├── middlewares/
│   └── authMiddleware.js # JWT verification & role validation
├── models/
│   ├── User.js         # Mongoose User schema
│   └── Task.js         # Mongoose Task schema
├── routes/
│   ├── authRoutes.js
│   └── taskRoutes.js
├── utils/
│   └── telegram.js     # Helper functions for Telegram alerts
├── .env                # Environment variables (git-ignored)
├── index.js            # Server entry point
└── package.json