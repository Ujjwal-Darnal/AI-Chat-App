export async function getAIResponse(messages) {
  const response = await fetch("http://localhost:5000/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages,
    }),
  });

  if (!response.ok) {
    throw new Error("Unable to fetch AI response");
  }

  const data = await response.json();

  return data.reply;
}