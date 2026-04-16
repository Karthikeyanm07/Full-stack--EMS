# Backend Security & Logic Audit Report

Full audit of the EMS backend covering **vulnerabilities**, **date/time bugs**, **calculation errors**, **edge cases**, and **logic issues** across all files.

---

## 🔴 CRITICAL — Security Vulnerabilities

### 1. MongoDB Credentials & JWT Secret committed to Git
**File:** [.env](file:///e:/My_Owns/Frontend/React/Full-Stack-Project/server/.env)

Your `.env` file contains your **real MongoDB Atlas connection string** (with username & password) and your **JWT secret**. These are checked into Git (there is no `.gitignore` entry for `.env` in the server folder).

- Anyone with access to your repo can read/write/delete your entire database.
- Anyone can forge valid JWT tokens and impersonate any user (including admin).

**Fix:**
- Add `.env` to your `.gitignore` immediately.
- Rotate your MongoDB password on Atlas.
- Generate a new JWT secret.
- If this repo was ever public, consider your database compromised.

---

### 2. CORS is wide open
**File:** [server.js](file:///e:/My_Owns/Frontend/React/Full-Stack-Project/server/server.js) — Line 17

```javascript
app.use(cors());
```

This allows **any website on the internet** to make authenticated API requests to your backend. An attacker's site could make requests using a stolen or auto-attached token.

**Fix:**
```javascript
app.use(cors({ origin: "http://localhost:5173" })); // or your frontend URL
```

---

### 3. No password strength validation on `changePassword`
**File:** [authController.js](file:///e:/My_Owns/Frontend/React/Full-Stack-Project/server/controllers/authController.js) — Lines 84-89

The `changePassword` endpoint checks that `newPassword` is not empty, but does **not** validate its strength. A user can set their password to `"a"` (one character).

The `createEmployeeSchema` enforces `min(8)` for creation, but there's no schema validation on password changes.

**Fix:** Add minimum length check:
```javascript
if (newPassword.length < 8) {
    return res.status(400).json({ success: false, error: "New password must be at least 8 characters." });
}
```

---

### 4. No rate limiting on login endpoint
**File:** [authRoutes.js](file:///e:/My_Owns/Frontend/React/Full-Stack-Project/server/routes/authRoutes.js) — Line 12

The `POST /api/auth/login` endpoint has no rate limiting. An attacker can brute-force passwords with unlimited attempts.

**Fix:** Use `express-rate-limit`:
```javascript
import rateLimit from 'express-rate-limit';
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });
authRoutes.post("/login", loginLimiter, login);
```

---

### 5. `getPayslipById` has no authorization check — any employee can view anyone's payslip
**File:** [payslipController.js](file:///e:/My_Owns/Frontend/React/Full-Stack-Project/server/controllers/payslipController.js) — Lines 99-127

Any authenticated user (employee or admin) can access `GET /api/payslips/:id`. Since payslips contain salary information, **Employee A can view Employee B's payslip** by guessing or enumerating the MongoDB `_id`.

**Fix:** Add an ownership check:
```javascript
// After fetching the payslip
if (session.role !== "ADMIN") {
    const employee = await Employee.findOne({ userId: session.userId });
    if (!employee || payslip.employeeId._id.toString() !== employee._id.toString()) {
        return res.status(403).json({ success: false, error: "Access denied." });
    }
}
```

---

### 6. Admins can clock in/out — but they don't have an Employee record
**File:** [attendanceController.js](file:///e:/My_Owns/Frontend/React/Full-Stack-Project/server/controllers/attendanceController.js) — Lines 6-97

The `clockInOut` and `getAttendance` endpoints use `authenticateToken` middleware (not `protectAdmin`), so both admins and employees can call them. However, the code does `Employee.findOne({ userId: session.userId })` — an admin has no Employee record, so they'll always get a 404 "Employee not found."

This isn't a security hole, but it's a **confusing error** for an admin who accidentally hits this endpoint.

**Fix:** Add an early role check or return a clearer message.

---

## 🟡 HIGH — Date/Time Bugs

### 7. Timezone-dependent attendance date matching will fail in production
**File:** [attendanceController.js](file:///e:/My_Owns/Frontend/React/Full-Stack-Project/server/controllers/attendanceController.js) — Lines 23-28

```javascript
const today = new Date();
today.setHours(0, 0, 0, 0);

const existing = await Attendance.findOne({
    employeeId: employee._id,
    date: today,
});
```

- `setHours(0, 0, 0, 0)` uses the **server's local timezone**.
- MongoDB stores dates in **UTC**.
- If your server runs in UTC (e.g., deployed on AWS/Heroku/Render), and your employees are in IST (UTC+5:30), then at **11:30 PM IST** (which is **6:00 PM UTC the same day**), `today` will be `2026-04-15T18:00:00.000Z` in UTC. But for employees, it's still April 15th.
- At **12:30 AM IST April 16th** (which is **7:00 PM UTC April 15th**), the server thinks it's still April 15th, but the employee expects a new day.

**Result:** Employees cannot clock in at the start of their workday, or their attendance records land on the wrong date.

**Fix:** Normalize all dates to UTC:
```javascript
const now = new Date();
const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
```

---

### 8. `isLate` detection uses server-local time
**File:** [attendanceController.js](file:///e:/My_Owns/Frontend/React/Full-Stack-Project/server/controllers/attendanceController.js) — Lines 34-37

```javascript
const isLate =
    now.getHours() > 9 ||
    (now.getHours() === 9 && (now.getMinutes() > 0 || now.getSeconds() > 0));
```

- `getHours()` returns the **server's local time**, not the employee's local time.
- If the server is in UTC and the office is in IST (UTC+5:30), an employee checking in at 8:30 AM IST (3:00 AM UTC), `getHours()` returns `3`, and they'll **never** be marked late.
- Conversely, if the server is in IST and the office is in a different timezone, results are wrong the other way.

**Fix:** Use `getUTCHours()` and offset by the office timezone, or use a configurable office timezone.

---

### 9. Leave date validation rejects same-day & allows timezone edge-case bypass
**File:** [leaveController.js](file:///e:/My_Owns/Frontend/React/Full-Stack-Project/server/controllers/leaveController.js) — Lines 33-40

```javascript
const today = new Date();
today.setHours(0, 0, 0, 0);
if (new Date(startDate) <= today || new Date(endDate) <= today) {
```

**Bug 1 — Uses `<=` instead of `<`:**
- `today` is set to `2026-04-16T00:00:00` (midnight local).
- If `startDate` is `"2026-04-17"`, `new Date("2026-04-17")` creates `2026-04-17T00:00:00.000Z` (UTC midnight).
- If the server is in IST (UTC+5:30), `today` is `2026-04-15T18:30:00.000Z`, and the comparison works fine.
- But if the server is in UTC, `today` is `2026-04-16T00:00:00.000Z`. A `startDate` of `"2026-04-16"` becomes `2026-04-16T00:00:00.000Z` which **equals** `today`, and `<= today` returns `true` — blocking same-day leave even though it could be valid.

**Bug 2 — `new Date()` parsed multiple times:**
- `new Date(startDate)` is created 3 times (lines 35, 41, 51) and `new Date(endDate)` is created 3 times (lines 35, 41, 52). Parse once and reuse.

**Fix:**
```javascript
const start = new Date(startDate);
const end = new Date(endDate);
if (start < today || end < today) { ... }  // Use < not <=
```

---

### 10. Payslip schema allows invalid month/year combinations
**File:** [schema.js](file:///e:/My_Owns/Frontend/React/Full-Stack-Project/server/schemas/schema.js) — Lines 39-46

```javascript
year: z.coerce.number(),
month: z.coerce.number().min(1).max(12),
```

- **Year has no validation** — you can create a payslip for year `0`, `-500`, `99999`, or `2099`.
- **No duplicate check** — you can create multiple payslips for the same employee, same month, same year.

**Fix:**
```javascript
year: z.coerce.number().min(2000).max(2100),
```
And add a unique compound index on the Payslip model:
```javascript
payslipSchema.index({ employeeId: 1, year: 1, month: 1 }, { unique: true });
```

---

## 🟠 MEDIUM — Logic Errors & Edge Cases

### 11. `profileController.js` — `email` variable is not defined
**File:** [profileController.js](file:///e:/My_Owns/Frontend/React/Full-Stack-Project/server/controllers/profileController.js) — Line 16

```javascript
return res.status(200).json({
    success: true,
    message: "Profile fetched successfully.",
    data: { firstName: "Admin", lastName: "", email },  // ← 'email' is undefined!
});
```

The variable `email` is not destructured or declared anywhere in the `getProfile` function. This will throw a `ReferenceError` at runtime when an admin calls `GET /api/profile`, and the catch block will return a 500 error.

**Fix:**
```javascript
data: { firstName: "Admin", lastName: "", email: session.email },
```

---

### 12. `updateEmployee` allows overwriting `employmentStatus` to any value silently
**File:** [employeeController.js](file:///e:/My_Owns/Frontend/React/Full-Stack-Project/server/controllers/employeeController.js) — Line 174

```javascript
employmentStatus: employeeData.employmentStatus || "ACTIVE",
```

If `employmentStatus` is not provided in the request body, it defaults to `"ACTIVE"`. This means **every update resets the employment status to ACTIVE**, even if the employee was previously deactivated (`INACTIVE`).

An admin could accidentally reactivate a deleted employee just by editing their name.

**Fix:** Only include `employmentStatus` if explicitly provided:
```javascript
...(employeeData.employmentStatus && { employmentStatus: employeeData.employmentStatus }),
```

---

### 13. `deleteEmployee` doesn't deactivate the User account
**File:** [employeeController.js](file:///e:/My_Owns/Frontend/React/Full-Stack-Project/server/controllers/employeeController.js) — Lines 237-269

When an employee is "deleted" (soft delete), only `employee.isDeleted = true` and `employee.employmentStatus = "INACTIVE"` are set. But the corresponding **User record remains fully active**.

This means a deactivated employee can still **log in** successfully. The only protection is the `isDeleted` check in `clockInOut`, `createLeave`, and `updateProfile` — but they can still:
- View their profile
- View their attendance history
- View their payslips
- View their leave applications
- Change their password

**Fix:** Either disable the User record during soft delete, or add `isDeleted` checks to all employee-facing endpoints.

---

### 14. `updateEmployee` doesn't sync email between Employee and User tables
**File:** [employeeController.js](file:///e:/My_Owns/Frontend/React/Full-Stack-Project/server/controllers/employeeController.js) — Lines 162-178 vs 181-198

The Employee record is updated with `email: employeeData.email` (line 167), and the User record is updated only `if (employeeData.email)` (line 183). Since the User model has `lowercase: true` on email, but the Employee model does not — if someone sends `"Admin@Test.com"`:
- Employee stores: `"Admin@Test.com"`
- User stores: `"admin@test.com"`

Now `Employee.email ≠ User.email`, causing data inconsistency. Future lookups by email may fail depending on which collection is queried.

**Fix:** Normalize email to lowercase before saving to both collections, or add `lowercase: true` to the Employee schema's email field too.

---

### 15. Working hours calculation can produce negative values
**File:** [attendanceController.js](file:///e:/My_Owns/Frontend/React/Full-Stack-Project/server/controllers/attendanceController.js) — Lines 52-54

```javascript
const checkTime = new Date(existing.checkIn).getTime();
const diffInMins = now.getTime() - checkTime;
const diffInHours = diffInMins / (1000 * 60 * 60);
```

If the server clock jumps backward (NTP sync, DST changes, manual clock adjustment), or if `checkIn` was stored with a future timestamp due to a timezone bug (see Issue #7), `diffInHours` could be **negative**. Negative working hours would then be saved to the database.

**Fix:** Add a guard:
```javascript
const workingHours = Math.max(0, parseFloat(diffInHours.toFixed(2)));
```

---

### 16. `updateProfile` returns 200 success even if no `bio` field was sent
**File:** [profileController.js](file:///e:/My_Owns/Frontend/React/Full-Stack-Project/server/controllers/profileController.js) — Lines 52-61

```javascript
if (typeof req.body.bio === "string") {
    await Employee.findByIdAndUpdate(employee._id, { bio: req.body.bio });
}
return res.status(200).json({ success: true, message: "Profile updated successfully." });
```

If the request body is `{}` or `{ foo: "bar" }`, the endpoint does **nothing** but still returns "Profile updated successfully." This is misleading.

**Fix:** Either require `bio` or return a different message when nothing was updated.

---

### 17. `createPayslip` doesn't verify the employee exists
**File:** [payslipController.js](file:///e:/My_Owns/Frontend/React/Full-Stack-Project/server/controllers/payslipController.js) — Lines 8-29

The `employeeId` from the request body is passed directly to `Payslip.create()` without checking if the employee exists in the database. An admin could create a payslip for a non-existent or deleted employee.

**Fix:**
```javascript
const employee = await Employee.findById(validData.employeeId);
if (!employee) {
    return res.status(404).json({ success: false, error: "Employee not found." });
}
if (employee.isDeleted) {
    return res.status(400).json({ success: false, error: "Cannot create payslip for a deactivated employee." });
}
```

---

### 18. `netSalary` can be negative
**File:** [payslipController.js](file:///e:/My_Owns/Frontend/React/Full-Stack-Project/server/controllers/payslipController.js) — Lines 12-13

```javascript
const netSalary = validData.basicSalary + validData.allowances - validData.deductions;
```

If `deductions` is greater than `basicSalary + allowances`, the `netSalary` will be negative. There's no validation to prevent this.

**Fix:**
```javascript
if (netSalary < 0) {
    return res.status(400).json({ success: false, error: "Deductions cannot exceed total salary." });
}
```

---

### 19. `payslipSchema` doesn't validate that `basicSalary` is positive
**File:** [schema.js](file:///e:/My_Owns/Frontend/React/Full-Stack-Project/server/schemas/schema.js) — Line 43

```javascript
basicSalary: z.coerce.number(),
```

Unlike `createEmployeeSchema` which has `.positive()`, the payslip schema allows `0` or negative values for `basicSalary`.

**Fix:**
```javascript
basicSalary: z.coerce.number().positive("Basic salary must be greater than 0"),
```

---

## 🔵 LOW — Minor Issues

### 20. `server.js` uses top-level `await` without error handling
**File:** [server.js](file:///e:/My_Owns/Frontend/React/Full-Stack-Project/server/server.js) — Line 30

```javascript
await connectDB();
```

If the database connection fails, `connectDB` catches the error and logs it — but the server **still starts** and begins accepting requests. All database operations will then fail with confusing errors.

**Fix:** Exit the process or don't start the server if DB connection fails:
```javascript
try {
    await connectDB();
    app.listen(PORT, () => console.log(`Server running on port: ${PORT}`));
} catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
}
```

---

### 21. `profileRoutes.js` uses POST instead of PUT for update
**File:** [profileRoutes.js](file:///e:/My_Owns/Frontend/React/Full-Stack-Project/server/routes/profileRoutes.js) — Line 8

```javascript
profileRoutes.post("/", authenticateToken, updateProfile);
```

The comment in the controller says `// PUT /api/profile`, but the route is defined as `POST`. Use `PUT` or `PATCH` for update operations.

---

### 22. `deleteEmployee` doesn't end session in `finally` block
**File:** [employeeController.js](file:///e:/My_Owns/Frontend/React/Full-Stack-Project/server/controllers/employeeController.js) — Lines 237-269

Unlike `createEmployee` and `updateEmployee`, the `deleteEmployee` function does not have a `finally { session.endSession() }` block. The MongoDB session may leak.

**Fix:** Add a `finally` block:
```javascript
} finally {
    session.endSession();
}
```

---

### 23. `multer().none()` applied globally
**File:** [server.js](file:///e:/My_Owns/Frontend/React/Full-Stack-Project/server/server.js) — Line 19

```javascript
app.use(multer().none());
```

`multer().none()` is applied to **every route**, even those that don't accept `multipart/form-data`. This means:
- If any route accidentally receives a file upload, multer will throw an error.
- It adds unnecessary overhead to JSON-only routes.

**Fix:** Only apply multer to routes that need it, or remove it if all routes use JSON.

---

### 24. `leaveController.js` import uses different casing than the filename
**File:** [leaveController.js](file:///e:/My_Owns/Frontend/React/Full-Stack-Project/server/controllers/leaveController.js) — Line 2

```javascript
import LeaveApplication from "../models/leaveApplication.js";
```

But the actual filename is `LeaveApplication.js` (capital L, capital A). On **Linux/Mac** (production servers), this import **will fail** because the filesystem is case-sensitive. It works on Windows only because Windows's filesystem is case-insensitive.

**Fix:** Change the import to match the exact filename:
```javascript
import LeaveApplication from "../models/LeaveApplication.js";
```

---

### 25. `package.json` has both `"types": "module"` and `"type": "module"`
**File:** [package.json](file:///e:/My_Owns/Frontend/React/Full-Stack-Project/server/package.json) — Lines 6 & 14

```json
"types": "module",
"type": "module",
```

`"types"` is a TypeScript-related field and doesn't do anything here. Only `"type": "module"` is needed for ESM. Remove `"types"` to avoid confusion.

---

## Summary Table

| # | Severity | Category | File | Issue |
|---|---|---|---|---|
| 1 | 🔴 Critical | Security | `.env` | DB credentials & JWT secret in Git |
| 2 | 🔴 Critical | Security | `server.js` | CORS allows all origins |
| 3 | 🔴 Critical | Security | `authController.js` | No password strength check on change |
| 4 | 🔴 Critical | Security | `authRoutes.js` | No rate limiting on login |
| 5 | 🔴 Critical | Security | `payslipController.js` | Any employee can view any payslip |
| 6 | 🟡 Medium | Logic | `attendanceController.js` | Admins get confusing 404 on attendance |
| 7 | 🟡 High | DateTime | `attendanceController.js` | Timezone-dependent date matching |
| 8 | 🟡 High | DateTime | `attendanceController.js` | `isLate` uses server-local time |
| 9 | 🟡 High | DateTime | `leaveController.js` | `<=` blocks valid dates; timezone bug |
| 10 | 🟡 High | Validation | `schema.js` / `Payslip.js` | No year validation; duplicate payslips |
| 11 | 🟠 Medium | Bug | `profileController.js` | `email` variable undefined — **crashes** |
| 12 | 🟠 Medium | Logic | `employeeController.js` | Update resets `employmentStatus` to ACTIVE |
| 13 | 🟠 Medium | Logic | `employeeController.js` | Soft delete doesn't disable User login |
| 14 | 🟠 Medium | Data | `employeeController.js` | Email case mismatch between collections |
| 15 | 🟠 Medium | Calculation | `attendanceController.js` | Working hours can be negative |
| 16 | 🟠 Medium | Logic | `profileController.js` | Returns success even when nothing updated |
| 17 | 🟠 Medium | Validation | `payslipController.js` | No employee existence check |
| 18 | 🟠 Medium | Calculation | `payslipController.js` | Net salary can be negative |
| 19 | 🟠 Medium | Validation | `schema.js` | Payslip `basicSalary` allows 0/negative |
| 20 | 🔵 Low | Reliability | `server.js` | Server starts even if DB fails |
| 21 | 🔵 Low | Convention | `profileRoutes.js` | POST used instead of PUT for update |
| 22 | 🔵 Low | Resource | `employeeController.js` | Missing `session.endSession()` in delete |
| 23 | 🔵 Low | Performance | `server.js` | Multer applied globally |
| 24 | 🔵 Low | Portability | `leaveController.js` | Case-sensitive import will fail on Linux |
| 25 | 🔵 Low | Config | `package.json` | Duplicate `types`/`type` field |
