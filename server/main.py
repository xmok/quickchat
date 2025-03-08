from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from stream_chat import StreamChat, StreamChatAsync
import os
import json
from typing import Optional, List
from dotenv import load_dotenv
from models import UserAuth, StartAgentRequest, StopAgentRequest, NewMessageRequest, AICharacter, StartAIConversationRequest
from helpers import clean_channel_id, create_bot_id
from agent import AnthropicAgent
from personalities import PREDEFINED_CHARACTERS
import asyncio
import random

load_dotenv()
app = FastAPI()

STREAM_API_KEY = os.getenv("STREAM_API_KEY", "")
STREAM_API_SECRET = os.getenv("STREAM_API_SECRET", "")
CHAT_APP_URL = os.getenv("CHAT_APP_URL", "")

# Add CORS middleware with proper origin handling
origins = [CHAT_APP_URL]
if CHAT_APP_URL and "," in CHAT_APP_URL:
    origins = [origin.strip() for origin in CHAT_APP_URL.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if not STREAM_API_KEY or not STREAM_API_SECRET:
    raise ValueError("STREAM_API_KEY and STREAM_API_SECRET must be set in environment variables")

stream_client = StreamChat(api_key=STREAM_API_KEY, api_secret=STREAM_API_SECRET)

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

agents = {}

@app.post("/start-ai-agent")
async def start_ai_agent(request: StartAgentRequest, response: Response):
    """
    This endpoint starts an AI agent for a given channel.
    It creates a bot user and adds it to the channel.
    It also creates an agent and adds it to the agents dictionary.
    """
    server_client = StreamChatAsync(api_key=STREAM_API_KEY, api_secret=STREAM_API_SECRET)

    # Clean up channel id to remove the channel type - if necessary
    channel_id_updated = clean_channel_id(request.channel_id)

    # Create a bot id
    bot_id = create_bot_id(channel_id=channel_id_updated)

    # Upsert the bot user
    await server_client.upsert_user(
        {
            "id": bot_id,
            "name": "AI Bot",
            "role": "admin",
        }
    )

    # Create a channel
    channel = server_client.channel(request.channel_type, channel_id_updated)

    # Add the bot to the channel
    try:
        await channel.add_members([bot_id])
    except Exception as error:
        print("Failed to add members to the channel: ", error)
        await server_client.close()
        response.status_code = 405
        response.body = str.encode(
            json.dumps({"error": "Not possible to add the AI to distinct channels"})
        )
        return response

    # Create an agent
    agent = AnthropicAgent(server_client, channel)

    if bot_id in agents:
        print("Disposing agent")
        await agents[bot_id].dispose()
    else:
        agents[bot_id] = agent

    return {"message": "AI agent started"}


@app.post("/stop-ai-agent")
async def stop_ai_agent(request: StopAgentRequest):
    """Stop an AI agent and clean up resources"""
    server_client = StreamChatAsync(api_key=STREAM_API_KEY, api_secret=STREAM_API_SECRET)
    try:
        bot_id = create_bot_id(request.channel_id)
        
        if bot_id in agents:
            await agents[bot_id].dispose()
            del agents[bot_id]
        
        channel = server_client.channel("messaging", request.channel_id)
        await channel.remove_members([bot_id])
        return {"message": "AI agent stopped"}
    finally:
        await server_client.close()


@app.post("/new-message")
async def new_message(request: NewMessageRequest):
    """
    This endpoint handles a new message from the client.
    It cleans the channel id and creates a bot id.
    It then checks if the bot id is in the agents dictionary and if it is, it handles the message.
    """
    print(request)
    if not request.cid:
        return {"error": "Missing required fields", "code": 400}

    channel_id = clean_channel_id(request.cid)
    bot_id = create_bot_id(channel_id=channel_id)

    if bot_id in agents:
        if not agents[bot_id].processing:
            await agents[bot_id].handle_message(request)
        else:
            print("AI agent is already processing a message")
    else:
        print("AI agent not found for bot", bot_id)


@app.get("/get-ai-agents")
async def get_ai_agents():
    """
    This endpoint returns a list of all the AI agents.
    """
    return {"agents": list(agents.keys())}

@app.post("/start-ai-conversation")
async def start_ai_conversation(request: StartAIConversationRequest):
    """Start an autonomous conversation between AI characters"""
    if len(request.character_ids) != 2:
        raise HTTPException(status_code=400, detail="Exactly 2 characters are required")
    
    # Validate and get characters
    characters = []
    for char_id in request.character_ids:
        character = PREDEFINED_CHARACTERS.get(char_id)
        if not character:
            raise HTTPException(status_code=400, detail=f"Character {char_id} not found")
        characters.append(character)
    
    server_client = StreamChatAsync(api_key=STREAM_API_KEY, api_secret=STREAM_API_SECRET)
    channel = server_client.channel(request.channel_type, request.channel_id)
    
    # Create and setup agents
    bot_ids = []
    created_agents = []
    try:
        for character in characters:
            bot_id = create_bot_id(f"{request.channel_id}-{character.id}")
            bot_ids.append(bot_id)
            
            # Upsert bot user
            await server_client.upsert_user({
                "id": bot_id,
                "name": character.name,
                "role": "admin",
            })
            
            # Add to channel
            try:
                await channel.add_members([bot_id])
            except Exception as error:
                print(f"Failed to add {character.name} to channel: ", error)
                raise HTTPException(status_code=405, detail="Failed to add AI to channel")
        
        # Create agents
        agent1 = AnthropicAgent(server_client, channel, characters[0])
        agent2 = AnthropicAgent(server_client, channel, characters[1])
        created_agents.extend([agent1, agent2])
        
        # Store agents
        agents[bot_ids[0]] = agent1
        agents[bot_ids[1]] = agent2
        
        # Start the conversation
        await agent1.start_autonomous_conversation(agent2, request.max_turns)
        
        return {
            "message": "AI conversation started",
            "characters": [c.name for c in characters],
            "bot_ids": bot_ids
        }
    except Exception as e:
        # Clean up on error
        for agent in created_agents:
            await agent.dispose()
        for bot_id in bot_ids:
            if bot_id in agents:
                del agents[bot_id]
        await server_client.close()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/list-characters")
async def list_characters():
    """List all available AI characters"""
    return {
        "characters": [
            {
                "id": key,
                "name": char.name,
                "personality": char.personality,
                "initial_prompt": char.initial_prompt
            }
            for key, char in PREDEFINED_CHARACTERS.items()
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)