# E-commerce App: Monolith vs Microservices (Cloud Computing Assignment 1)

Stack: React (Vite) + Node.js/Express + PostgreSQL, run with Docker Compose.

| | Monolith | Microservices |
|---|---|---|
| Backend | 1 Express app | product, cart, payment services |
| Database | 1 DB (`shop`) | 3 DBs (`productdb`, `cartdb`, `paymentdb`) |
| URL | http://localhost:8080 | http://localhost:8081 |

Pages: Home, Products, Cart, Payment. The same frontend is used in both; nginx routes
`/api/*` to the backend(s). The Payment service calls the Cart service over HTTP.

## Run
```
cd monolith && docker compose up --build        # http://localhost:8080
cd microservices && docker compose up --build   # http://localhost:8081
```
Stop: `docker compose down -v`
