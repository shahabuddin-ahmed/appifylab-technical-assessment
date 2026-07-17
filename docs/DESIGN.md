# DESIGN

## Overview

This service implements the Live Class Enrollment feature for a multi-tenant learning management system.

Core requirements covered:

- school-scoped live classes
- concurrency-safe enrollment
- no oversell beyond `maxSeats`
- retry-safe enrollment behavior
- waitlist support with auto-promotion on cancellation
- tenant scoping through fake auth headers

The implementation is intentionally backend-focused and keeps the critical paths fully implemented:

- `POST /api/v1/classes/:liveClassId/enroll`
- `DELETE /api/v1/classes/:liveClassId/enroll`

Other endpoints support setup and verification:

- `POST /api/v1/schools`
- `POST /api/v1/students`
- `POST /api/v1/classes`
- `GET /api/v1/classes/:liveClassId/roster`
- `GET /api/v1/students/me/enrollments`

## Architecture

The code follows a layered structure:

- `config`: runtime configuration
- `infra`: MySQL/Redis/Sequelize setup
- `model`: Sequelize models and associations
- `repo`: persistence operations
- `service`: business logic and transaction boundaries
- `web/controller`: request validation and response formatting
- `web/router`: route wiring
- `web/middleware`: async handling, auth context, global error handling

This keeps business rules out of controllers and keeps repository methods focused on database access.

## Data Model

Entities:

- `School`
  - tenant boundary
- `Student`
  - belongs to one school
  - unique email per school
- `LiveClass`
  - belongs to one school
  - stores `maxSeats`, `enrolledCount`, `waitlistCount`
  - exact duplicate prevention on `schoolId + title + startTime`
- `Enrollment`
  - belongs to one school, one live class, one student
  - `status` is `ENROLLED` or `WAITLISTED`
  - `waitlistPosition` is used for FIFO promotion

Waitlist is represented inside `Enrollment` rather than as a separate table. That keeps the core workflow simpler while still supporting ordered promotions.

## Tenant Scoping

Auth is intentionally faked for the assessment:

- `x-tenant-id` -> school id
- `x-user-id` -> student id

Middleware resolves these headers and stores them on the request before controllers run. Service methods still validate that:

- the student belongs to the tenant
- the live class belongs to the tenant

This mirrors the behavior expected from verified JWT claims without implementing full authentication.

## Concurrency Strategy

The critical problem is preventing oversell when many students enroll in the same class at the same time.

The chosen approach:

1. start an explicit SQL transaction
2. lock the target live class row with `SELECT ... FOR UPDATE` semantics through Sequelize transaction locking
3. re-check current enrollment state inside the transaction
4. either enroll immediately or append to waitlist
5. commit

Because the live class row is locked for the duration of the transaction, only one enrollment flow can modify seat availability at a time for that class. This guarantees:

- `enrolledCount` never exceeds `maxSeats`
- waitlist position increments stay consistent

## Idempotency / Retry Safety

The assessment asks for retry-safe enrollment behavior.

Current behavior:

- before creating a new enrollment, the service checks whether the student already has an enrollment for that class
- if one exists, the existing record is returned instead of creating another one

This prevents duplicate enrollment rows from repeated client retries or double-click behavior. A unique DB constraint on `schoolId + liveClassId + studentId` remains as the final safety net.

## Cancellation and Waitlist Promotion

Cancellation also runs inside an explicit transaction.

Behavior:

- delete the current enrollment
- if the cancelled record was waitlisted:
  - compact later waitlist positions
- if the cancelled record was enrolled:
  - select the first waitlisted student
  - promote them to `ENROLLED`
  - compact remaining waitlist positions

This guarantees the waitlist remains FIFO and consistent.

## Redis Usage

Redis is used only as a read cache, not for concurrency control.

Cached reads:

- roster by class
- student enrollment list

Cache is invalidated after enrollment and cancellation writes.

Reasoning:

- MySQL transactions are the source of truth for correctness
- Redis improves repeated read performance
- avoiding Redis locks keeps the solution simpler and safer for the assessment scope

## Tradeoffs

- `enrolledCount` and `waitlistCount` are stored counters for efficiency; they must be maintained transactionally
- fake auth keeps the assessment focused on business rules instead of identity infrastructure
- `sequelize.sync()` is acceptable for this assessment, but real production systems should use explicit migrations
- Redis caching is intentionally limited to non-critical reads

## Summary

The design prioritizes correctness in the enrollment and cancellation paths, because those are the highest-risk operations in the brief. The key decisions are:

- enforce tenant boundaries in service logic
- use SQL transactions and row locking for correctness
- keep idempotency logic in the service layer
- represent waitlist within enrollments for simplicity
- use Redis only for cacheable reads
