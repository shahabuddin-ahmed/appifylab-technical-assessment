# appifylab-technical-assessment

Live class enrollment backend for a multi-tenant learning management system.

Implemented flow:

- `POST /api/v1/schools`
- `POST /api/v1/students`
- `POST /api/v1/live-classes`
- `POST /api/v1/live-classes/:liveClassId/enrollments`
- `DELETE /api/v1/live-classes/:liveClassId/enrollments/:studentId?schoolId=...`
- `GET /api/v1/students/:studentId/enrollments?schoolId=...`
- `GET /api/v1/live-classes/:liveClassId/roster?schoolId=...`

Feature behavior:

- multi-tenant isolation by `schoolId`
- concurrency-safe enrollment with MySQL transactions
- no oversell beyond `maxSeats`
- retry-safe enrollment by returning the existing enrollment instead of double-creating
- automatic waitlist placement when a class is full
- automatic promotion of the first waitlisted student when an enrolled student cancels
- Redis-backed caching for student enrollments and class rosters with invalidation on writes
