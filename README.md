# appifylab-technical-assessment

Live class enrollment backend for a multi-tenant learning management system.

## Documentation

- ERD: [docs/erd.md](./docs/erd.md)
- Design: [docs/DESIGN.md](./docs/DESIGN.md)
- SQL: [docs/schema.sql](./docs/schema.sql)
- Postman: [docs/POSTMAN.md](./docs/POSTMAN.md)

## Requirements

- Docker and Docker Compose
- Node.js 22+
- Yarn

## Running the API

### Docker Compose (recommended)

Clone the repository:

```bash
git clone git@github.com:shahabuddin-ahmed/appifylab-technical-assessment.git
cd appifylab-technical-assessment
```

Install dependencies:

```bash
yarn install
```

Run the application:

```bash
docker-compose up --build
```

This starts:

- API container
- MySQL 8
- Redis 7
- phpMyAdmin

Docker Compose uses [Dockerfile.dev](./Dockerfile.dev) for local development.

Endpoints and tools:

- API base URL: [http://localhost:3000/api/v1](http://localhost:3000/api/v1)
- Health check: [http://localhost:3000/api/v1/health](http://localhost:3000/api/v1/health)
- phpMyAdmin: [http://localhost:8080](http://localhost:8080)

Database settings from `docker-compose.yml`:

- MySQL host: `db`
- MySQL database: `appifylab_technical_assessment`
- MySQL user: `root`
- MySQL password: `root`
- Redis host: `redis`

To build the production image instead:

```bash
docker build -f Dockerfile -t appifylab-technical-assessment:prod .
```

### Local (host Node, optional)

Install dependencies:

```bash
yarn install
```

Run the app:

```bash
yarn dev
```

Default runtime settings live in [src/config/config.ts](./src/config/config.ts). Override them with environment variables when needed:

- `MYSQL_HOST`
- `MYSQL_DATABASE`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `APPLICATION_SERVER_PORT`
- `APP_FORCE_SHUTDOWN_SECOND`
- `REDIS_HOST`

## Database Initialization

On startup, Sequelize:

1. authenticates against MySQL
2. calls `sequelize.sync()`

Implications:

- tables are created automatically if they do not exist
- this project does not use migrations
- schema changes are tied to the current Sequelize model definitions

For an assessment project this is acceptable. For production, explicit migrations would be safer.

## Implemented API Flow

- `POST /api/v1/schools`
- `POST /api/v1/students`
- `POST /api/v1/classes`
- `POST /api/v1/classes/:liveClassId/enroll`
- `DELETE /api/v1/classes/:liveClassId/enroll`
- `GET /api/v1/students/me/enrollments`
- `GET /api/v1/classes/:liveClassId/roster`

## Auth Model Used for the Assessment

Auth is intentionally faked via headers:

- `x-tenant-id` -> school id
- `x-user-id` -> student id

These are resolved in middleware and then enforced in service logic as tenant/user scope.

## Postman

Provided Postman assets:

- Collection: `appifylab assessment.postman_collection.json`
- Environment: `appifylab-assessment.postman_environment.json`

Recommended environment values:

- `HOST = http://localhost:3000/api/v1`
- `x-tenant-id = 1`
- `x-user-id = 1`

Important:

- the exported collection currently uses `live-classes` in the URLs
- the current implementation in this repository uses `classes`

So after importing the collection, update:

- `{{HOST}}/live-classes` -> `{{HOST}}/classes`
- `{{HOST}}/live-classes/1/enroll` -> `{{HOST}}/classes/1/enroll`
- `{{HOST}}/live-classes/1/roster` -> `{{HOST}}/classes/1/roster`

See [docs/POSTMAN.md](./docs/POSTMAN.md) for the full note.

## Feature Behavior

- multi-tenant isolation by `schoolId`
- fake auth via `x-tenant-id` and `x-user-id`
- concurrency-safe enrollment with MySQL transactions
- no oversell beyond `maxSeats`
- retry-safe enrollment by returning the existing enrollment instead of double-creating
- automatic waitlist placement when a class is full
- automatic promotion of the first waitlisted student when an enrolled student cancels
- Redis-backed caching for student enrollments and class rosters with invalidation on writes
