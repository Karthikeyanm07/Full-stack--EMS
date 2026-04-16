# API Response Standardization Guide

> This document defines the **recommended standardized response format** for every controller function and middleware in the EMS backend.
> Use this as a reference when refactoring your controllers.

---

## Standard Response Envelope

All responses should follow this structure:

```json
// ✅ Success
{ "success": true, "message": "Descriptive message", "data": { ... } }

// ❌ Error
{ "success": false, "error": "Descriptive error message" }

// ❌ Validation Error (Zod)
{ "success": false, "errors": [ { "field": "email", "message": "Invalid email", "code": "invalid_string" } ] }
```

---

## Middleware — `auth.js`

### `authenticateToken`

| Scenario | Status | Current Response | Recommended Response |
|---|---|---|---|
| Missing/malformed `Authorization` header | `401` | `{ error: "Unauthorized" }` | `{ success: false, error: "Authentication required. Please provide a valid token." }` |
| `jwt.verify` returns falsy | `401` | `{ error: "Unauthorized" }` | `{ success: false, error: "Invalid or expired token. Please log in again." }` |
| Token verification throws (expired/invalid) | `403` | `{ error: "Invalid token" }` | `{ success: false, error: "Token is invalid or has expired. Please log in again." }` |

### `protectAdmin`

| Scenario | Status | Current Response | Recommended Response |
|---|---|---|---|
| User role is not `ADMIN` | `403` | `{ error: "Admin access required" }` | `{ success: false, error: "Admin access required." }` |

---

## `authController.js`

### `login` — `POST /api/auth/login`

| Scenario | Status | Current Response | Recommended Response |
|---|---|---|---|
| Missing email or password | `400` | `{ error: "Email and Password required" }` | `{ success: false, error: "Email and password are required." }` |
| User not found | `401` | `{ error: "Invalid credentials" }` | `{ success: false, error: "Invalid credentials." }` |
| Wrong password | `401` | `{ error: "Invalid credentials!" }` | `{ success: false, error: "Invalid credentials." }` |
| Role mismatch (admin) | `401` | `{ error: "Not authorized as Admin" }` | `{ success: false, error: "Not authorized as admin." }` |
| Role mismatch (employee) | `401` | `{ error: "Not authorized as Employee" }` | `{ success: false, error: "Not authorized as employee." }` |
| ✅ Login success | `200` | `{ success: true, user: payload, token }` | `{ success: true, message: "Login successful.", data: { user: payload, token } }` |
| Server error | `500` | `{ error: "Login failed. Please try again." }` | `{ success: false, error: "Login failed. Please try again." }` |

### `session` — `GET /api/auth/session`

| Scenario | Status | Current Response | Recommended Response |
|---|---|---|---|
| ✅ Return session | `200` | `{ user: session }` | `{ success: true, message: "Session retrieved successfully.", data: { user: session } }` |

### `changePassword` — `POST /api/auth/change-password`

| Scenario | Status | Current Response | Recommended Response |
|---|---|---|---|
| Missing fields | `400` | `{ error: "Current password and new password are required" }` | `{ success: false, error: "Current password and new password are required." }` |
| User not found | `404` | `{ error: "User not found" }` | `{ success: false, error: "User not found." }` |
| Current password wrong | `400` | `{ error: "Current password is incorrect" }` | `{ success: false, error: "Current password is incorrect." }` |
| ✅ Password changed | `200` | `{ success: true, message: "Password changed successfully" }` | `{ success: true, message: "Password changed successfully." }` |
| Server error | `500` | `{ error: "Failed to change password. Please try again." }` | `{ success: false, error: "Failed to change password. Please try again." }` |

---

## `attendanceController.js`

### `clockInOut` — `POST /api/attendance`

