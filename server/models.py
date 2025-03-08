from pydantic import BaseModel
from typing import Optional, List

class UserAuth(BaseModel):
    id: str
    name: Optional[str] = None

class AICharacter(BaseModel):
    id: str
    name: str
    personality: str
    initial_prompt: str

class StartAgentRequest(BaseModel):
    channel_id: str
    channel_type: str = "messaging"
    character_id: Optional[str] = None

class StopAgentRequest(BaseModel):
    channel_id: str

class NewMessageRequest(BaseModel):
    cid: Optional[str]
    type: Optional[str]
    message: Optional[dict]

class StartAIConversationRequest(BaseModel):
    channel_id: str
    character_ids: List[str]
    channel_type: str = "messaging"
    max_turns: int = 10