I'm building Elimu HMS, a school management system for Kenyan high schools.

CURRENT STATE:
- Backend: FastAPI + SQLAlchemy + JWT auth working
- Frontend: React + Vite + TailwindCSS
- Auth flow complete (staff signup/login)
- Basic models exist: Staff, Student, Grade, Budget, Inventory

WHAT I NEED YOU TO BUILD NEXT:

Build a complete Fee Management module with these features:

BACKEND:
1. Create models in backend/models/fees.py:
   - FeeStructure (fee types per grade/term)
   - StudentFee (tracks what each student owes)
   - Payment (records all payments)
   - Include relationships to existing Student model

2. Create schemas in backend/schemas/fees.py for request/response validation

3. Create CRUD operations in backend/crud/fees.py:
   - Create fee structures
   - Assign fees to students by grade
   - Record payments (cash, M-Pesa, bank)
   - Calculate student balances
   - Generate receipt numbers

4. Create router in backend/routers/fees.py with endpoints:
   - POST /api/fees/structures (create fee structure)
   - GET /api/fees/structures (list all)
   - POST /api/fees/assign/{fee_id}/{grade} (assign to students)
   - POST /api/fees/payments (record payment)
   - GET /api/fees/balance/{student_id} (get balance)
   - GET /api/fees/defaulters (list students with outstanding fees)

5. Register the router in backend/main.py

6. Create Alembic migration for new tables

FRONTEND:
1. Create fee API service in frontend/src/api/fees.js

2. Create pages in frontend/src/pages/:
   - FeeStructures.jsx (manage fee types)
   - RecordPayment.jsx (record student payments)
   - FeeBalances.jsx (view all student balances)

3. Add navigation links to the dashboard

KENYAN-SPECIFIC REQUIREMENTS:
- Support term-based billing (3 terms per year)
- Receipt numbers format: RCP-XXXXXXXX
- Payment methods: Cash, M-Pesa, Bank Transfer, Cheque
- Track M-Pesa transaction codes
- Show balances clearly (what's owed vs what's paid)

Start with the backend models and work your way up. Use the existing code patterns from the Staff/Student modules.