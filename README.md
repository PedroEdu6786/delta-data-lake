# Arkham Project - Microservices Architecture

A NestJS-based microservices system demonstrating secure inter-service communication and permission management.

## Architecture Overview

This project consists of two microservices:
- **Microservice A**: Data Lake explorer
- **Microservice B**: Authentication, permissions and authorization service

## BIG BOY Design Decisions

### 1. Shared Library (`@arkham/auth`)
- **Code Reuse**: Common authentication logic shared between services
- **Consistency**: Ensures uniform JWT handling across services
- **Maintainability**: Single source of truth for auth-related code
- **Improvements**: For the future would've liked to make it completely independent from NestJS and use it in other projects

### 2. Microservice A
- **Streamed Responses**: Added stream responses for query executions
- **Limited Support**: For the moment just made sure to support mysql and postresql
- **SQL Parsing**: Opted to use sqlglot for SQL parsing and validation, it's very easy to extend and customize. Mainly selected it because of the big complexity it can be to parse queries, no similar support on JS/TS.
- **Improvements**: Migrate entirely to python for query parsing/validations, add support for more SQL dialects, add support for more complex queries (UNIONS, JOINS, etc.)

### 3. Nestjs
Technology of choice due to **familiarity** to it, removes complexity on authentication management, easy to scale and maintain.
- **Improvements**: Migrate to Fastify due to easiness on query management implementations.
  
### 4. AWS
- **Performance**: Left MaxResults for Athena as 5 so the stream is more visible with less data.
- 
### 5. Cache and Kafka
This wasn't part of my implementation due to time availability on my part, but felt like I should mentioned it since it's a very straight forward implementation.
- **Cache**: This would've been easily implemented using Redis or any other cache solution on microservice-a to store the current user permission's tables, so it doesn't need to query the database every time.
- **Kafka**: This could've been added on both microservices, for microservice-b would've required an endpoint to update a user's access permissions to a table and emit an event into kafka, and microservice-a would've subscribed to that topic to update it's cache and invalidate it's cache. Making the next request require to query the DB and check if the user has access to the tables. 

## Getting Started

### Assumptions
- Tables on data lake are added to the `tables` for permission management. All tables by default are not accessible
- Queries passed to the microservice-a are URLEncoded

### Prerequisites
- Node.js 22.16.0+
- MySql
- AWS
- Yarn
- Docker

### Installation

#### Docker
```bash
# Add aws env variables to .env file

# Install dependencies
yarn install

# Start project and execute on docker
yarn start:docker
```

#### Local
```bash
# Log into your aws account
# !IMPORTANT remove profile value to single quotes from localdev.yml if want to use default profile
aws configure

# Can setup an aws profile, by local definition it expect 'personal', but can change on the localdev.yml file on microservice-a
aws configure --profile personal

# Install dependencies
yarn install

# Start microservice-a (Optional)
yarn start:a

# Start microservice-b (Optional)
yarn start:b

# Start all services (Optional)
yarn start:all

# /microservices-b to seed users and tables and permissions
yarn seed
```

### Environment Variables
- Variables available on default.yml are for docker and local executions
- Variables available on localdev.yml are for local executions

## API Endpoints

### Microservice B (Port 3001)
- `POST /auth/login` - User authentication
  - **Body**: `{ "email": "string", "password": "string" }`
  - **Response**: `{ "access_token": "string" }`

- `POST /permissions/check` - Get user permissions for tables (protected)
  - **Headers**: `Authorization: Bearer <token>`
  - **Body**: `{ "tables": ["string"] }`
  - **Response**: `{ "allowed": boolean, "deniedTables": ["string"] }`

### Microservice A (Port 3000)
- `GET /query` - Execute SQL query (protected)
  - **Headers**: `Authorization: Bearer <token>`
  - **Query Params**: 
    - `q` (required): URL-encoded SQL query string
    - `page` (optional): Page number (default: 1)
    - `limit` (optional): Items per page (default: 50)
  - **Response**: Streaming JSON array with query results
