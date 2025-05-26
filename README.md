# Async skill api nodejs server example

[![GitHub license](https://img.shields.io/badge/license-Apache%202.0-blue)](./LICENSE)
[![Node version](https://img.shields.io/badge/nodejs-v18.19.1-blue)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/language-TypeScript-blue)](https://www.npmjs.com/package/typescript)

This is an example implementation of a Skill using the Skills Async API.

The Skills Async API provides a way for developers to create more advanced conversation interactions with your Digital People, by allowing you to send and receive messages asynchronously.

This provides more flexibility than the REST-based skill API when you want to go beyond simple request-response interactions. Example applications can be streaming multiple messages in the same turn, or allowing the skill to send messages to the user proactively.

## Pre-requisites

- [NodeJS v18+](https://nodejs.org/)

## Run the server

```sh
npm install
npm run serve
```

- You can try making modifications and adding your custom code for handling the various API requests and messages in `src/api/handlers`.
- You can debug the app in vscode using the `app` debug configuration.

## Serve for use with Studio

Localtunnel may be used to generate a public web address for your locally-running Skill, allowing DDNA Studio to connect to your Skill from a live Digital Person.

Generate a URL with a personalized subdomain using the following command, and then use this URL to configure the endpoints in your Skill Definition.

```sh
npx localtunnel --port 5000 --subdomain your-unique-id
```

## Customization: Context Injection

This template now supports a `/setContext` REST endpoint for injecting per-session context from your frontend or integration. Example usage:

```
POST http://localhost:5001/setContext
{
  "sessionId": "session_12345",
  "context": {
    "name": "John Doe",
    "jobTitle": "Software Engineer",
    "company": "Acme Corp",
    "stage": "technical",
    "difficulty": "expert"
  }
}
```

When a session starts, this context will be attached to the session and used to personalize responses in the conversation handler.

## Licensing

This repository is licensed under the Apache License, Version 2.0. See [LICENSE](./LICENSE) for the full license text.

## Issues

For any issues, please reach out to one of our Customer Success team members.
