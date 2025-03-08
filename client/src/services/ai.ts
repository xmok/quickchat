import axios from 'axios';

const API_URL = import.meta.env.VITE_SERVER_URL;

export interface AICharacter {
  id: string;
  name: string;
  personality: string;
}

export interface StartAIConversationParams {
  channel_id: string;
  character_ids: string[];
  max_turns?: number;
}

export const aiService = {
  // Get list of available AI characters
  async listCharacters(): Promise<AICharacter[]> {
    const response = await axios.get(`${API_URL}/list-characters`);
    return response.data.characters;
  },

  // Start a single AI agent in a channel
  async startAIAgent(channelId: string, characterId?: string) {
    const response = await axios.post(`${API_URL}/start-ai-agent`, {
      channel_id: channelId,
      character_id: characterId
    });
    return response.data;
  },

  // Start an AI conversation between two characters
  async startAIConversation(params: StartAIConversationParams) {
    const response = await axios.post(`${API_URL}/start-ai-conversation`, params);
    return response.data;
  },

  // Stop an AI agent
  async stopAIAgent(channelId: string) {
    const response = await axios.post(`${API_URL}/stop-ai-agent`, {
      channel_id: channelId
    });
    return response.data;
  }
}; 