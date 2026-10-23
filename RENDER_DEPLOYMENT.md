# Deploying Precision ERP to Render

This repository is pre-configured for automated **1-click deployment** on Render as a unified Web Service (frontend + backend API + auto-seeding).

---

## Method 1: Render Blueprint (Recommended - 1 Click)

1. Log in to [Render.com](https://dashboard.render.com/).
2. In the top right, click **New +** and select **Blueprint**.
3. Connect your GitHub repository:
   ```
   https://github.com/Sushmi1705/erp-updated.git
   ```
4. Render will automatically detect [`render.yaml`](render.yaml) and configure:
   - **Service Name**: `precision-erp`
   - **Environment**: Node
   - **Build Command**: `npm run build` (installs dependencies & builds Vite frontend)
   - **Start Command**: `npm start` (starts the Express server which serves both API and React frontend)
   - **Auto-generated Secrets**: `JWT_SECRET`, `JWT_REFRESH_SECRET`
5. *(Optional)* Add your `MONGODB_URI` connection string (e.g. from MongoDB Atlas free cluster). If left blank, the application will automatically fall back to its embedded database with pre-seeded demo records.
6. Click **Apply**. Render will build and deploy your ERP system live with an HTTPS URL (e.g., `https://precision-erp.onrender.com`).

---

## Method 2: Manual Web Service Setup

If you prefer to configure manually without Blueprint:

1. In Render Dashboard, click **New +** -> **Web Service**.
2. Select your repository `Sushmi1705/erp-updated`.
3. Fill in the deployment settings:
   - **Name**: `precision-erp` (or your preferred name)
   - **Region**: `Oregon (US West)` or `Singapore`
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
4. Under **Environment Variables**, add:
   | Key | Value | Notes |
   | --- | --- | --- |
   | `NODE_ENV` | `production` | Enables production optimizations & static routing |
   | `PORT` | `10000` | Render default web port |
   | `JWT_SECRET` | *(Random 32+ char string)* | Token signing secret |
   | `JWT_REFRESH_SECRET` | *(Random 32+ char string)* | Token refresh secret |
   | `MONGODB_URI` | *(Optional MongoDB Atlas URI)* | Free MongoDB Atlas cluster or leave blank for embedded DB |
5. Click **Create Web Service**.

---

## Default Login Credentials

Once deployed, the database automatically initializes with demo personas and test accounts:

| Role | Email | Password |
| --- | --- | --- |
| **Super Admin** | `admin@example.com` | `password123` |
| **Sales Executive** | `sales.exec@lbap.in` | `password123` |
| **Purchase Officer** | `purchase.officer@lbap.in` | `password123` |
| **Store In-Charge** | `store.incharge@lbap.in` | `password123` |
| **Quality Inspector** | `quality.inspector@lbap.in` | `password123` |
| **Maintenance Engineer** | `maintenance.eng@lbap.in` | `password123` |
| **Finance Controller** | `finance.controller@lbap.in` | `password123` |

---

## Features Included in This Build
- **Unified Deployment**: Express serves both `/api/*` REST endpoints and the React frontend bundle with SPA fallback routing.
- **Master Production Scheduling (MPS)**: Complete with Takt & Gantt Studio, Rough-Cut Capacity Planning (RCCP), and Shop Floor Work Order Dispatch.
- **Automated Sample Data**: Pre-seeded with 4 master production plans and 11 part lines ready for immediate demonstration.
