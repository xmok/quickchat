import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from server.anthropic_agent import AnthropicAgent
from models import AICharacter, NewMessageRequest

@pytest.fixture
def mock_chat_client():
    return AsyncMock()

@pytest.fixture
def mock_channel():
    channel = AsyncMock()
    channel.id = "test-channel"
    channel.channel_type = "messaging"
    return channel

@pytest.fixture
def agent(mock_chat_client, mock_channel, test_character):
    return AnthropicAgent(mock_chat_client, mock_channel, test_character)

@pytest.mark.asyncio
async def test_agent_initialization(agent):
    assert agent.bot_id == "ai-bot-test-char"
    assert not agent.is_autonomous
    assert agent.turns_remaining == 0
    assert not agent._closed

@pytest.mark.asyncio
async def test_agent_dispose(agent):
    await agent.dispose()
    assert agent._closed
    assert agent.channel is None
    assert agent.character is None

@pytest.mark.asyncio
async def test_agent_handle_message(agent, mock_channel):
    # Create a test message
    message = NewMessageRequest(
        cid="messaging:test",
        type="regular",
        message={
            "text": "Hello, test message",
            "user": {"id": "test-user"}
        }
    )

    # Mock the message handling
    with patch('agent.get_last_messages_from_channel') as mock_get_messages:
        mock_get_messages.return_value = [
            {"content": "Previous message", "role": "user"}
        ]
        
        # Mock channel.send_message
        mock_channel.send_message.return_value = {
            "message": {"id": "test-message-id"}
        }
        
        # Test message handling
        await agent.handle_message(message)
        
        # Verify message was sent
        mock_channel.send_message.assert_called_once()
        
        # Verify event was sent
        mock_channel.send_event.assert_called()

@pytest.mark.asyncio
async def test_handle_empty_message(agent):
    message = NewMessageRequest(
        cid="messaging:test",
        type="regular",
        message={
            "text": "",
            "user": {"id": "test-user"}
        }
    )
    
    # Test handling empty message
    await agent.handle_message(message)
    agent.channel.send_message.assert_not_called()

@pytest.mark.asyncio
async def test_agent_cleanup(agent):
    # Test context manager
    async with agent as a:
        assert not a._closed
        await a.handle_message(NewMessageRequest(
            cid="messaging:test",
            type="regular",
            message={
                "text": "Test message",
                "user": {"id": "test-user"}
            }
        ))
    assert a._closed 