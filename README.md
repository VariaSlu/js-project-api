# Project API

This project includes the packages and babel setup for an express server, and is just meant to make things a little simpler to get up and running with.

## Getting started

Install dependencies with `npm install`, then start the server by running `npm run dev`

## View it live

Every project should be deployed somewhere. Be sure to include the link to the deployed project so that the viewer can click around and see what it's all about.

# Happy Thoughts API

## Run locally
npm install
node server.js
# .env required:
MONGO_URL=mongodb+srv://varvaraslugina:1zqKjsfqPiWDBjkU@cluster0.cttoete.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0

JWT_SECRET=...

## Endpoints
GET    /                     -> API docs
GET    /thoughts             -> list latest 20
GET    /thoughts/:id         -> single thought
POST   /thoughts/:id/like    -> like
POST   /signup               -> create user
POST   /login                -> login (returns accessToken)
POST   /thoughts             -> create (JWT required)
PATCH  /thoughts/:id         -> update (JWT + author-only)
DELETE /thoughts/:id         -> delete (JWT + author-only)

## Deploy
Deployed on Render:
https://js-project-api-862g.onrender.com/
