import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

if (!process.env.OPENAI_API_KEY) {
  throw new Error(
    "OPENAI_API_KEY is missing from the server environment."
  );
}

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use(
  cors({
    origin:
      process.env.CLIENT_URL ||
      "http://localhost:5173",
  })
);

app.use(
  express.json({
    limit: "1mb",
  })
);

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Backend is running.",
  });
});

app.post("/api/chat", async (req, res) => {
  const requestController =
    new AbortController();

  // Abort only when the incoming request is actually cancelled.
  req.on("aborted", () => {
    requestController.abort();
  });

  // Abort the OpenAI stream if the browser closes the response connection.
  res.on("close", () => {
    if (!res.writableEnded) {
      requestController.abort();
    }
  });

  try {
    const { messages } = req.body;

    if (
      !Array.isArray(messages) ||
      messages.length === 0
    ) {
      return res.status(400).json({
        error:
          "Messages must be a non-empty array.",
      });
    }

    const validMessages = messages
      .filter(
        (message) =>
          message &&
          ["user", "assistant"].includes(
            message.role
          ) &&
          typeof message.content ===
            "string" &&
          message.content.trim()
      )
      .map((message) => ({
        role: message.role,
        content: message.content.trim(),
      }));

    if (validMessages.length === 0) {
      return res.status(400).json({
        error:
          "No valid messages were provided.",
      });
    }

    const lastMessage =
      validMessages.at(-1);

    if (lastMessage.role !== "user") {
      return res.status(400).json({
        error:
          "The conversation must end with a user message.",
      });
    }

    const stream =
      await client.responses.create(
        {
          model: "gpt-4.1-mini",
          input: validMessages,
          stream: true,
        },
        {
          signal:
            requestController.signal,
        }
      );

    res.status(200);

    res.setHeader(
      "Content-Type",
      "text/plain; charset=utf-8"
    );

    res.setHeader(
      "Cache-Control",
      "no-cache, no-transform"
    );

    res.setHeader(
      "Connection",
      "keep-alive"
    );

    res.setHeader(
      "X-Content-Type-Options",
      "nosniff"
    );

    res.flushHeaders();

    for await (const event of stream) {
      if (
        event.type ===
        "response.output_text.delta"
      ) {
        res.write(event.delta);
      }
    }

    res.end();
  } catch (error) {
    if (
      error.name === "AbortError" ||
      requestController.signal.aborted
    ) {
      if (!res.writableEnded) {
        res.end();
      }

      return;
    }

    console.error(
      "Chat request failed:",
      error
    );

    if (res.headersSent) {
      if (!res.writableEnded) {
        res.end();
      }

      return;
    }

    if (error.status === 401) {
      return res.status(500).json({
        error:
          "The AI service is not configured correctly.",
      });
    }

    if (error.status === 429) {
      return res.status(429).json({
        error:
          "The AI service is busy. Please try again shortly.",
      });
    }

    if (
      error.status &&
      error.status >= 400 &&
      error.status < 500
    ) {
      return res.status(400).json({
        error:
          "The request could not be processed.",
      });
    }

    return res.status(500).json({
      error:
        "Something went wrong while generating the response.",
    });
  }
});

app.use((error, req, res, next) => {
  if (
    error instanceof SyntaxError &&
    error.status === 400 &&
    "body" in error
  ) {
    return res.status(400).json({
      error: "Invalid JSON request.",
    });
  }

  next(error);
});

app.listen(PORT, () => {
  console.log(
    `Server is running on port ${PORT}`
  );
});