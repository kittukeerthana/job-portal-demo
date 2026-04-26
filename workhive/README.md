# 🐝 WorkHive — Job Portal Management System

A clean, fully-featured Job Portal built with **pure Node.js** (zero npm dependencies).

---

## 🚀 How to Run in VS Code

### Option 1 — Terminal (fastest)
1. Open this folder in VS Code
2. Open the terminal: **View → Terminal** (or `` Ctrl+` ``)
3. Run:
   ```bash
   node server.js
   ```
4. Open your browser → **http://localhost:3000**

### Option 2 — VS Code Run Button
1. Open `server.js` in the editor
2. Press **F5** or click the ▶️ Run button
3. Open your browser → **http://localhost:3000**

### Option 3 — npm start
```bash
npm start
```

---

## 📦 No npm install required!
This project uses **zero external packages** — only Node.js built-in modules:
- `http`   — web server
- `fs`     — file serving
- `path`   — path utilities
- `url`    — URL parsing

---

## ✨ Features

| Feature | Description |
|---|---|
| **Browse Jobs** | 12 realistic job listings with salary, location & tags |
| **Search** | Filter by keyword across title, company, description |
| **Category Filter** | Engineering, Design, Marketing, Finance, Data, etc. |
| **Sort** | By Newest / Highest Salary / A–Z |
| **Apply for a Job** | Full application form with validation |
| **My Applications** | View all submitted applications |
| **Withdraw Application** | Delete/withdraw any application |
| **REST API** | Backend stores applications in memory |

---

## 🗂 Project Structure

```
workhive/
├── server.js           ← Node.js HTTP server + REST API
├── package.json
├── README.md
└── public/             ← Static frontend files
    ├── index.html
    ├── css/
    │   └── style.css
    └── js/
        ├── data.js     ← Job listings data
        └── app.js      ← Frontend logic (fetch API)
```

---

## 🔌 REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/jobs` | List all jobs |
| `GET` | `/api/applications` | List all applications |
| `POST` | `/api/applications` | Submit a new application |
| `DELETE` | `/api/applications/:id` | Withdraw an application |

> **Note:** Applications are stored in-memory and reset when the server restarts.
> To persist data, swap the array for a JSON file or SQLite.

---

## 🛑 Stop the server
Press **Ctrl+C** in the terminal.
