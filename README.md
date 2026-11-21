# Gym Membership Management System

A college DBMS mini project. It manages gym members, trainers, membership plans, and payments. The data is stored in **Cloud Firestore** (a NoSQL document database). The frontend uses plain HTML, CSS, and JavaScript.

Live demo: _add your GitHub Pages link here after deployment_

## Features

- Add and delete membership plans, trainers, members, and payments
- Assign an optional trainer to a member, and change the trainer later
- Membership status (Active or Expired) calculated from the end date
- Payment status (Paid, Pending, Overdue) with a one-click "Mark paid" button
- Renew a membership: extends the dates and creates a Pending payment
- Search members by name and filter by status
- Delete rules that protect related data

## Tech stack

| Part | Technology |
|---|---|
| Database | Cloud Firestore (Firebase) |
| Frontend | HTML, CSS, JavaScript (ES modules) |
| Hosting | GitHub Pages |

## Database design

Firestore stores data in **collections** (like tables) that hold **documents** (like rows). Each document has an auto-generated ID that acts as its primary key. A **reference** is a field that stores another document's ID.

### `plans`

| Field | Type | Example |
|---|---|---|
| name | string | "Quarterly" |
| durationDays | number | 90 |
| price | number | 4000 |

### `trainers`

| Field | Type | Example |
|---|---|---|
| name | string | "Ravi Kumar" |
| phone | string | "9876543210" |
| email | string | "ravi@gym.com" |
| specialization | string | "Weight Training" |

### `members`

| Field | Type | Example |
|---|---|---|
| name | string | "Asha Khan" |
| phone | string | "9123456780" |
| email | string | "asha@mail.com" |
| trainerId | string or null | ID of a trainer (optional) |
| planId | string | ID of a plan |
| startDate | timestamp | 1 Nov 2026 |
| endDate | timestamp | 30 Jan 2027 |

### `payments`

| Field | Type | Example |
|---|---|---|
| memberId | string | ID of a member |
| planId | string | ID of a plan |
| amount | number | 4000 |
| dueDate | timestamp | 5 Nov 2026 |
| paymentDate | timestamp or null | null until paid |
| status | string | "Paid" or "Pending" |

### Relationships

- One plan has many members (`members.planId`).
- One trainer has many members (`members.trainerId`, optional).
- One member has many payments (`payments.memberId`).
- One plan has many payments (`payments.planId`).

## Design decisions

1. **No duplicated lists.** A trainer does not store a list of members. We query `members` where `trainerId` equals the trainer's ID. This avoids duplicate data and matches the idea of normalization.
2. **Calculated values.** Active or Expired is worked out by comparing `endDate` with today. Overdue is worked out when a payment is not Paid and its `dueDate` has passed. Neither is stored, so they are never out of date.
3. **Price copied into payments.** Each payment stores its own `amount`, so a later change to a plan's price does not change past payments.
4. **Referential integrity in code.** Firestore does not enforce foreign keys, so the app does:
   - Plans: delete is blocked while members or payments use the plan (RESTRICT).
   - Trainers: deleting a trainer sets `trainerId` to null on their members (SET NULL).
   - Members: deleting a member also deletes their payments (CASCADE).
5. **Filtering in the browser.** Firestore cannot search for text inside a field, so the member search runs on the loaded data.

## Run locally

1. Clone this repository.
2. Open the folder in VS Code and install the **Live Server** extension.
3. Right-click `index.html` and choose **Open with Live Server**.

The page must be served over `http` or `https`. Opening the file by double-clicking will not work, because browsers block ES modules on `file://` addresses.

## Limitations

- No login. Security rules currently allow open access until a fixed date, so the app is for demonstration only. Do not store real member details.
- Trainers and plans cannot be edited after saving. Delete and add again.
- A member cannot switch to a different plan except by deleting and re-adding.
- No dashboard with totals.

## Possible future work

- Firebase Authentication so only staff can sign in
- Security rules that require a signed-in user
- Edit forms for plans and trainers
- A dashboard with active members and overdue payment totals
