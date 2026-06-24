# Swedbank Home Assigment

## Running with Docker

Requires [Docker](https://docs.docker.com/get-docker/)

```bash
docker compose up --build
```

| Service  | URL                          |
|----------|------------------------------|
| Frontend | http://localhost:4200        |
| Backend  | http://localhost:8080        |
| Swagger  | http://localhost:8080/swagger-ui/index.html |

---

## Running without Docker

### Prerequisites

- Java 25
- Maven
- Node.js + npm
- PostgreSQL 17 running locally on port **5432** with:
  - Database: `bankdb`
  - User: `postgres`
  - Password: `postgres`

### Database setup

Connect to PostgreSQL as a superuser and run:

```sql
CREATE DATABASE bankdb;
CREATE USER postgres WITH PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE bankdb TO postgres;
```

### Backend

```bash
cd backend
mvn spring-boot:run
```

### Frontend

```bash
cd frontend
npm install
npx ng serve
```