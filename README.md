# FreelanceChain 🚀

### Decentralized Freelancing Platform

FreelanceChain is a full-stack freelancing platform designed to connect **clients and freelancers** in a secure and transparent digital environment.

The project combines modern web technologies with **blockchain-based concepts** to improve trust, transparency, and security in freelance transactions.

---

## 📌 Project Overview

Traditional freelancing platforms usually depend on centralized systems for:

* Job posting
* Freelancer applications
* Project communication
* Payment processing
* Work management
* User reviews and ratings

FreelanceChain explores a decentralized approach where users can interact directly while blockchain technology can be used to provide transparency and security for important transactions.

The project was developed as part of **Semester 3** academic coursework.

---

## 🎯 Objectives

The main objectives of FreelanceChain are:

* Provide a platform for clients to post freelance projects.
* Allow freelancers to discover and apply for projects.
* Provide separate workflows for clients and freelancers.
* Improve transparency between clients and freelancers.
* Provide secure project and payment management.
* Explore blockchain integration for decentralized transactions.
* Provide real-time communication between users.
* Maintain project-related information in a structured database.

---

## ✨ Key Features

### 👤 User Management

* User registration and authentication
* Login/logout functionality
* User profiles
* Client and freelancer roles
* Profile information management

### 💼 Freelance Marketplace

Clients can:

* Create projects/jobs
* Add project descriptions
* Specify requirements
* Define project budgets
* Review freelancer applications

Freelancers can:

* Browse available projects
* View project details
* Apply for suitable projects
* Manage their applications
* Track project-related activities

### 💬 Real-Time Communication

The platform can provide real-time communication between users for project-related discussions.

This helps clients and freelancers communicate without depending on external communication platforms.

### 💰 Payment Management

FreelanceChain is designed around secure digital payments between clients and freelancers.

Blockchain technology can be used to make important transaction records more transparent and verifiable.

### 🔗 Blockchain Integration

Blockchain is used as part of the project's decentralized architecture.

Smart contracts can help automate and secure important transaction-related operations.

### 📁 Project Management

The platform can maintain project information such as:

* Project details
* Client information
* Freelancer information
* Applications
* Project status
* Payment information

---

## 🏗️ System Architecture

The project follows a full-stack architecture:

```text
                    ┌─────────────────────┐
                    │       Client        │
                    │      Browser        │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │      Frontend       │
                    │   React / Web UI    │
                    └──────────┬──────────┘
                               │
                         REST API / WebSocket
                               │
                               ▼
                    ┌─────────────────────┐
                    │       Backend       │
                    │ Node.js + Express   │
                    └──────┬─────────┬────┘
                           │         │
                           ▼         ▼
                  ┌────────────┐  ┌─────────────┐
                  │  MongoDB   │  │ Blockchain  │
                  │  Database  │  │ / Contracts │
                  └────────────┘  └──────┬──────┘
                                         │
                                         ▼
                                  ┌─────────────┐
                                  │   Wallet /  │
                                  │ Blockchain  │
                                  └─────────────┘
```

---

##  Technology Stack

### Frontend

* React.js
* HTML5
* CSS3
* JavaScript
* Tailwind CSS

### Backend

* Node.js
* Express.js
* REST APIs
* Socket.io

### Database

* MongoDB

### Blockchain

* Ethereum
* Solidity
* Smart Contracts
* Hardhat
* Ethers.js

### Development Tools

* Git
* GitHub
* Visual Studio Code
* npm

---

## 📂 Project Structure

A typical structure for the project is:

```text
FreelanceChain_Sem3/
│
├── frontend/
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── ...
│
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── server.js
│   └── package.json
│
├── blockchain/
│   ├── contracts/
│   ├── scripts/
│   ├── test/
│   ├── hardhat.config.js
│   └── package.json
│
├── README.md
└── .gitignore
```

> Update the folder names above if the actual repository uses a different structure.

---

## ⚙️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/itzsonu/FreelanceChain_Sem3.git
```

```bash
cd FreelanceChain_Sem3
```

---

### 2. Install Dependencies

Install dependencies for the frontend:

```bash
cd frontend
npm install
```

Install backend dependencies:

```bash
cd ../backend
npm install
```

If blockchain code is included:

```bash
cd ../blockchain
npm install
```

---

## 🔐 Environment Variables

Create a `.env` file according to the project's configuration.

Example:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

For blockchain configuration, environment variables may include:

```env
PRIVATE_KEY=your_wallet_private_key
RPC_URL=your_rpc_url
CONTRACT_ADDRESS=your_contract_address
```

**Never commit private keys, passwords, API keys, or other secrets to GitHub.**

---

## ▶️ Running the Project

### Start Backend

```bash
cd backend
npm start
```

or, if the project uses nodemon:

```bash
npm run dev
```

### Start Frontend

Open another terminal:

```bash
cd frontend
npm start
```

The application should then be available through the frontend development server.

---

## ⛓️ Running the Blockchain

If the project uses Hardhat:

```bash
cd blockchain
npx hardhat compile
```

Run the local blockchain:

```bash
npx hardhat node
```

Deploy the smart contracts using the project's deployment script.

```bash
npx hardhat run scripts/deploy.js --network localhost
```

> Use the exact deployment command defined in the repository if it differs from this example.

---

## 🔄 Application Workflow

### Client Workflow

```text
Register / Login
       ↓
Client Dashboard
       ↓
Create Project
       ↓
Receive Applications
       ↓
Review Freelancer
       ↓
Select Freelancer
       ↓
Project Collaboration
       ↓
Payment
       ↓
Complete Project
       ↓
Review / Rating
```

### Freelancer Workflow

```text
Register / Login
       ↓
Freelancer Dashboard
       ↓
Browse Projects
       ↓
View Project Details
       ↓
Apply for Project
       ↓
Client Selection
       ↓
Project Collaboration
       ↓
Complete Work
       ↓
Receive Payment
       ↓
Project Completion
```

---

## 🔒 Security Considerations

The project considers security through:

* User authentication
* Role-based access
* Protected API routes
* Environment variables
* Secure database operations
* Smart-contract-based transaction logic
* Wallet-based blockchain interaction

Private keys and sensitive credentials should always remain outside the source code.

---

## 🌟 Advantages

* Decentralized approach
* Transparent transaction processing
* Direct client–freelancer interaction
* Reduced dependency on centralized payment systems
* Secure project management
* Real-time communication
* Blockchain-based transaction verification
* Full-stack web application architecture

---

## 🚀 Future Enhancements

Possible future improvements include:

* Advanced freelancer search and filtering
* AI-based freelancer recommendations
* Reputation system
* Escrow smart contracts
* Milestone-based payments
* Dispute resolution through smart contracts
* Decentralized identity
* IPFS-based file storage
* Advanced notifications
* Mobile application
* Multi-chain blockchain support
* Automated invoice generation

---

## 📚 Academic Project

**Project:** FreelanceChain
**Semester:** 3
**Project Type:** Full-Stack / Blockchain Application

### Core Concepts

* Full-Stack Web Development
* MERN Stack
* REST API
* Real-Time Communication
* Database Management
* Blockchain
* Smart Contracts
* Web3 Integration

---

## 👨‍💻 Contributors

**Sonu / ITZSONU**

GitHub:

https://github.com/itzsonu

Repository:

https://github.com/itzsonu/FreelanceChain_Sem3

---

## 📄 License

This project is developed for educational and academic purposes.
