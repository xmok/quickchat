from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from stream_chat import StreamChat
import os
from typing import Optional
from dotenv import load_dotenv

load_dotenv()
app = FastAPI()

STREAM_API_KEY = os.getenv("STREAM_API_KEY", "")
STREAM_API_SECRET = os.getenv("STREAM_API_SECRET", "")
CHAT_APP_URL = os.getenv("CHAT_APP_URL", "")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[CHAT_APP_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


if not STREAM_API_KEY or not STREAM_API_SECRET:
    raise ValueError("STREAM_API_KEY and STREAM_API_SECRET must be set in environment variables")

stream_client = StreamChat(api_key=STREAM_API_KEY, api_secret=STREAM_API_SECRET)

class UserAuth(BaseModel):
    id: str
    name: Optional[str] = None

@app.post("/auth/register")
async def register(user: UserAuth):
    try:
        # Check if user exists
        existing_user = stream_client.query_users({"id": user.id})
        if existing_user["users"]:
            raise HTTPException(status_code=400, detail="User already registered")
        
        # Create a new Stream chat user
        stream_client.upsert_user({
            "id": user.id,
            "name": user.name or user.id,
        })
        
        # Generate Stream token
        token = stream_client.create_token(user.id)
        
        return {
            "message": "User created successfully",
            "stream_token": token,
            "user_id": user.id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/auth/login")
async def login(user: UserAuth):
    try:
        # Check if user exists in Stream
        existing_user = stream_client.query_users({"id": user.id})
        if not existing_user["users"]:
            raise HTTPException(status_code=400, detail=f"User '{user.id}' not found")
        
        # Generate Stream token
        token = stream_client.create_token(user.id)
        
        return {
            "stream_token": token,
            "user_id": user.id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)