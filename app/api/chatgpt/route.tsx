import { NextResponse } from "next/server";

export const POST = async (request: Request) => {
  try {
    const { question } = await request.json();

    // Proveri da li je API ključ postavljen
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key is not configured" },
        { status: 500 },
      );
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
      console.error("OpenAI API Error:", errorData);
      return NextResponse.json(
        {
          error: `OpenAI API Error: ${errorData.error?.message || "Unknown error"}`,
        },
        { status: response.status },
      );
    }

    const responseData = await response.json();

    if (!responseData.choices || !responseData.choices[0]) {
      return NextResponse.json(
        { error: "No response from OpenAI" },
        { status: 500 },
      );
    }

    const reply = responseData.choices[0].message.content;
    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error("API Route Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
};
