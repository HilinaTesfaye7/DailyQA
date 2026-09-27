# DASHENQA — MASTER ARCHITECTURE

## 1. SYSTEM PURPOSE

DashenQA is a QA management system with:

1. One QA Lead Web Portal
2. One QA Tester Telegram Bot

The QA Lead manages projects from the web portal.

QA Testers use Telegram for registration, project assignment notifications, daily check-ins, blockers, and progress updates.

This document is the permanent architecture reference for DashenQA.

---

# 2. USER TYPES

There are only TWO user types:

## QA Lead

Uses the Web Portal.

The QA Lead can:

- Login
- Create projects
- Edit projects
- View projects
- Create sub-projects
- Create modules
- View registered testers
- Assign testers
- Remove tester assignments
- Add PRD
- Add Figma
- View check-ins
- View blockers
- View project progress
- View workload
- View readiness
- View reports

## QA Tester

Uses the Telegram Bot.

The QA Tester can:

- Register their name
- Receive registration confirmation
- Wait for assignment
- Receive project assignment notification
- Receive PRD and Figma information
- View assigned projects through Telegram
- Select assigned modules
- Submit daily check-in
- Report blockers
- Submit daily progress
- View their assigned project/module information

QA Testers do NOT need a web portal.

---

# 3. ROLE STRUCTURE

There is NO QA Director.

There is NO multiple QA Lead hierarchy.

There is NO Lead → Lead structure.

There is only:

QA Lead
    ↓
Projects
    ↓
Sub-projects
    ↓
Modules
    ↓
Assigned QA Testers

---

# 4. PROJECT STRUCTURE

DashenQA supports multiple projects.

Example:

QA Lead
│
├── Project A
│   │
│   ├── Sub-project A
│   │   ├── Module 1
│   │   ├── Module 2
│   │   └── Module 3
│   │
│   └── Assigned Testers
│       ├── Tester 1
│       └── Tester 2
│
├── Project B
│   │
│   ├── Sub-project B
│   │   ├── Module 1
│   │   └── Module 2
│   │
│   └── Assigned Testers
│       └── Tester 3
│
└── Project C
    │
    ├── Sub-project C
    └── Assigned Testers

A tester may be assigned to multiple projects.

A project may have multiple testers.

A module may have multiple testers.

---

# 5. QA LEAD WEB PORTAL

There is only ONE web portal.

The portal is exclusively for the QA Lead.

## Dashboard

The dashboard should show:

- Total Projects
- Active Projects
- Total QA Testers
- Assigned Testers
- Pending Testers
- Today's Check-ins
- Missing Check-ins
- Open Blockers
- Project Progress
- Module Progress
- Workload
- Release Readiness

---

# 6. PROJECT INFORMATION

Each project can contain:

- Project name
- Description
- Product owner
- Start date
- Deadline
- PRD
- Figma
- Status
- Sub-projects
- Modules
- Assigned testers

---

# 7. TESTER REGISTRATION

A new Telegram user starts the bot.

Flow:

/start
↓
Ask for full name
↓
Create tester profile
↓
Set status = PENDING_ASSIGNMENT
↓
Send confirmation
↓
Wait for QA Lead assignment

Example:

Bot:

"Welcome to DashenQA 👋

Please enter your full name."

Tester:

"Abel Tesfaye"

Bot:

"Thank you, Abel Tesfaye.

Your registration has been received successfully.

You have not been assigned to a project yet.

Please wait for the QA Lead to assign you to a project.

You will receive a notification when you are assigned."

---

# 8. TESTER IDENTIFICATION

Every Telegram tester must be identified using their Telegram user ID.

Do NOT identify users only by:

- Name
- Username
- Display name

Telegram user ID is the primary Telegram identity.

---

# 9. QA LEAD ASSIGNMENT

The QA Lead can:

1. View registered testers
2. Select a tester
3. Select a project
4. Select a sub-project if applicable
5. Select one or more modules
6. Confirm assignment

The assignment must be saved in the database.

After successful assignment, the tester receives a Telegram notification.

---

# 10. ASSIGNMENT NOTIFICATION

Example:

"🎉 You have been assigned to a project.

Project: Digital Banking

Module: Wallet

PRD:
[PRD LINK]

Figma:
[FIGMA LINK]

Please review the project information before starting your testing activities."

The actual project PRD and Figma information must be used.

---

# 11. TESTER PROJECT ACCESS

A tester can only access projects assigned to them.

Example:

Tester A is assigned:

- Project A
- Project C

Tester A must see:

- Project A
- Project C

Tester A must NOT see:

- Project B
- Any other unassigned project

This restriction must be enforced by the backend.

Telegram button visibility alone is NOT sufficient security.

---

# 12. DAILY CHECK-IN

The tester starts:

/checkin

Flow:

/checkin
↓
Select assigned project
↓
Select assigned module
↓
What did you work on today?
↓
Did you encounter a blocker?
↓
Blocker details if applicable
↓
What is your next plan?
↓
What did you achieve today?
↓
Testing statistics
↓
Confirmation

---

# 13. PROJECT SELECTION

When a tester starts /checkin:

Show only their assigned projects.

Example:

"Select your project:"

[Digital Banking]

[Microfinance]

Do NOT show:

- All projects
- Unassigned projects
- Other testers' projects

The tester should select the project using Telegram buttons.

Do NOT require the tester to manually type the project name.

---

# 14. MODULE SELECTION

After project selection:

"Select your module:"

[Wallet]
[CRM]
[Payment]

Only modules assigned to that tester under the selected project should be shown.

Do NOT show unrelated modules.

---

# 15. DAILY CHECK-IN DATA

Collect:

1. Project
2. Module
3. Work completed today
4. Blocker status
5. Blocker description
6. Next plan
7. Achievement
8. Executed test cases
9. Passed test cases
10. Failed test cases
11. Blocked test cases

Store:

- Tester ID
- Telegram user ID
- Project ID
- Module ID
- Date
- Ethiopia local timestamp
- Work summary
- Blocker status
- Blocker description
- Next plan
- Achievement
- Executed
- Passed
- Failed
- Blocked

---

# 16. DAILY CHECK-IN TIME

The Telegram bot must automatically remind QA Testers to submit their daily status.

Time:

11:30 AM

Timezone:

Africa/Addis_Ababa

Ethiopia local time is UTC+3.

The application must explicitly use:

Africa/Addis_Ababa

Do NOT rely on the server's default timezone.

---

# 17. DAILY REMINDER RULE

At 11:30 AM Africa/Addis_Ababa:

Send a reminder only to active QA Testers who have NOT completed today's check-in.

Example:

"⏰ Daily QA Check-in

It's 11:30 AM.

Please submit your daily QA status.

Use /checkin to begin."

If a tester already submitted today's check-in:

DO NOT send the reminder.

Do not send duplicate reminders.

Today's check-in date must be calculated using Africa/Addis_Ababa.

---

# 18. QA LEAD CHECK-IN VIEW

The QA Lead should be able to view tester check-ins.

Information should include:

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

---

# 19. BLOCKERS

Testers can report blockers during check-in.

The QA Lead can:

- View blockers
- See the responsible tester
- See project/module
- Track blocker status
- Mark blockers as resolved where appropriate

---

# 20. WORKLOAD

The QA Lead should be able to view tester workload across projects.

Workload should consider assignments across all projects.

Do not automatically reassign testers.

The system should provide visibility to the QA Lead.

---

# 21. RELEASE READINESS

Project/module readiness can use:

- Testing progress
- Passed tests
- Failed tests
- Blocked tests
- Critical blockers

A critical blocker can prevent a project/module from being considered ready regardless of percentage.

The QA Lead should be able to see readiness information.

---

# 22. AUTHENTICATION

The QA Lead web portal must use secure authentication.

Requirements:

- Password hashing
- Protected routes
- Secure session/JWT handling
- Server-side authorization

Do NOT implement authorization only in the frontend.

Telegram users are identified through their Telegram user ID.

---

# 23. DATABASE ENTITIES

The system should support at minimum:

- QA Lead
- QA Testers
- Projects
- Sub-projects
- Modules
- Tester Assignments
- Check-ins
- Blockers
- Project Documents/Links
- Notifications

Use proper relationships and foreign keys.

---

# 24. CORE SYSTEM FLOW

QA Lead
↓
Web Portal
↓
Create Project
↓
Create Sub-project
↓
Create Modules
↓
Tester registers through Telegram
↓
Tester becomes PENDING_ASSIGNMENT
↓
QA Lead sees pending tester
↓
QA Lead assigns tester
↓
Tester receives Telegram notification
↓
Tester receives PRD + Figma
↓
11:30 AM Ethiopia time
↓
Tester receives check-in reminder
↓
/checkin
↓
Select assigned Project
↓
Select assigned Module
↓
Submit daily status
↓
QA Lead views check-in

---

# 25. ARCHITECTURE RULE

This document is the source of truth for the DashenQA architecture.

Do not introduce roles, hierarchy, portals, or workflows that contradict this document.