| Scenario | Status | Current Response | Recommended Response |
|---|---|---|---|
| Employee not found | `404` | `{ error: "Employee not found" }` | `{ success: false, error: "Employee not found." }` |
| Account deactivated | `403` | `{ error: "Your account is deactivated, you cannot Clock in/out" }` | `{ success: false, error: "Your account is deactivated. You cannot clock in or out." }` |
| ✅ Clock In | `200` | `{ success: true, type: "CHECK_IN", date: attendance }` | `{ success: true, message: "Checked in successfully.", data: { type: "CHECK_IN", attendance } }` |
| ✅ Clock Out | `200` | `{ success: true, type: "CHECK_OUT", data: existing }` | `{ success: true, message: "Checked out successfully.", data: { type: "CHECK_OUT", attendance: existing } }` |
| ✅ Already checked out | `200` | `{ success: true, type: "CHECK_OUT", data: existing }` | `{ success: true, message: "Already checked out for today.", data: { type: "CHECK_OUT", attendance: existing } }` |
| Server error | `500` | `{ error: "Operation failed" }` | `{ success: false, error: "Attendance operation failed. Please try again." }` |

> [!CAUTION]
> **Bug on Line 46:** The current response uses `date: attendance` instead of `data: attendance`. This is a typo that could break the frontend.

### `getAttendance` — `GET /api/attendance`

| Scenario | Status | Current Response | Recommended Response |
|---|---|---|---|
| Employee not found | `404` | `{ error: "Employee not found" }` | `{ success: false, error: "Employee not found." }` |
| ✅ Return attendance | `200` | `{ data: history, employee: { isDeleted } }` | `{ success: true, message: "Attendance records fetched successfully.", data: { history, employee: { isDeleted } } }` |
| Server error | `500` | `{ error: "Failed to fetch attendance" }` | `{ success: false, error: "Failed to fetch attendance records." }` |

---

## `employeeController.js`

### `getEmployees` — `GET /api/employees`

| Scenario | Status | Current Response | Recommended Response |
|---|---|---|---|
| ✅ Return employees | `200` | `result` (raw array) | `{ success: true, message: "Employees fetched successfully.", data: result }` |
| Server error | `500` | `` { error: `Failed to fetch employees, ${error.message}` } `` | `{ success: false, error: "Failed to fetch employees." }` |

> [!WARNING]
> **Security risk on Line 38:** Exposing `error.message` to the client could leak internal details (e.g., database connection strings, model paths). Use a generic message instead.

### `createEmployee` — `POST /api/employees`

| Scenario | Status | Current Response | Recommended Response |
|---|---|---|---|
| Email already exists (manual check) | `400` | `{ error: "Email already exists" }` | `{ success: false, error: "Email already exists." }` |
| Zod validation error | `400` | `{ errors: formattedErrors }` | `{ success: false, errors: formattedErrors }` |
| Duplicate key error (MongoDB 11000) | `400` | `{ error: "Email already exists" }` | `{ success: false, error: "Email already exists." }` |
| ✅ Employee created | `201` | `{ success: true, employee: employee[0] }` | `{ success: true, message: "Employee created successfully.", data: { employee: employee[0] } }` |
| Server error | `500` | `{ error: "Failed to create employee" }` | `{ success: false, error: "Failed to create employee." }` |

### `updateEmployee` — `PUT /api/employees/:id`

| Scenario | Status | Current Response | Recommended Response |
|---|---|---|---|
| Employee not found | `404` | `{ error: "Employee not found" }` | `{ success: false, error: "Employee not found." }` |
| Zod validation error | `400` | `{ errors: formattedErrors }` | `{ success: false, errors: formattedErrors }` |
| Duplicate key error | `400` | `{ error: "Email already exists" }` | `{ success: false, error: "Email already exists." }` |
| ✅ Employee updated | `200` | `{ success: true }` | `{ success: true, message: "Employee updated successfully." }` |
| Server error | `500` | `{ error: "Failed to update employee details" }` | `{ success: false, error: "Failed to update employee details." }` |

### `deleteEmployee` — `DELETE /api/employees/:id`

