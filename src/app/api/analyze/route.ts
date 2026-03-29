import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { inputs } = await request.json();

    if (!inputs) {
      return NextResponse.json({ error: "No input provided" }, { status: 400 });
    }

    const hfToken = process.env.HF_TOKEN || process.env.HUGGINGFACE_API_KEY;
    const response = await fetch("http://localhost:5000/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs }),
    });

    if (!response.ok) {
      // Fetch the exact error payload from Hugging Face APIs
      const errorText = await response.text();
      console.error(`\n=== HUGGING FACE API ERROR ===`);
      console.error(`Status code: ${response.status} ${response.statusText}`);
      console.error(`Error details:`, errorText);
      console.error(`================================\n`);
      
      // If HF returns an error, return a graceful fallback for demo purposes.
      const fallbackText = `Intent: Seeking clarity and support\nEmotion: Confused but hopeful\nHidden Need: Reassurance and clear direction\nResponse: I hear that you are going through a tough time right now. Remember that it's okay to feel this way. Let's take it one step at a time!`;
      
      return NextResponse.json([{ generated_text: fallbackText }]);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Analysis API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
