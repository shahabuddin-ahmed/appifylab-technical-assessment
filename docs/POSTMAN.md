# Postman

This project includes a Postman collection and environment provided outside the repository:

- Collection: `appifylab assessment.postman_collection.json`
- Environment: `appifylab-assessment.postman_environment.json`

## Import

In Postman:

1. Import the collection file.
2. Import the environment file.
3. Select the `appifylab-assessment` environment.

## Environment Variables

Set these values in the imported environment:

- `HOST`
- `x-tenant-id`
- `x-user-id`

Recommended local values:

- `HOST = http://localhost:3000/api/v1`
- `x-tenant-id = 1`
- `x-user-id = 1`

## Exported Requests

The imported collection currently contains these requests:

- `create school`
- `create student`
- `create live class`
- `live class enrollments`
- `get student enrollments`
- `live class roster`

## Route Note

The exported collection currently uses `live-classes` in the request URLs, for example:

- `POST {{HOST}}/live-classes`
- `POST {{HOST}}/live-classes/1/enroll`
- `GET {{HOST}}/live-classes/1/roster`

The current application routes in this repository use:

- `POST /api/v1/classes`
- `POST /api/v1/classes/:liveClassId/enroll`
- `DELETE /api/v1/classes/:liveClassId/enroll`
- `GET /api/v1/classes/:liveClassId/roster`

So after importing the collection, update these request URLs from `live-classes` to `classes` before using them with the current codebase.

## Header Usage

For student-scoped requests, send:

- `x-tenant-id`: school id
- `x-user-id`: student id

For tenant-only setup requests such as creating a student or creating a class, `x-tenant-id` is required.

## Suggested Test Flow

1. Create a school.
2. Set `x-tenant-id` to that school id.
3. Create a student.
4. Set `x-user-id` to that student id.
5. Create a class.
6. Enroll the student.
7. Check student enrollments.
8. Check class roster.
