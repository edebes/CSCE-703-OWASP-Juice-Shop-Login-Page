"use strict";

const { createServer } = require("node:http");
const { readFile } = require("node:fs/promises");
const { join } = require("node:path");

const HOST = "127.0.0.1";
const PORT = Number(process.env.PORT || 3001);
const MAX_BODY_BYTES = 8192;
const CONTENT_TYPES = {
  "/": "text/html; charset=utf-8",
  "/login.html": "text/html; charset=utf-8",
  "/login.js": "text/javascript; charset=utf-8",
};

// Server-side validation/logic

class RequestBodyTooLargeError extends Error {}

// Sends a JSON response with the given status code and data
function sendJson(response, statusCode, data) {
  response.writeHead(statusCode, {
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
  });
  response.end(JSON.stringify(data));
}

// Reads the request and formats it as a json, checking if it is too big or incorrectly formatted
async function readJsonBody(request) {
  const chunks = [];
  let size = 0;

  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      throw new RequestBodyTooLargeError("Request body is too large.");
    }
    chunks.push(chunk);
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

// Validates the credentials
function validateCredentials(payload) {
  const errors = [];
  const email = payload.email;
  const password = payload.password;

  if (typeof email !== "string" || email.trim() === "") {
    errors.push("Email is required.");
  } else if (!email.includes("@")) {
    errors.push('Email must contain "@".');
  }

  if (typeof password !== "string" || password === "") {
    errors.push("Password is required.");
  } else if (password.length < 8) {
    errors.push("Password must be at least 8 characters.");
  }

  return errors;
}

// Handles the login request, validating the credentials and sending a response
async function handleLogin(request, response) {
  if (request.headers["content-type"]?.split(";")[0] !== "application/json") {
    sendJson(response, 415, {
      valid: false,
      errors: ["Request content type must be application/json."],
    });
    return;
  }

  let payload;
  try {
    payload = await readJsonBody(request);
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      sendJson(response, 413, {
        valid: false,
        errors: ["Request body is too large."],
      });
      return;
    }
    if (error instanceof SyntaxError) {
      sendJson(response, 400, {
        valid: false,
        errors: ["Request body must contain valid JSON."],
      });
      return;
    }

    console.error("Failed to read login request:", error);
    sendJson(response, 500, {
      valid: false,
      errors: ["The validation server could not process the request."],
    });
    return;
  }

  if (
    typeof payload !== "object" ||
    payload === null ||
    Array.isArray(payload)
  ) {
    sendJson(response, 400, {
      valid: false,
      errors: ["Request body must be a JSON object."],
    });
    return;
  }

  const errors = validateCredentials(payload);
  if (errors.length > 0) {
    sendJson(response, 400, { valid: false, errors });
    return;
  }

  sendJson(response, 200, {
    valid: true,
    message:
      "Input passed server-side validation. Login is successful.",
  });
}

// Creates the server and handles requests
const server = createServer(async (request, response) => {
  const pathname = new URL(request.url, `http://${HOST}:${PORT}`).pathname;

  if (pathname === "/api/login") {
    if (request.method !== "POST") {
      response.writeHead(405, {
        Allow: "POST",
        "Content-Type": "text/plain; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
      });
      response.end("Method not allowed.");
      return;
    }

    await handleLogin(request, response);
    return;
  }

  if (request.method !== "GET" || !CONTENT_TYPES[pathname]) {
    response.writeHead(404, {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    });
    response.end("Not found.");
    return;
  }

  const fileName = pathname === "/" ? "login.html" : pathname.slice(1);
  try {
    const contents = await readFile(join(__dirname, fileName));
    response.writeHead(200, {
      "Cache-Control": "no-store",
      "Content-Type": CONTENT_TYPES[pathname],
      "X-Content-Type-Options": "nosniff",
    });
    response.end(contents);
  } catch (error) {
    console.error(`Failed to serve ${fileName}:`, error);
    response.writeHead(500, {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    });
    response.end("The page could not be served.");
  }
});

// Starts the server and listens for requests
server.listen(PORT, HOST, () => {
  console.log(`OWASP Juice Shop listening at http://${HOST}:${PORT}`);
});
