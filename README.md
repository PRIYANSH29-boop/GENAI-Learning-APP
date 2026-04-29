# GenAI Learning DApp

A hybrid decentralised application for blockchain-verified Generative AI education.

Built for CN6035 — Mobile and Distributed Systems, University of East London.

## Tech Stack
- React 19 + Vite — Frontend
- Node.js + Express + MongoDB — Backend
- Solidity 0.8.28 + Hardhat — Blockchain

## How to Run

**Terminal 1 — Start blockchain**
cd backend
npx hardhat node

**Terminal 2 — Deploy contract**
cd backend
npx hardhat ignition deploy ignition/modules/LearningTracker.ts --network localhost

**Terminal 3 — Start MongoDB**
mongod

**Terminal 4 — Start server**
cd server
npm install
npm start

**Terminal 5 — Start frontend**
cd frontend
npm install
npm run dev

Open http://localhost:5175 in your browser.

## Features
- User registration with email verification
- 21 Generative AI lessons from Microsoft open-source curriculum
- Blockchain-verified lesson completions on Ethereum
- On-chain certificate issuance after completing all 21 lessons
- User profile management
- Platform statistics dashboard

## Project Structure
- backend/ — Hardhat project with LearningTracker.sol smart contract
- server/ — Express REST API with MongoDB database
- frontend/ — React application
