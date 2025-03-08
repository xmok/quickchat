"""Agent for using Anthropic API style agents"""

import os
import asyncio
import random
from typing import Any, Optional, Dict
from anthropic import AsyncAnthropic
from models import NewMessageRequest, AICharacter
from helpers import create_bot_id, get_last_messages_from_channel

# Global dictionary to store active agents
agents: Dict[str, 'AnthropicAgent'] = {}

class AnthropicAgent:
    """Agent for using Anthropic API style agents"""

    def __init__(self, chat_client, channel, character: Optional[AICharacter] = None):
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("Anthropic API key is required")
        self.anthropic = AsyncAnthropic(api_key=api_key)
        self.chat_client = chat_client
        self.channel = channel
        self.character = character
        self.processing = False
        self.message_text = ""
        self.chunk_counter = 0
        self.turns_remaining = 0
        self.is_autonomous = False
        # Create bot ID in the format: ai-bot-{channel_id}-{character_name}
        character_suffix = character.id.lower() if character else 'bot'
        self.bot_id = f"ai-bot-{channel.id}-{character_suffix}"
        self._closed = False
        # Add this agent to the global dictionary
        agents[self.bot_id] = self
        # Also add a simplified version of the bot ID for compatibility
        simplified_bot_id = f"ai-bot-{character_suffix}"
        agents[simplified_bot_id] = self

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.dispose()

    async def dispose(self):
        """Dispose of the agent and cleanup resources"""
        if not self._closed:
            self._closed = True
            if hasattr(self, 'anthropic'):
                await self.anthropic.close()
            if hasattr(self, 'chat_client'):
                await self.chat_client.close()
            self.channel = None
            self.character = None
            # Remove both versions of the bot ID from the global dictionary
            if self.bot_id in agents:
                del agents[self.bot_id]
            simplified_bot_id = f"ai-bot-{self.character.id.lower() if self.character else 'bot'}"
            if simplified_bot_id in agents:
                del agents[simplified_bot_id]

    def _get_system_prompt(self) -> str:
        """Get the system prompt based on character personality"""
        if not self.character:
            return "You are a helpful AI assistant."
        
        return f"""You are {self.character.name}. {self.character.personality}
        Respond in character, maintaining the personality and style consistently.
        Keep responses concise but engaging, and stay true to the character's era and knowledge."""

    async def start_autonomous_conversation(self, other_agent: 'AnthropicAgent', max_turns: int):
        """Start an autonomous conversation with another agent"""
        if self._closed:
            raise RuntimeError("Agent has been disposed")
            
        self.is_autonomous = True
        other_agent.is_autonomous = True  # Set other agent to autonomous mode too
        self.turns_remaining = max_turns
        other_agent.turns_remaining = max_turns  # Set turns for other agent too
        
        # Start the conversation with an initial message
        if self.character:
            initial_message = self.character.initial_prompt
            try:
                # Get the full channel CID (type:id)
                channel_cid = f"{self.channel.channel_type}:{self.channel.id}"
                print(f"Starting autonomous conversation in channel: {channel_cid}")
                print(f"Initial message: {initial_message}")
                
                # Send the initial message directly
                simplified_bot_id = f"ai-bot-{self.character.id.lower()}"
                await self.channel.send_message(
                    {
                        "text": initial_message,
                        "ai_generated": True,
                        "user": {
                            "id": simplified_bot_id,
                            "name": self.character.name
                        }
                    },
                    simplified_bot_id
                )
                
                # Create a message request for the other agent
                new_message = NewMessageRequest(
                    cid=channel_cid,
                    type="regular",
                    message={
                        "text": initial_message,
                        "ai_generated": True,
                        "user": {
                            "id": simplified_bot_id,
                            "name": self.character.name
                        }
                    }
                )
                print(f"Sending initial message to other agent: {initial_message}")
                # Let the other agent handle this message
                await other_agent.handle_message(new_message)
            except Exception as e:
                print(f"Error starting autonomous conversation: {e}")
                print(f"Channel info - Type: {self.channel.channel_type}, ID: {self.channel.id}")
                raise

    async def handle_message(self, event: NewMessageRequest):
        """Handle a new message"""
        if self._closed:
            raise RuntimeError("Agent has been disposed")

        # Print debug information about available agents and message
        print(f"Available agents: {list(agents.keys())}")
        sender_id = event.message.get('user', {}).get('id')
        print(f"Message from: {sender_id}")
        print(f"Current agent bot ID: {self.bot_id}")
        print(f"Current agent simplified bot ID: ai-bot-{self.character.id.lower() if self.character else 'bot'}")
        print(f"Is autonomous: {self.is_autonomous}, Turns remaining: {self.turns_remaining}")
        print(f"Channel CID: {event.cid}")
        print(f"Received message text: {event.message.get('text', '')}")

        self.processing = True
        self.message_text = ""
        self.chunk_counter = 0

        try:
            if not self.anthropic:
                print("Anthropic SDK is not initialized")
                return

            if not event.message:
                print("Skip handling empty message event")
                return

            # For autonomous conversations, we should process AI-generated messages
            is_ai_message = event.message.get("ai_generated", False)
            if is_ai_message and not self.is_autonomous:
                print("Skip handling ai generated message in non-autonomous mode")
                return

            message_text = event.message.get("text", "")
            if not message_text:
                print("Skip handling empty message text")
                return

            messages = await get_last_messages_from_channel(
                self.chat_client, event.cid, 5
            )

            try:
                if messages and messages[0]["content"] != message_text:
                    messages.insert(0, {
                        "role": "user" if not is_ai_message else "assistant",
                        "content": message_text
                    })
            except IndexError as error:
                print("No messages found in channel: ", error)
                messages = [{
                    "role": "user" if not is_ai_message else "assistant",
                    "content": message_text
                }]

            # If the message has a parent_id it is part of a threaded message
            if "parent_id" in event.message:
                messages.append({
                    "role": "user" if not is_ai_message else "assistant",
                    "content": message_text
                })

            # Use simplified bot ID for sending messages
            simplified_bot_id = f"ai-bot-{self.character.id.lower() if self.character else 'bot'}"
            
            # Create initial empty message with proper flags
            channel_message = await self.channel.send_message(
                {
                    "text": "",
                    "ai_generated": True,
                    "user": {
                        "id": simplified_bot_id,
                        "name": self.character.name if self.character else "AI Bot"
                    }
                },
                simplified_bot_id
            )
            message_id = channel_message["message"]["id"]
            print(f"Created initial message with ID: {message_id}")

            try:
                if message_id:
                    await self.channel.send_event(
                        {
                            "type": "ai_indicator.update",
                            "ai_state": "AI_STATE_THINKING",
                            "message_id": message_id,
                        },
                        simplified_bot_id,
                    )
                    print("Set thinking indicator")

                system_prompt = self._get_system_prompt()
                print(f"Using system prompt: {system_prompt}")
                print(f"Message history: {messages}")

                async with self.anthropic as client:
                    anthropic_stream = await client.messages.create(
                        max_tokens=1024,
                        messages=list(reversed(messages)),
                        model="claude-3-5-sonnet-20241022",
                        system=system_prompt,
                        stream=True,
                    )

                    async for message_stream_event in anthropic_stream:
                        await self.handle(message_stream_event, message_id, simplified_bot_id)

                await self.channel.send_event(
                    {
                        "type": "ai_indicator.clear",
                        "message_id": message_id,
                    },
                    simplified_bot_id,
                )

                # Handle autonomous conversation continuation
                if self.is_autonomous and self.turns_remaining > 0:
                    self.turns_remaining -= 1
                    print(f"Turns remaining for {simplified_bot_id}: {self.turns_remaining}")
                    
                    if self.turns_remaining > 0:
                        # Add a natural delay between messages
                        await asyncio.sleep(random.uniform(2, 5))
                        # Find the other agent in the conversation
                        other_agents = [a for a in agents.values() 
                                      if a.channel.id == self.channel.id 
                                      and a.bot_id != self.bot_id
                                      and not a._closed]
                        if other_agents:
                            other_agent = other_agents[0]
                            print(f"Found other agent: {other_agent.bot_id}")
                            
                            # Send the message directly first
                            await self.channel.send_message(
                                {
                                    "text": self.message_text,
                                    "ai_generated": True,
                                    "user": {
                                        "id": simplified_bot_id,
                                        "name": self.character.name if self.character else "AI Bot"
                                    }
                                },
                                simplified_bot_id
                            )
                            
                            # Create a new message request for the other agent
                            new_message = NewMessageRequest(
                                cid=event.cid,  # Use the original channel CID
                                type="regular",
                                message={
                                    "text": self.message_text,
                                    "ai_generated": True,
                                    "user": {
                                        "id": simplified_bot_id,
                                        "name": self.character.name if self.character else "AI Bot"
                                    }
                                }
                            )
                            print(f"Sending message to other agent: {self.message_text}")
                            # Reset message text for next response
                            self.message_text = ""
                            # Let the other agent handle this message
                            await other_agent.handle_message(new_message)
                        else:
                            print("No other agent found for autonomous conversation")

            except Exception as error:
                print("Failed during message handling:", error)
                print(f"Channel CID: {event.cid}")
                await self.channel.send_event(
                    {
                        "type": "ai_indicator.update",
                        "ai_state": "AI_STATE_ERROR",
                        "message_id": message_id,
                    },
                    simplified_bot_id,
                )
        finally:
            self.processing = False

    async def handle(self, message_stream_event: Any, message_id: str, bot_id: str):
        """Handle a message stream event"""
        if self._closed:
            raise RuntimeError("Agent has been disposed")

        event_type = message_stream_event.type
        print(f"Handling event type: {event_type}")

        try:
            if event_type == "message_start":
                print("Message generation starting")
                await self.channel.send_event(
                    {
                        "type": "ai_indicator.update",
                        "ai_state": "AI_STATE_GENERATING",
                        "message_id": message_id,
                    },
                    bot_id,
                )

            elif event_type == "content_block_start":
                print("Content block starting")
                # No need to send another indicator event

            elif event_type == "content_block_delta":
                if message_stream_event.delta.type != "text_delta":
                    return

                delta_text = message_stream_event.delta.text
                self.message_text += delta_text
                self.chunk_counter += 1
                
                print(f"Received chunk {self.chunk_counter}: {delta_text}")
                print(f"Current message text: {self.message_text}")

                # Update more frequently at the start, then less frequently
                should_update = (
                    self.chunk_counter <= 5 or  # Always update first 5 chunks
                    self.chunk_counter % 5 == 0  # Then update every 5 chunks
                )

                if should_update:
                    try:
                        print(f"Updating message (chunk {self.chunk_counter})")
                        await self.chat_client.update_message_partial(
                            message_id,
                            {
                                "set": {
                                    "text": self.message_text,
                                    "ai_generated": True,
                                    "user": {
                                        "id": bot_id,
                                        "name": self.character.name if self.character else "AI Bot"
                                    }
                                }
                            },
                            bot_id,
                        )
                    except Exception as error:
                        print(f"Error updating message: {error}")

            elif event_type == "content_block_stop":
                print("Content block complete")
                try:
                    await self.chat_client.update_message_partial(
                        message_id,
                        {
                            "set": {
                                "text": self.message_text,
                                "ai_generated": True,
                                "user": {
                                    "id": bot_id,
                                    "name": self.character.name if self.character else "AI Bot"
                                }
                            }
                        },
                        bot_id,
                    )
                except Exception as error:
                    print(f"Error updating message on block stop: {error}")

            elif event_type == "message_delta":
                print(f"Message delta received: {self.message_text}")
                try:
                    await self.chat_client.update_message_partial(
                        message_id,
                        {
                            "set": {
                                "text": self.message_text,
                                "ai_generated": True,
                                "user": {
                                    "id": bot_id,
                                    "name": self.character.name if self.character else "AI Bot"
                                }
                            }
                        },
                        bot_id,
                    )
                except Exception as error:
                    print(f"Error updating message on delta: {error}")

            elif event_type == "message_stop":
                print(f"Message complete, final text: {self.message_text}")
                if not self.message_text.strip():
                    print("Warning: Empty message text at completion")
                
                try:
                    # Ensure the final message is sent
                    await self.chat_client.update_message_partial(
                        message_id,
                        {
                            "set": {
                                "text": self.message_text,
                                "ai_generated": True,
                                "user": {
                                    "id": bot_id,
                                    "name": self.character.name if self.character else "AI Bot"
                                }
                            }
                        },
                        bot_id,
                    )
                    
                    # Clear the AI indicator
                    await self.channel.send_event(
                        {
                            "type": "ai_indicator.clear",
                            "message_id": message_id,
                        },
                        bot_id,
                    )
                except Exception as error:
                    print(f"Error updating final message: {error}")

            else:
                print(f"Unhandled event type: {event_type}")
        
        except Exception as error:
            print(f"Error handling message event {event_type}: {error}")
            # Try to send error state
            try:
                await self.channel.send_event(
                    {
                        "type": "ai_indicator.update",
                        "ai_state": "AI_STATE_ERROR",
                        "message_id": message_id,
                    },
                    bot_id,
                )
            except:
                pass  # Ignore errors in error handling