# Requirements — Todos

> **Status:** Draft for review. Edit freely — this is your product spec.

## 1. Vision

A clean, feature-rich task manager where a user can capture tasks, organize them by
category and priority, track due dates, and quickly find what matters. Built to practice
the full software development lifecycle (SDLC): requirements → design → build → deploy.

## 2. Target user

Individuals managing their own personal tasks. Two modes:
- **Guest** — no account; tasks are stored in the browser only (localStorage).
- **Logged-in user** — tasks are persisted to a backend and retrievable from any device
  after logging in.

## 3. Functional requirements (user stories)

Each story has acceptance criteria (AC) that define "done."

### FR-1: Add a task
As a user, I want to add a task so I can remember what I need to do.
- **AC1:** I can type a task title and add it to the list.
- **AC2:** A task cannot be added with an empty title.
- **AC3:** A new task appears immediately in the list, marked "not completed."

### FR-2: View tasks
As a user, I want to see all my tasks in a list.
- **AC1:** Each task shows its title, priority, category, due date, and completion state.
- **AC2:** If there are no tasks, a friendly empty-state message is shown.

### FR-3: Complete a task
As a user, I want to mark a task complete/incomplete.
- **AC1:** Toggling shows a clear visual change (e.g. strikethrough + checkmark).
- **AC2:** The change persists across the session.

### FR-4: Edit a task
As a user, I want to edit a task's details after creating it.
- **AC1:** I can change title, description, due date, priority, and category.
- **AC2:** Canceling an edit discards changes.

### FR-5: Delete a task
As a user, I want to delete a task I no longer need.
- **AC1:** Deleting removes the task from the list.
- **AC2:** I am asked to confirm before a task is permanently deleted.

### FR-6: Task details / metadata
As a user, I want each task to hold useful details.
- **AC1:** Optional description (longer free text).
- **AC2:** Due date (optional).
- **AC3:** Priority: Low / Medium / High.
- **AC4:** Category — **hybrid**: choose from a default preset list (e.g. Work, Personal,
  Shopping) *or* add a new user-defined category, which is then remembered for reuse.

### FR-7: Filter tasks
As a user, I want to filter tasks so I can focus.
- **AC1:** Filter by completion state: All / Active / Completed.
- **AC2:** Filter by category.
- **AC3:** Filter by priority.

### FR-8: Sort tasks
As a user, I want to sort tasks.
- **AC1:** Sort by due date, priority, or creation date.

### FR-9: Search tasks
As a user, I want to search tasks by text.
- **AC1:** Typing in a search box filters the list by title/description as I type.

### FR-10: Persistence
As a user, I want my tasks to survive a page refresh.
- **AC1:** As a guest, tasks are saved to the browser (localStorage) in Phase 2.
- **AC2:** As a logged-in user, tasks are saved to a backend database (Phase 3+).

### FR-12: Manage categories
As a user, I want to manage the categories I've created.
- **AC1:** I can **rename** a user-defined category; tasks using it update to the new name.
- **AC2:** I can **delete** a user-defined category **only when no task is using it**.
- **AC3:** If I try to delete a category that is in use, the delete is **blocked** and I'm
  told how many tasks still use it (so I can reassign/remove them first).
- **AC4:** System/preset categories (Work, Personal, Shopping…) cannot be renamed or
  deleted.
- **AC5:** Category names are unique, compared case-insensitively (no "Work" and "work").

### FR-11: Authentication & guest mode
As a user, I want to optionally create an account and log in so my tasks follow me
across devices.
- **AC1:** I can use the app as a **guest** with no account; my tasks live in browser storage.
- **AC2:** I can **register** with an email/username and password.
- **AC3:** I can **log in** and **log out**.
- **AC4:** When logged in, my tasks are loaded from the backend and saved there.
- **AC5:** Passwords are stored securely (hashed, never in plain text).
- **AC6:** Only the owner can see/modify their own tasks.
- **AC7:** When a guest registers/logs in for the first time, their browser data is
  migrated into their account: **custom categories are merged by name** (existing names
  skipped, new names persisted as the delta) and then **tasks are migrated**. Local
  storage is cleared afterward so nothing re-migrates. **(In scope for v1.)**

## 4. Non-functional requirements

- **Usability:** Works well on desktop and mobile screen sizes (responsive).
- **Performance:** List updates feel instant for a few hundred tasks.
- **Accessibility:** Keyboard-usable; sensible labels on inputs and buttons.
- **Code quality:** Standalone Angular components, typed models, small focused services.
- **Maintainability:** Clear folder structure; documented as we go.

## 5. Out of scope (for now)

- Sharing or collaboration between users
- Notifications / reminders
- Recurring tasks
- Subtasks / checklists within a task
- Social / third-party login (Google, GitHub) — email+password only to start
- Password reset via email

_These are candidate future enhancements once the core app is solid._
