from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn
import sys

app = FastAPI(title="MindMirror API")

class AnalyzeRequest(BaseModel):
    inputs: str

try:
    print("Loading Hugging Face model... This may take a minute depending on your internet connection.", flush=True)
    from transformers import AutoTokenizer, AutoModelForCausalLM
    import torch
    
    model_id = "amitava2004/smolified-mindmirror-ai"
    
    # Check if GPU is available to speed things up
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Using compute device: {device}", flush=True)
    
    tokenizer = AutoTokenizer.from_pretrained(model_id)
    # Using float16 if cuda is available, else default for cpu
    dtype = torch.float16 if device == "cuda" else torch.float32
    
    model = AutoModelForCausalLM.from_pretrained(model_id, torch_dtype=dtype).to(device)
    
    IS_MODEL_LOADED = True
    print("Model loaded successfully! Ready for analysis.", flush=True)
except Exception as e:
    print(f"CRITICAL ERROR loading model: {e}", file=sys.stderr)
    IS_MODEL_LOADED = False

@app.post("/analyze")
async def analyze_emotions(req: AnalyzeRequest):
    if not IS_MODEL_LOADED:
        raise HTTPException(status_code=500, detail="The AI model failed to load. Please check your backend terminal for Python errors.")
    
    messages = [
        {"role": "user", "content": req.inputs},
    ]
    
    try:
        inputs = tokenizer.apply_chat_template(
            messages,
            add_generation_prompt=True,
            tokenize=True,
            return_dict=True,
            return_tensors="pt",
        ).to(model.device)
        
        # Max new tokens increased significantly to ensure full structural generation
        outputs = model.generate(**inputs, max_new_tokens=300)
        
        generated_text = tokenizer.decode(outputs[0][inputs["input_ids"].shape[-1]:], skip_special_tokens=True)
        
        # Format the response in the exact same signature that Next.js parser is already expecting
        return [{"generated_text": generated_text}]
        
    except Exception as e:
        print(f"Exception during text generation: {e}", file=sys.stderr)
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

# Add a health check
@app.get("/")
def health_check():
    return {"status": "ok", "model_loaded": IS_MODEL_LOADED}

if __name__ == "__main__":
    # Runs the local model server on port 5000
    uvicorn.run(app, host="0.0.0.0", port=5000)
