"use server";

export async function generateAIAnswer(question: string) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key is not configured");
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: question },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `OpenAI API Error: ${errorData.error?.message || "Unknown error"}`,
      );
    }

    const responseData = await response.json();

    if (!responseData.choices || !responseData.choices[0]) {
      throw new Error("No response from OpenAI");
    }

    return {
      success: true,
      reply: responseData.choices[0].message.content,
    };
  } catch (error: any) {
    console.error("AI Answer Generation Error:", error);
    return {
      success: false,
      error: error.message || "Failed to generate AI answer",
    };
  }
}
