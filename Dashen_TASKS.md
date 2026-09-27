# DASHENQA — IMPLEMENTATION TASKS

## IMPORTANT

Implement tasks sequentially.

Only ONE task may be implemented at a time.

After every task:

Implement
↓
Test
↓
Verify
↓
Report
↓
STOP

Do not continue automatically to the next task.

---

# PHASE 1 — INSPECTION

## TASK 1 — PROJECT INSPECTION

Inspect the new DashenQA project.

Inspect:

- Frontend
- Backend
- API
- Database
- Authentication
- Telegram integration
- Environment configuration
- Existing services
- Existing routes
- Existing components
- Existing database schema

Do NOT implement new functionality.

Do NOT redesign anything.

Do NOT modify unrelated files.

Produce an inspection report.

STOP.

---

# PHASE 2 — QA LEAD PORTAL

## TASK 2 — QA LEAD AUTHENTICATION

Implement only QA Lead authentication.

Requirements:

- Login
- Secure password hashing
- Protected routes
- Secure session/JWT
- Backend authorization
- Logout

Do not implement other features.

Test authentication.

STOP.

---

## TASK 3 — QA LEAD DASHBOARD

Implement only the QA Lead dashboard.

Show:

- Total projects
- Active projects
- Total testers
- Pending testers
- Today's check-ins
- Missing check-ins
- Open blockers
- Project progress
- Module progress
- Workload
- Readiness

Do not implement Telegram functionality.

STOP.

---

## TASK 4 — PROJECT MANAGEMENT

Implement:

- Create project
- View project
- Edit project
- Project status
- Product owner
- Start date
- Deadline
- Description
- PRD
- Figma

Do not implement tester assignment yet.

STOP.

---

## TASK 5 — SUB-PROJECTS AND MODULES

Implement:

Project
↓
Sub-project
↓
Module

Allow QA Lead to:

- Create sub-project
- Edit sub-project
- Create module
- Edit module
- View modules

Do not implement tester assignment yet.

STOP.

---

## TASK 6 — TESTER MANAGEMENT

Implement the QA Lead tester management section.

Show:

- Tester name
- Telegram ID
- Registration date
- Registration status
- Assignment status
- Assigned projects
- Assigned modules
- Last check-in

Include:

PENDING TESTERS

Do not implement daily check-in yet.

STOP.

---

## TASK 7 — TESTER ASSIGNMENT

Implement:

Tester
↓
Project
↓
Sub-project
↓
Module

The QA Lead must be able to assign a tester.

Save the assignment in the database.

Test:

- Assignment creation
- Assignment visibility
- Multiple project assignments
- Multiple module assignments
- Assignment removal

STOP.

---

# PHASE 3 — TELEGRAM REGISTRATION

## TASK 8 — NEW TESTER REGISTRATION

Implement Telegram registration.

Flow:

/start
↓
Ask full name
↓
Create tester
↓
PENDING_ASSIGNMENT
↓
Confirmation

Use Telegram user ID as the unique identity.

Prevent duplicate tester records.

Do not implement project assignment in this task.

STOP.

---

# PHASE 4 — ASSIGNMENT NOTIFICATION

## TASK 9 — PROJECT ASSIGNMENT NOTIFICATION

When the QA Lead assigns a tester:

Send a Telegram notification.

Include:

- Project
- Module
- PRD
- Figma

Test:

- Correct tester receives notification
- Incorrect testers do not receive notification
- Correct project appears
- Correct module appears
- PRD is correct
- Figma is correct

STOP.

---

# PHASE 5 — TELEGRAM PROJECT ACCESS

## TASK 10 — ASSIGNED PROJECT SELECTION

Implement project selection through Telegram.

When the tester starts the relevant flow:

Show only projects assigned to that tester.

Test:

- Assigned project appears
- Unassigned project does not appear
- Backend rejects unauthorized project access

STOP.

---

## TASK 11 — ASSIGNED MODULE SELECTION

After project selection:

Show only modules assigned to that tester under that project.

Test:

- Assigned module appears
- Unassigned module does not appear
- Backend rejects unauthorized module access

STOP.

---

# PHASE 6 — DAILY CHECK-IN

## TASK 12 — DAILY QA CHECK-IN

Implement:

/checkin

Flow:

Project
↓
Module
↓
Work completed
↓
Blocker
↓
Blocker details if applicable
↓
Next plan
↓
Achievement
↓
Executed
↓
Passed
↓
Failed
↓
Blocked
↓
Confirmation

Store:

- Tester
- Telegram ID
- Project
- Module
- Date
- Ethiopia local timestamp
- Work
- Blocker
- Blocker description
- Next plan
- Achievement
- Executed
- Passed
- Failed
- Blocked

Test all fields.

STOP.

---

# PHASE 7 — DAILY REMINDER

## TASK 13 — 11:30 AM CHECK-IN REMINDER

Implement automatic daily reminder.

Time:

11:30 AM

Timezone:

Africa/Addis_Ababa

Send only to:

Active QA Testers

who have NOT completed today's check-in.

Do NOT send to:

- QA Lead
- Inactive testers
- Testers who already checked in

Prevent duplicate reminders.

Test timezone and reminder logic.

STOP.

---

# PHASE 8 — QA LEAD MONITORING

## TASK 14 — CHECK-IN MONITORING

Allow QA Lead to view:

- Tester
- Project
- Module
- Date
- Work completed
- Achievement
- Blocker
- Next plan
- Executed
- Passed
- Failed
- Blocked

Include filtering by:

- Project
- Module
- Tester
- Date
- Status

STOP.

---

## TASK 15 — BLOCKER MANAGEMENT

Allow QA Lead to:

- View blockers
- Filter blockers
- See tester
- See project
- See module
- See blocker description
- Track blocker status
- Resolve blockers

STOP.

---

## TASK 16 — WORKLOAD

Implement workload visibility.

Show workload across all project assignments.

Do not automatically reassign testers.

QA Lead controls assignments.

STOP.

---

## TASK 17 — READINESS

Implement project/module readiness.

Consider:

- Testing progress
- Passed tests
- Failed tests
- Blocked tests
- Critical blockers

A critical blocker can prevent readiness.

Show readiness to the QA Lead.

STOP.

---

# FINAL TESTING

## TASK 18 — END-TO-END VALIDATION

Validate the complete flow:

QA Lead Login
↓
Create Project
↓
Create Sub-project
↓
Create Module
↓
Tester starts Telegram Bot
↓
Tester enters name
↓
Tester becomes PENDING_ASSIGNMENT
↓
QA Lead sees tester
↓
QA Lead assigns tester
↓
Tester receives notification
↓
Tester receives PRD + Figma
↓
11:30 AM Africa/Addis_Ababa
↓
Tester receives reminder
↓
Tester starts /checkin
↓
Tester selects assigned Project
↓
Tester selects assigned Module
↓
Tester submits daily status
↓
QA Lead sees check-in
↓
QA Lead sees blocker/progress/readiness

Test unauthorized project access.

Test unauthorized module access.

Test duplicate registration.

Test duplicate reminder prevention.

Test timezone behavior.

Do not redesign the system during this task.

STOP after reporting results.