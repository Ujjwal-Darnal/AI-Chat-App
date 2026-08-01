const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() ||
  "http://localhost:5000";

/**
 * Sends the conversation to the backend and streams
 * the assistant response one chunk at a time.
 */
export async function getAIResponse(
  messages,
  onChunk,
  signal
) {
  if (
    !Array.isArray(messages) ||
    messages.length === 0
  ) {
    throw new Error(
      "Invalid conversation data."
    );
  }

  if (typeof onChunk !== "function") {
    throw new Error(
      "A streaming callback is required."
    );
  }

  let response;

  try {
    response = await fetch(
      `${API_BASE_URL}/api/chat`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          messages,
        }),

        signal,
      }
    );
  } catch (requestError) {
    // Preserve cancellation so the UI does not show a false error.
    if (
      requestError.name ===
      "AbortError"
    ) {
      throw requestError;
    }

    throw new Error(
      "Unable to connect to the server."
    );
  }

  if (!response.ok) {
    let errorMessage =
      "Unable to generate a response.";

    try {
      const errorData =
        await response.json();

      errorMessage =
        errorData.error ||
        errorData.message ||
        errorMessage;
    } catch {
      // Keep the fallback when the server does not return JSON.
    }

    throw new Error(errorMessage);
  }

  if (!response.body) {
    throw new Error(
      "Streaming is not supported in this browser."
    );
  }

  const reader =
    response.body.getReader();

  const decoder = new TextDecoder();

  let completeResponse = "";

  try {
    while (true) {
      const { value, done } =
        await reader.read();

      if (done) {
        break;
      }

      const chunk = decoder.decode(
        value,
        {
          stream: true,
        }
      );

      if (!chunk) {
        continue;
      }

      completeResponse += chunk;
      onChunk(chunk);
    }

    // Flush any remaining characters from the decoder.
    const finalChunk =
      decoder.decode();

    if (finalChunk) {
      completeResponse += finalChunk;
      onChunk(finalChunk);
    }

    return completeResponse;
  } finally {
    reader.releaseLock();
  }
}