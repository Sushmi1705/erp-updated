# Precision ERP — Master Portal Documentation Index
**Laxmi Balaji Automotive Products (LBAP) / Precision Auto Components Pvt Ltd**
*Sheet-Metal Stamping, Press Tools, Robotic Welding & Sub-Assemblies*

---

## 📌 Executive Portal Matrix & Login Reference

Each portal in Precision ERP represents a real, distinct persona in an automotive component manufacturing enterprise. Navigation menus, action buttons, and data views dynamically adjust according to strict Role-Based Access Control (RBAC):

| File Link | Portal Name | Login Email | Default Password | Primary Target Client Audience |
|---|---|---|---|---|
| [01. Super Admin Portal](./01_Super_Admin_Portal.md) | **Super Admin** | `admin@example.com` | `password123` | Managing Director, CIO, Head of IT |
| [02. Sales Executive Portal](./02_Sales_Executive_Portal.md) | **Sales Executive** | `sales.exec@lbap.in` | `password123` | Commercial Director, Sales Head, Key Accounts |
| [03. Purchase Officer Portal](./03_Purchase_Officer_Portal.md) | **Purchase Officer** | `purchase.officer@lbap.in` | `password123` | SCM Head, Procurement Manager, Sourcing Team |
| [04. Store Keeper Portal](./04_Store_Keeper_Portal.md) | **Store Keeper** | `store.keeper@lbap.in` | `password123` | Warehouse Manager, Inventory Controller, Gate Inward |
| [05. Production Planner Portal](./05_Production_Planner_Portal.md) | **Production Planner**| `production.planner@lbap.in` | `password123` | Head of PPC, Operations Planners, Industrial Engineers |
| [06. Shop Floor Supervisor Portal](./06_Shop_Floor_Supervisor_Portal.md) | **Shop Floor Supervisor**| `shopfloor.supervisor@lbap.in`| `password123` | Shift In-Charges, Press Shop Leaders, Plant Managers |
| [07. Quality Inspector Portal](./07_Quality_Inspector_Portal.md) | **Quality Inspector** | `quality.inspector@lbap.in` | `password123` | QA/QC Head, IATF 16949 Auditors, Quality Engineers |
| [08. Maintenance Engineer Portal](./08_Maintenance_Engineer_Portal.md)| **Maintenance Engineer**| `maintenance.engineer@lbap.in`| `password123` | Maintenance Head, Tool Room Manager, Reliability Team |
| [09. Dispatch Coordinator Portal](./09_Dispatch_Coordinator_Portal.md)| **Dispatch Coordinator**| `dispatch.coordinator@lbap.in`| `password123` | Logistics Head, Shipping In-Charges, Fleet Managers |
| [10. Accounts Executive Portal](./10_Accounts_Executive_Portal.md) | **Accounts Executive**| `accounts.executive@lbap.in` | `password123` | CFO, Finance Controller, Senior Accountants |
| [11. Plant Manager Portal](./11_Plant_Manager_Portal.md) | **Plant Manager** | `plant.manager@lbap.in` | `password123` | General Manager, VP Operations, Factory Head |

---

## 🚀 How to Run the Live Demo for Clients

1. **Open the Web Application:**
   - URL: [http://localhost:5173/login](http://localhost:5173/login)
2. **Accessing Portals Instantly:**
   - Under the login box, click **"Quick sign-in — see the app as a role"**.
   - Click any role button to instantly sign in without typing passwords.
3. **Switching Portals During a Presentation:**
   - Click the user profile badge at the top-right of the header and select **Log out**, or return to `/login` to switch personas.
4. **Recommended Presentation Narrative:**
   - Tell a continuous end-to-end manufacturing story:
     - **Sales** receives an order for 25,000 stamped brackets and schedules weekly deliveries.
     - **PPC (Production Planner)** runs MRP, detects a shortage of 2.0mm steel coil, and releases Work Orders.
     - **Purchase** floats an RFQ and issues a PO to a steel service center.
     - **Store** receives the coil at the gate, logs the Mill Heat Number, and stages it for inspection.
     - **Quality** inspects the coil hardness and thickness and clears it into active stock.
     - **Shop Floor** sets up the progressive die, runs the press, books good strokes, and logs 15 minutes of downtime.
     - **Dispatch** packages the finished brackets, generates a Delivery Challan with truck number, and ships them to the OEM.
     - **Accounts** converts the Delivery Challan into a GST Tax Invoice and verifies the supplier bill via 3-way matching.
