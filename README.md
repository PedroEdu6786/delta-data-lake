# Arkham Project - Microservices Architecture

A NestJS-based microservices system demonstrating secure inter-service communication and permission management.

## Architecture Overview

This project consists of two microservices:
- **Microservice A**: Data Lake explorer
- **Microservice B**: Authentication, permissions and authorization service

## BIG Design Decisions

### 1. Shared Library (`@arkham/auth`)
- **Code Reuse**: Common authentication logic shared between services
- **Consistency**: Ensures uniform JWT handling across services
- **Maintainability**: Single source of truth for auth-related code
- **Improvements**: For the future would've liked to make it completely independent from NestJS and use it in other projects

### 2. Microservice A
- **Streamed Responses**: Added stream responses for query executions
- **Limited Support**: For the moment just made sure to support mysql and postresql
- **Single Query Execution**: Just supports for the moment simple select queries, avoided UNIONS and JOINS for complexity simplicity
- **SQL Parsing**: Opted to use sqlglot for SQL parsing and validation, it's very easy to extend and customize. Mainly selected it because of the big complexity it can be to parse queries, no similar support on JS/TS.
- **Improvements**: Migrate entirely to python for query parsing/validations, add support for more SQL dialects, add support for more complex queries (UNIONS, JOINS, etc.)

### 3. Nestjs
Technology of choice due to familiarity to it, removes complexity on authentication management, easy to scale and maintain.
- **Improvements**: Migrate to Fastify due to easiness on query management implementations.
  
### 4. AWS
- **Performance**: Left MaxResults for Athena as 5 so the stream is more visible with less data.

## Challenge Aspects Addressed

### 1. Microservices Communication
- **Solution**: HTTP-based REST API calls between services
- **Benefits**: Simple, well-understood protocol with built-in error handling

### 2. Authentication & Authorization
- **Solution**: JWT tokens with role-based permissions
- **Benefits**: Stateless, scalable, and secure

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

### Microservice A (Port 3000)
- `POST /auth/login` - User authentication
- `GET /auth/profile` - Get user profile (protected)

### Microservice B (Port 3001)
- `POST /permissions/check` - Check table permissions (protected)
