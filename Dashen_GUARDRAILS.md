# DASHENQA — SCOPE GUARDRAILS

## 1. SOURCE OF TRUTH

The following document is the primary architecture reference:

/docs/DASHENQA_ARCHITECTURE.md

All implementation must follow it.

If a requested change conflicts with the architecture, stop and identify the conflict before implementation.

---

# 2. ONLY TWO USER TYPES

DashenQA has only:

1. QA Lead
2. QA Tester

Do NOT create:

- QA Director
- Senior QA Lead
- Multiple QA Leads
- Project Manager
- Admin hierarchy
- Tester web role
- Additional roles

Unless explicitly requested in a future task.

---

# 3. ONLY TWO INTERFACES

DashenQA has:

1. QA Lead Web Portal
2. QA Tester Telegram Bot

The QA Lead uses the web portal.

QA Testers use Telegram.

Do NOT create a separate tester web portal.

---

# 4. PROJECT HIERARCHY

The hierarchy is:

QA Lead
↓
Projects
↓
Sub-projects
↓
Modules
↓
Assigned Testers

Do not add another management layer.

---

# 5. TESTER ACCESS

Testers must only access projects assigned to them.

Testers must only access modules assigned to them.

Backend authorization is mandatory.

Do NOT rely only on:

- Hidden buttons
- Frontend filtering
- Telegram menu filtering

Every protected operation must verify assignment on the backend.

---

# 6. NEW TESTER REGISTRATION

The registration flow is:

/start
↓
Ask name
↓
Create tester
↓
PENDING_ASSIGNMENT
↓
Confirmation
↓
Wait for QA Lead

Do not automatically assign a new tester.

---

# 7. ASSIGNMENT

Only the QA Lead assigns testers.

Assignment structure:

Tester
→ Project
→ Sub-project if applicable
→ Module(s)

After assignment:

Send Telegram notification.

Include:

- Project
- Module
- PRD
- Figma

---

# 8. CHECK-IN

The daily check-in must use:

/checkin

Flow:

Assigned Project
↓
Assigned Module
↓
Work completed
↓
Blocker
↓
Next plan
↓
Achievement
↓
Testing statistics
↓
Confirmation

Do not ask testers to manually type project names.

---

# 9. CHECK-IN PROJECT LIST

When a tester starts a check-in:

Show ONLY projects assigned to that tester.

Never show:

- All projects
- Unassigned projects
- Other testers' projects

---

# 10. CHECK-IN MODULE LIST

After selecting a project:

Show ONLY modules assigned to that tester under that project.

Never show unrelated modules.

---

# 11. DAILY REMINDER

Reminder time:

11:30 AM

Timezone:

Africa/Addis_Ababa

Use the explicit timezone.

Do not rely on:

- Server timezone
- UTC
- Browser timezone

Only active testers without today's check-in should receive the reminder.

---

# 12. DAILY CHECK-IN DATE

When determining whether a tester has checked in today, calculate the date using:

Africa/Addis_Ababa

Do not use UTC date directly.

---

# 13. DUPLICATE REMINDER PREVENTION

If a tester has already completed today's check-in:

Do NOT send a reminder.

Do not send duplicate reminders.

---

# 14. SECURITY

Backend authorization is mandatory.

Frontend visibility is not security.

Telegram button restrictions are not security.

The backend must verify:

tester identity
+
project assignment
+
module assignment

before accepting protected actions.

---

# 15. DATABASE INTEGRITY

Use proper relationships.

Do not create duplicate tester records for the same Telegram user ID.

Telegram user ID must uniquely identify a Telegram tester.

---

# 16. DO NOT REBUILD UNRELATED FEATURES

Do not:

- Redesign unrelated screens
- Rewrite unrelated services
- Refactor unrelated code
- Replace working architecture
- Delete working features
- Modify unrelated database tables

Only change what the current task requires.

---

# 17. ONE TASK AT A TIME

The development workflow is:

Architecture Reference
↓
Scope Guardrails
↓
ONE Task
↓
Inspect
↓
Implement
↓
Test
↓
Report
↓
STOP

Never implement future tasks automatically.

---

# 18. NO SCOPE CREEP

Do not add features because they might be useful.

Do not create additional dashboards.

Do not create additional roles.

Do not create additional workflows.

Do not introduce unnecessary dependencies.

If something is outside the current task:

DO NOT IMPLEMENT IT.

Mark it:

"Outside current task scope."

Then STOP.

---

# 19. INSPECTION BEFORE IMPLEMENTATION

Before modifying code:

1. Inspect the relevant existing implementation.
2. Understand existing dependencies.
3. Identify the smallest required change.
4. Implement only that change.
5. Test it.

Do not make assumptions about the codebase.

---

# 20. SECURITY BEFORE UI

If a feature requires access control:

Implement and verify backend authorization first.

Frontend restrictions are supplemental only.

---

# 21. TIMEZONE RULE

All daily QA scheduling and daily check-in date calculations must use:

Africa/Addis_Ababa

This is mandatory.

---

# 22. FINAL RULE

If the architecture does not define something:

Do not invent a new architecture.

Do not automatically add a feature.

Do not expand the scope.

Stop and ask for clarification.