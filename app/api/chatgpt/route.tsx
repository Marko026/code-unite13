import { NextResponse } from "next/server";

export const POST = async (request: Request) => {
  const { question } = await request.json();
  try {
    const response = await fetch(
      "https://code-unite13-gml3zz1gs-marko026.vercel.app//api.openai.com/v1/chat/completions",
      {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",

          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: `Tell me ${question}` },
          ],
        }),
      },
    );
    const responseData = await response.json();

    const reply = responseData.choices[0].message.content;
    return NextResponse.json({ reply });
  } catch (error: any) {
    console.log(error);
    return NextResponse.json({ error: error.message });
  }
};
