
## API Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /auth/register | ✗ | Register user |
| POST | /auth/login | ✗ | Login |
| GET | /auth/me | ✓ | Current user |

| PUT | /users/profile | ✓ | Update profile |
| GET | /users/organization | ✓ | Org members |
| GET | /users/:id | ✓ | Get user |

| POST | /events | ✓ | Create event (+ auto-invitations) |
| GET | /events/calendar?start=&end= | ✓ | Calendar range view |
| GET | /events/search?q= | ✓ | Search events |
| GET | /events/today | ✓ | Today's events |
| GET | /events/upcoming | ✓ | Next 10 events |
| GET | /events/:id | ✓ | Single event |
| PUT | /events/:id | ✓ | Update event |
| DELETE | /events/:id | ✓ | Delete event |
| POST | /events/check-conflict | ✓ | Conflict check |
| POST | /events/find-availability | ✓ | ⭐ Smart Availability Finder |

| GET | /invitations | ✓ | Pending invitations |
| POST | /invitations | ✓ | Send invitations |
| PATCH | /invitations/:id | ✓ | Respond `{status: "accepted"\|"declined"\|"tentative"}` |
| POST | /polls | ✓ | Create meeting poll |
| GET | /polls/:id | ✓ | Poll details |
| POST | /polls/:id/vote | ✓ | Vote on option |
| POST | /polls/:id/finalize | ✓ | Finalize → creates event |
| GET | /goals | ✓ | List goals |
| POST | /goals | ✓ | Create goal |
| PUT | /goals/:id | ✓ | Update goal |
| DELETE | /goals/:id | ✓ | Delete goal |
| POST | /goals/:id/progress | ✓ | Log progress |
| GET | /goals/:id/progress | ✓ | Goal history |
| GET | /dashboard/personal | ✓ | Personal dashboard |
| GET | /dashboard/weekly-rewind | ✓ | Weekly rewind |
| GET | /dashboard/goals | ✓ | Goal analytics |
| POST | /ai/chat | ✓ | Natural language assistant |
| GET | /ai/daily-summary | ✓ | AI daily summary |
| GET | /ai/weekly-insights | ✓ | AI weekly insights |
| POST | /ai/meeting-summary | ✓ | Summarise a meeting |
