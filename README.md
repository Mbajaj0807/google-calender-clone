#  Google Calendar Clone

A full-stack Google Calendar clone built with React + TypeScript and Node.js + MongoDB — extended with original features around unified scheduling, smart availability, and goal tracking.

**Live Demo:** _[https://google-calender-clone-azure.vercel.app/login]_ &nbsp;|&nbsp; **Repo:** [Mbajaj0807/google-calender-clone](https://github.com/Mbajaj0807/google-calender-clone)

---

## Tech Stack

| | Frontend | Backend |
|---|---|---|
| **Language** | TypeScript | TypeScript / Node.js |
| **Framework** | React 18 | Express.js |
| **Styling** | Tailwind CSS | — |
| **Database** | — | MongoDB (Mongoose) |
| **Auth** | JWT (client) | JWT + bcrypt |
| **Hosting** | Vercel | Render + MongoDB Atlas |

---

## Getting Started

```bash
git clone https://github.com/Mbajaj0807/google-calender-clone.git

# Backend
cd backend && npm install
# Create .env → MONGO_URI, JWT_SECRET, PORT, CLIENT_URL
npm run dev

# Frontend
cd ../frontend && npm install
# Create .env → VITE_API_BASE_URL=http://localhost:5000/api
npm run dev
```

App runs at `http://localhost:5173`

---

## Architecture

```
┌─────────────────────────────────────────┐
│              React Frontend             │
│                                         │
│   Professional        Personal          │
│   Dashboard      ←→  Dashboard          │
│       │                  │              │
│       └──── Unified Calendar View ──────┘
│              (Month / Week / Day)       │
└──────────────────┬──────────────────────┘
                   │ REST API + JWT
┌──────────────────▼──────────────────────┐
│            Express Backend              │
│                                         │
│  Auth │ Events │ Invitations │ Polls    │
│                                         │
│  • Conflict detection                   │
│  • Availability computation             │
│  • Recurring event expansion            │
└──────────────────┬──────────────────────┘
                   │ Mongoose
┌──────────────────▼──────────────────────┐
│   MongoDB Atlas                         │
│   users · events · invitations          │
│   polls · goals                         │
└─────────────────────────────────────────┘
```

All timestamps stored in **UTC**, displayed in each user's local timezone.

---

## Creative Features

These go beyond the assignment requirements and reflect deliberate product thinking.

### 1. Unified Calendar (not split calendars)
Most calendar apps separate "work" and "personal" into different calendars. Here, everything lives in one event collection. The Professional and Personal dashboards are just different views over the same data — so your schedule is always consistent and you never have to check two places.

### 2. Protected Personal Commitments
You can mark personal events — Gym, Family Time, a study block — as **protected**. When someone tries to schedule a meeting that overlaps your protected time, they get a warning before they can save it. It respects your personal time without hiding it completely.

### 3. Smart Availability Finder
Instead of manually checking everyone's calendar, the organizer picks participants, a time window, and how long the meeting needs to be. The system looks at everyone's schedules and surfaces the slots where everyone is free. If there's no overlap at all, it says so clearly and asks if you want to schedule anyway.

### 4. Meeting Polls
When no time works for everyone, the organizer proposes up to 4 options. Participants vote. The winning slot automatically becomes the scheduled event. No back-and-forth over chat.

### 5. Goal Tracking on the Calendar
Goals like "Run 3x a week" or "Read for 30 mins daily" live directly on the calendar alongside meetings — not tucked away in a separate tasks list. Each goal tracks recurring dates, which ones were completed, and shows a progress view on the Personal Dashboard.

### 6. Dashboard Separation, Not Calendar Separation
The underlying calendar is always the same. What changes is the context:
- **Professional Dashboard** — meetings, invitations, polls, what's coming up
- **Personal Dashboard** — goals, streaks, weekly insights

This reduces context-switching without splitting your data.

### 7. Layered Conflict Detection
Conflicts aren't just a binary yes/no. There are three levels:
- **Hard conflict** — two work events overlap → blocked with a warning
- **Soft conflict** — meeting overlaps a protected personal slot → warned, but can override
- **No availability** → redirected to the Smart Availability Finder to find a better time

---

## Database Schema

### events
```
title, description, agenda, notes, location
eventType         "meeting" | "one-on-one" | "workshop" | "all-hands" | "goal"
priority          "low" | "medium" | "high"
visibility        "private" | "organization"
startTime         Date (UTC)
endTime           Date (UTC)
recurrenceRule    RRULE string or null
protectedPersonal Boolean
organizerId       → users
participantIds    [→ users]
status            "scheduled" | "cancelled" | "completed"
```

### invitations
```
eventId      → events
userId       → users
status       "invited" | "accepted" | "declined" | "tentative"
respondedAt  Date or null
```

### polls
```
organizerId     → users
participantIds  [→ users]
options         [{ startTime, endTime, votes: [userId] }]
status          "open" | "closed" | "converted"
```

### goals
```
userId             → users
title, category, recurrenceRule
completionHistory  [Date]
```

---

## API Overview

### Auth
```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
```

### Events
```
GET    /api/events               ?start= &end=
POST   /api/events
PUT    /api/events/:id
DELETE /api/events/:id
GET    /api/events/availability  ?participantIds= &start= &end= &duration=
```

### Invitations
```
GET    /api/invitations
PUT    /api/invitations/:id      { status: "accepted" | "declined" | "tentative" }
```

### Polls & Goals
```
POST   /api/polls
POST   /api/polls/:id/vote
POST   /api/polls/:id/convert

GET    /api/goals
POST   /api/goals
PUT    /api/goals/:id/complete
DELETE /api/goals/:id
```

---

## Edge Cases

- **Cross-midnight events** — split visually across two day columns in Week view
- **Recurring edits** — editing one instance doesn't touch the rest of the series
- **Concurrent edits** — if two devices edit the same event at once, the second save is rejected and the client re-fetches the latest version
- **Protected slot override** — when an organizer overrides a warning, it's logged in the event notes
- **No availability found** — Smart Finder explicitly tells the user and offers a "schedule anyway" option

---

## Future Enhancements

- Google OAuth + real Google Calendar sync
- Real-time updates so all participants see changes instantly
- Email/push notifications for invites and reminders
- Offline mode — view and draft events without internet, sync when back online
- Natural language input — "Schedule a 30-min sync with Riya tomorrow at 3"

---

## Theory Questions

### Q1 — How would you handle one million users?

Right now, when someone opens their calendar, the backend fetches all their events for that date range. With a million users doing this at the same time, that becomes a lot of database reads very quickly.

The first fix is making those reads faster — by adding the right database indexes so MongoDB can jump straight to a user's events without scanning everything. The second is caching: for things like recurring event schedules that don't change often, we store the computed result temporarily so we don't recalculate it on every request.

For editing conflicts (two people editing the same event from different devices), we attach a version number to each event. When you save, the backend checks that your version matches what's in the database. If someone else saved first, your update is rejected and you get the latest version — simple and safe.

To handle the load itself, we'd run multiple copies of the backend server so requests are spread across them, and use MongoDB's built-in sharding to split the data across servers as the database grows.

---

### Q2 — What would you do if the calendar gets slow with thousands of events?

The biggest problem is trying to show everything at once. If you render 2000 event blocks in the DOM, the browser struggles — even if most of them are off-screen.

The simplest fix is to only load what's visible. Instead of fetching all events ever, we only ask for events in the current view window (this week, this month). When you navigate to the next week, we fetch that.

On the rendering side, we only mount the event components that are actually on screen. As you scroll, off-screen ones are removed and new ones are added — so the browser is never holding thousands of elements at once.

We also avoid recalculating things unnecessarily. For example, figuring out how to arrange overlapping events into columns is expensive — we compute it once when the data loads and reuse it, rather than recalculating it every time anything on the page changes.

---