| Scenario | Status | Current Response | Recommended Response |
|---|---|---|---|
| Employee not found | `404` | `{ error: "Employee not found!" }` | `{ success: false, error: "Employee not found." }` |
| ✅ Employee deleted (soft) | `200` | `{ success: true }` | `{ success: true, message: "Employee deactivated successfully." }` |
| Server error | `500` | `{ error: "Failed to delete employee" }` | `{ success: false, error: "Failed to deactivate employee." }` |

> [!TIP]
> Since this is a **soft delete** (setting `isDeleted: true`), the message should say "deactivated" rather than "deleted" to avoid confusing the admin.

---

## `leaveController.js`

### `createLeave` — `POST /api/leaves`

| Scenario | Status | Current Response | Recommended Response |
|---|---|---|---|
| Employee not found | `404` | `{ error: "Employee not found" }` | `{ success: false, error: "Employee not found." }` |
| Account deactivated | `403` | `{ error: "Your account is deactivated. You cannot apply for leave" }` | `{ success: false, error: "Your account is deactivated. You cannot apply for leave." }` |
| Missing fields | `400` | `{ error: "Missing fields" }` | `{ success: false, error: "All fields are required: type, start date, end date, and reason." }` |
| Dates not in future | `400` | `{ error: "Leave dates must be in the future" }` | `{ success: false, error: "Leave dates must be in the future." }` |
| End date before start date | `400` | `{ error: "End date cannot be before start date" }` | `{ success: false, error: "End date cannot be before start date." }` |
| ✅ Leave created | `200` | `{ success: true, data: leave }` | `{ success: true, message: "Leave application submitted successfully.", data: leave }` |
| Server error | `500` | `{ error: "Failed" }` | `{ success: false, error: "Failed to submit leave application." }` |

> [!WARNING]
> **Line 51:** The current error message `"Failed"` is extremely vague and unhelpful to the frontend or user. Always provide context.

### `getLeaves` — `GET /api/leaves`

| Scenario | Status | Current Response (Admin) | Recommended Response (Admin) |
|---|---|---|---|
| ✅ Return all leaves | `200` | `{ data }` | `{ success: true, message: "Leave applications fetched successfully.", data }` |

| Scenario | Status | Current Response (Employee) | Recommended Response (Employee) |
|---|---|---|---|
| Employee not found | `404` | `{ error: "Not found" }` | `{ success: false, error: "Employee not found." }` |
| ✅ Return employee leaves | `200` | `{ data: leaves, employee }` | `{ success: true, message: "Leave applications fetched successfully.", data: { leaves, employee } }` |

| Scenario | Status | Current Response | Recommended Response |
|---|---|---|---|
| Server error | `500` | `{ error: "Failed" }` | `{ success: false, error: "Failed to fetch leave applications." }` |

### `updateLeaveStatus` — `PUT /api/leaves/:id`

| Scenario | Status | Current Response | Recommended Response |
|---|---|---|---|
| Not admin | `403` | `{ error: "Unauthorized" }` | `{ success: false, error: "Only admins can update leave status." }` |
| Invalid status value | `400` | `{ error: "Invalid status" }` | `{ success: false, error: "Invalid status. Must be APPROVED, REJECTED, or PENDING." }` |
| Leave not found | `404` | `{ error: "Leave application not found" }` | `{ success: false, error: "Leave application not found." }` |
| ✅ Status updated | `200` | `{ success: true, data: leave }` | `{ success: true, message: "Leave status updated successfully.", data: leave }` |
| Server error | `500` | `{ error: "Failed" }` | `{ success: false, error: "Failed to update leave status." }` |

> [!NOTE]
> **Comment typo on Line 105:** The comment says `// GET /api/leaves/:id` but the actual HTTP method used in routes is `PUT` or `PATCH`.

---

## `payslipController.js`

### `createPayslip` — `POST /api/payslips`

| Scenario | Status | Current Response | Recommended Response |
|---|---|---|---|
| Zod validation error | `400` | `{ errors: error.issues }` | `{ success: false, errors: error.issues }` |
| ✅ Payslip created | `200` | `{ success: true, data: payslip }` | `{ success: true, message: "Payslip created successfully.", data: payslip }` |
| Server error | `500` | `{ error: "Failed to create payslip" }` | `{ success: false, error: "Failed to create payslip." }` |

