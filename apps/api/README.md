# Express TypeScript API Template

Production-ready REST API template built with **Express.js**, **TypeScript**, **PostgreSQL**, **Drizzle ORM**, **Zod**, **Docker** and **Swagger/OpenAPI**.

Designed as a scalable backend foundation for SaaS apps, admin panels, mobile app APIs, MVPs and custom business systems.

---

## Tech Stack

| Category         | Technology        |
| ---------------- | ----------------- |
| Runtime          | Node.js           |
| Framework        | Express.js        |
| Language         | TypeScript        |
| Database         | PostgreSQL        |
| ORM              | Drizzle ORM       |
| Validation       | Zod               |
| Documentation    | Swagger / OpenAPI |
| Containerization | Docker            |
| Package Manager  | pnpm              |

---

## Features

| Feature              | Description                                                  |
| -------------------- | ------------------------------------------------------------ |
| Modular architecture | Clean `routes → controller → service → repository` structure |
| CRUD example         | Ready example module for extending the template              |
| Database integration | PostgreSQL with Drizzle ORM                                  |
| Migrations           | Drizzle migration workflow                                   |
| Validation           | Zod-based request validation                                 |
| Error handling       | Centralized error middleware with custom `ApiError`          |
| Environment config   | Validated environment variables                              |
| Docker support       | API and database can run in containers                       |
| API docs             | Swagger UI available at `/api/docs`                          |

---

## Project Structure

```txt
src/
├── config/
│   ├── env.ts
│   └── swagger.ts
├── db/
│   ├── index.ts
│   ├── schema.ts
│   └── migrations/
├── middlewares/
│   ├── error.middleware.ts
│   ├── not-found.middleware.ts
│   └── validate.middleware.ts
├── modules/
│   └── example/
│       ├── example.routes.ts
│       ├── example.controller.ts
│       ├── example.service.ts
│       ├── example.repository.ts
│       ├── example.schema.ts
│       └── example.types.ts
├── utils/
│   ├── ApiError.ts
│   └── asyncHandler.ts
├── main.ts
└── server.ts
```

---

## Architecture

```txt
Route → Controller → Service → Repository → Database
```

| Layer      | Responsibility                           |
| ---------- | ---------------------------------------- |
| Route      | Defines endpoints and applies validation |
| Controller | Handles HTTP request and response        |
| Service    | Contains business logic                  |
| Repository | Handles database queries                 |
| Database   | PostgreSQL managed with Drizzle ORM      |

---

## Getting Started

### 1. Clone repository

```bash
git clone <your-repository-url>
cd express-typescript-api-template
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Create `.env`

```env
NODE_ENV=dev
PORT=3000

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/app_db

JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

CORS_ORIGIN=http://localhost:5173
```

---

## Environment Variables

| Variable         | Description                       | Example                                                |
| ---------------- | --------------------------------- | ------------------------------------------------------ |
| `NODE_ENV`       | Application environment           | `dev`                                                  |
| `PORT`           | API server port                   | `3000`                                                 |
| `DATABASE_URL`   | PostgreSQL connection string      | `postgresql://postgres:postgres@localhost:5432/app_db` |
| `JWT_SECRET`     | Secret key for JWT authentication | `your-secret-key`                                      |
| `JWT_EXPIRES_IN` | JWT expiration time               | `7d`                                                   |
| `CORS_ORIGIN`    | Allowed CORS origin               | `http://localhost:5173`                                |

---

## Running Locally

Make sure PostgreSQL is running locally.

```bash
pnpm db:generate
pnpm db:migrate
pnpm dev
```

API URL:

```txt
http://localhost:3000
```

Swagger documentation:

```txt
http://localhost:3000/api/docs
```

---

## Running with Docker

Start API and PostgreSQL containers:

```bash
docker compose up --build
```

Run migrations inside the API container:

```bash
docker compose exec api pnpm db:migrate
```

Check database tables:

```bash
docker compose exec postgres psql -U postgres -d app_db -c "\dt"
```

### Docker Database URL

When the API runs locally, use:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/app_db
```

When the API runs inside Docker, use the PostgreSQL service name:

```env
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/app_db
```

In Docker, `localhost` points to the API container, not the database container.

---

## Available Scripts

| Command            | Description                                |
| ------------------ | ------------------------------------------ |
| `pnpm dev`         | Starts development server with `tsx watch` |
| `pnpm build`       | Builds the TypeScript project              |
| `pnpm start`       | Starts compiled production build           |
| `pnpm typecheck`   | Runs TypeScript type checking              |
| `pnpm db:generate` | Generates Drizzle migrations               |
| `pnpm db:migrate`  | Runs database migrations                   |
| `pnpm db:studio`   | Opens Drizzle Studio                       |

---

## API Routes

| Method   | Endpoint            | Description           |
| -------- | ------------------- | --------------------- |
| `GET`    | `/health`           | Health check          |
| `GET`    | `/api/examples`     | Get all examples      |
| `GET`    | `/api/examples/:id` | Get example by ID     |
| `POST`   | `/api/examples`     | Create example        |
| `PATCH`  | `/api/examples/:id` | Update example        |
| `DELETE` | `/api/examples/:id` | Delete example        |
| `GET`    | `/api/docs`         | Swagger documentation |

---

## Example Request Body

### Create Example

```json
{
  "name": "Example name",
  "description": "Example description"
}
```

### Update Example

```json
{
  "name": "Updated example name",
  "description": "Updated description"
}
```

---

## Error Response Format

```json
{
  "success": false,
  "message": "Resource not found"
}
```

Example usage:

```ts
throw new ApiError(404, "Resource not found");
```

---

## Extending the Template

Create a new module inside `src/modules`.

```txt
src/modules/users/
├── user.routes.ts
├── user.controller.ts
├── user.service.ts
├── user.repository.ts
├── user.schema.ts
└── user.types.ts
```

Register the route in `main.ts`:

```ts
app.use("/api/users", userRouter);
```

---

## Production

Build the project:

```bash
pnpm build
```

Start production server:

```bash
pnpm start
```

---

## License

MIT

---

## Author

Created by **Szymon Wardak**.
