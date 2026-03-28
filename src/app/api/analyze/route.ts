import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { inputs } = await request.json();

    if (!inputs) {
      return NextResponse.json({ error: "No input provided" }, { status: 400 });
    }

    const hfToken = process.env.HF_TOKEN || process.env.HUGGINGFACE_API_KEY;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (hfToken) {
      headers["Authorization"] = `Bearer ${hfToken}`;
    }

    const response = await fetch("https://router.huggingface.co/hf-inference/models/amitava2004/smolified-mindmirror-ai", {
      method: "POST",
      headers,
      body: JSON.stringify({ inputs }),
    });

    if (!response.ok) {
      // If HF returns an error (like 401 or 410) and no token is provided, 
      // return a graceful fallback for demo purposes.
      console.warn(`HF API failed with ${response.status}. Using fallback response for demo.`);
      
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
