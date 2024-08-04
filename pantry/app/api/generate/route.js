import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);

const generationConfig = {
  temperature: 0.8,
  topP: 1,
  topK: 1,
  maxOutputTokens: 2048,
};

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  generationConfig,
});

async function generateContent(imageData) {
  const imageFormat = imageData.toString("base64");
  const parts = [
    {
      text: "What is in the image in one word, no punctuations or periods please",
    },
    {
      inlineData: {
        mimeType: "image/jpeg",
        data: imageFormat,
      },
    },
  ];
  const data = await model.generateContent({
    contents: [{ role: "user", parts }],
  });
  const result = await data.response;
  const text = await result.text();
  return text;
}

export async function POST(req) {
  try {
    const { image } = await req.json();
    const buffer = Buffer.from(image.data, "base64");
    const recognizedText = await generateContent(buffer);
    return NextResponse.json({ response: { text: recognizedText } });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
