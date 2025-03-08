import React, { useState, useEffect } from 'react';
import { aiService, AICharacter } from '../../services/ai';
import './AIControls.css';

interface AIControlsProps {
  channelId: string;
  onError?: (error: Error) => void;
}

export const AIControls: React.FC<AIControlsProps> = ({ channelId, onError }) => {
  const [characters, setCharacters] = useState<AICharacter[]>([]);
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCharacters();
  }, []);

  const loadCharacters = async () => {
    try {
      const chars = await aiService.listCharacters();
      setCharacters(chars);
    } catch (error) {
      console.error('Failed to load characters:', error);
      onError?.(error as Error);
    }
  };

  const handleStartSingleAI = async (characterId: string) => {
    setLoading(true);
    try {
      await aiService.startAIAgent(channelId, characterId);
    } catch (error) {
      console.error('Failed to start AI agent:', error);
      onError?.(error as Error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartConversation = async () => {
    if (selectedCharacters.length !== 2) {
      alert('Please select exactly 2 characters');
      return;
    }

    setLoading(true);
    try {
      await aiService.startAIConversation({
        channel_id: channelId,
        character_ids: selectedCharacters,
      });
    } catch (error) {
      console.error('Failed to start AI conversation:', error);
      onError?.(error as Error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCharacterSelection = (characterId: string) => {
    setSelectedCharacters(prev => {
      if (prev.includes(characterId)) {
        return prev.filter(id => id !== characterId);
      }
      if (prev.length < 2) {
        return [...prev, characterId];
      }
      return prev;
    });
  };

  return (
    <div className="ai-controls">
      <h3>AI Characters</h3>
      <div className="character-list">
        {characters.map(character => (
          <div key={character.id} className="character-item">
            <div className="character-info">
              <h4>{character.name}</h4>
              <p>{character.personality}</p>
            </div>
            <div className="character-actions">
              <button
                onClick={() => handleStartSingleAI(character.id)}
                disabled={loading}
              >
                Chat with {character.name}
              </button>
              <input
                type="checkbox"
                checked={selectedCharacters.includes(character.id)}
                onChange={() => toggleCharacterSelection(character.id)}
                disabled={loading || (selectedCharacters.length >= 2 && !selectedCharacters.includes(character.id))}
              />
            </div>
          </div>
        ))}
      </div>
      {selectedCharacters.length > 0 && (
        <button
          className="start-conversation-btn"
          onClick={handleStartConversation}
          disabled={loading || selectedCharacters.length !== 2}
        >
          Start Conversation between Selected Characters
        </button>
      )}
    </div>
  );
}; 