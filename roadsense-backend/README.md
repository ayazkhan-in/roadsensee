# RoadSense Backend

Node.js + Express backend for the RoadSense application.

## Tech Stack

- Node.js
- Express.js
- CORS
- Helmet
- Morgan
- dotenv

## Setup

1. Install dependencies:
   npm install

2. Copy environment template:
   copy .env.example .env

3. Start server (development):
   npm run dev

4. Start server (production):
   npm start

## API Endpoints

- GET / -> Welcome message
- GET /api/v1/health -> Health status

## Folder Structure

src/
- app.js
- server.js
- config/env.js
- routes/
- middlewares/