> [!TIP]
> Consider returning status `201` (Created) instead of `200` for successful payslip creation — same as `createEmployee`.

### `getPayslips` — `GET /api/payslips`

| Scenario | Status | Current Response (Admin) | Recommended Response (Admin) |
|---|---|---|---|
| ✅ Return all payslips | `200` | `{ data }` | `{ success: true, message: "Payslips fetched successfully.", data }` |

| Scenario | Status | Current Response (Employee) | Recommended Response (Employee) |
|---|---|---|---|
| Employee not found | `404` | `{ error: "Not found" }` | `{ success: false, error: "Employee not found." }` |
| ✅ Return employee payslips | `200` | `{ data: payslips }` | `{ success: true, message: "Payslips fetched successfully.", data: payslips }` |

| Scenario | Status | Current Response | Recommended Response |
|---|---|---|---|
| Server error | `500` | `{ error: "Failed to get Payslips" }` | `{ success: false, error: "Failed to fetch payslips." }` |

### `getPayslipById` — `GET /api/payslips/:id`

| Scenario | Status | Current Response | Recommended Response |
|---|---|---|---|
| Payslip not found | `404` | `{ error: "Not found" }` | `{ success: false, error: "Payslip not found." }` |
| ✅ Return payslip | `200` | `result` (raw object) | `{ success: true, message: "Payslip fetched successfully.", data: result }` |
| Server error | `500` | `{ error: "Failed to get Payslip" }` | `{ success: false, error: "Failed to fetch payslip." }` |

> [!NOTE]
> **Comment typo on Line 78:** The comment says `// POST /api/payslips/:id` but the route in `payslipRoutes.js` is actually `GET`.

---

## `profileController.js`

### `getProfile` — `GET /api/profile`

| Scenario | Status | Current Response | Recommended Response |
|---|---|---|---|
| ✅ Admin profile (no employee record) | `200` | `{ firstName: "Admin", lastName: "", email }` | `{ success: true, message: "Profile fetched successfully.", data: { firstName: "Admin", lastName: "", email } }` |
| ✅ Employee profile | `200` | `employee` (raw object) | `{ success: true, message: "Profile fetched successfully.", data: employee }` |
| Server error | `500` | `{ error: "Failed to fetch profile" }` | `{ success: false, error: "Failed to fetch profile." }` |

### `updateProfile` — `PUT /api/profile`

| Scenario | Status | Current Response | Recommended Response |
|---|---|---|---|
| Employee not found | `404` | `{ error: "Employee not found" }` | `{ success: false, error: "Employee not found." }` |
| Account deactivated | `403` | `{ error: "Your account is deactivated. You cannot update your profile" }` | `{ success: false, error: "Your account is deactivated. You cannot update your profile." }` |
| ✅ Profile updated | `200` | `{ success: true, message: "Updated successfully" }` | `{ success: true, message: "Profile updated successfully." }` |
| Server error | `500` | `{ error: "Failed to update profile" }` | `{ success: false, error: "Failed to update profile." }` |

---

## Summary of Key Changes

| # | Change Type | Count |
|---|---|---|
| 1 | Missing `success: false` in error responses | **~30** |
| 2 | Missing `success: true` in success responses | **~8** |
| 3 | Missing `message` in success responses | **~12** |
| 4 | Raw data returned without envelope wrapper | **~5** |
| 5 | Vague error messages (`"Failed"`, `"Not found"`) | **~6** |
| 6 | Inconsistent punctuation (trailing `.` or `!`) | **~4** |
| 7 | Grammar/phrasing issues | **~3** |
| 8 | Comment typos (wrong HTTP method) | **~2** |
| 9 | Code typo (`date` → `data`) | **1** |
| 10 | Security risk (leaking `error.message`) | **1** |
