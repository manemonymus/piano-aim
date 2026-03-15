from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

class ScoreSubmission(BaseModel):
    name: str
    score: int

@app.get("/leaderboard")
def get_leaderboard():
    response = supabase.table("scores").select("name, score, created_at").order("score", desc=True).limit(10).execute()
    return response.data

@app.post("/score")
@app.post("/score")
def submit_score(submission: ScoreSubmission):
    # check if name already exists
    existing = supabase.table("scores").select("score").eq("name", submission.name).execute()
    
    if existing.data:
        # only update if new score is higher
        if submission.score > existing.data[0]["score"]:
            supabase.table("scores").update({"score": submission.score}).eq("name", submission.name).execute()
            return {"updated": True}
        return {"updated": False}
    else:
        supabase.table("scores").insert({"name": submission.name, "score": submission.score}).execute()
        return {"inserted": True}