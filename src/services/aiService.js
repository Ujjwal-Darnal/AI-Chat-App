const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "http://localhost:5000";

export async function getAIResponse(
  messages,
  onChunk,
  signal
) {
  if (!Array.isArray(messages)) {
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
      // Keep the fallback message when the response is not JSON.
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