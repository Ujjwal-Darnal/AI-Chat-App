// Send the conversation to the backend and stream the AI response
export async function getAIResponse(
  messages,
  onChunk,
  signal
) {
  // Send the full conversation history to the backend
  const response = await fetch(
    "http://localhost:5000/api/chat",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages,
      }),
      signal,
    }
  );

  // Throw an error if the request failed
  if (!response.ok) {
    throw new Error(
      "Unable to fetch AI response."
    );
  }

  // Ensure the browser supports streaming responses
  if (!response.body) {
    throw new Error(
      "Streaming is not supported in this browser."
    );
  }

  // Create a reader to read the response stream chunk by chunk
  const reader = response.body.getReader();

  // Decode binary chunks into readable text
  const decoder = new TextDecoder();

  // Store the complete response as it is received
  let completeResponse = "";

  while (true) {
    // Read the next chunk from the stream
    const { value, done } =
      await reader.read();

    // Exit the loop when the stream has finished
    if (done) {
      break;
    }

    // Convert the binary chunk into a text string
    const chunk = decoder.decode(value, {
      stream: true,
    });

    // Build the complete response
    completeResponse += chunk;

    // Send the latest chunk back to the React app
    onChunk(chunk);
  }

  // Return the complete response after streaming finishes
  return completeResponse;
}