import pytest
from fastapi.testclient import TestClient
from main import app
from models import AICharacter, NewMessageRequest

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

@pytest.mark.asyncio
async def test_new_message():
    message_request = NewMessageRequest(
        cid="messaging:test",
        type="regular",
        message={
            "text": "Hello, test message",
            "user": {"id": "test-user"}
        }
    )
    response = client.post("/new-message", json=message_request.dict())
    assert response.status_code == 200