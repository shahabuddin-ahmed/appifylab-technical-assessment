# appifylab-technical-assessment

Live class enrollment backend for a multi-tenant learning management system.

ERD: [docs/erd.md](./docs/erd.md)
Design: [docs/DESIGN.md](./docs/DESIGN.md)
SQL: [docs/schema.sql](./docs/schema.sql)

Implemented flow:

- `POST /api/v1/schools`
- `POST /api/v1/students`
- `POST /api/v1/classes`
- `POST /api/v1/classes/:liveClassId/enroll`
- `DELETE /api/v1/classes/:liveClassId/enroll`
- `GET /api/v1/students/me/enrollments`
- `GET /api/v1/classes/:liveClassId/roster`

Feature behavior:

- multi-tenant isolation by `schoolId`
- fake auth via `x-tenant-id` and `x-user-id` headers for tenant/user scoping
- concurrency-safe enrollment with MySQL transactions
- no oversell beyond `maxSeats`
- retry-safe enrollment by returning the existing enrollment instead of double-creating
- automatic waitlist placement when a class is full
- automatic promotion of the first waitlisted student when an enrolled student cancels
- Redis-backed caching for student enrollments and class rosters with invalidation on writes
