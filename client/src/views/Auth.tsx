import { useState, FormEvent } from 'react';
import axios from 'axios';

interface AuthProps {
  onAuth: (token: string, userId: string) => void;
}

const Auth = ({ onAuth }: AuthProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const endpoint = isLogin ? '/auth/login' : '/auth/register';
    
    try {
      console.log('Sending request to:', `${import.meta.env.VITE_SERVER_URL}${endpoint}`);
      console.log('Request payload:', {
        id: username,
        ...(isLogin ? {} : { name: displayName || username })
      });

      const response = await axios.post(`${import.meta.env.VITE_SERVER_URL}${endpoint}`, {
        id: username,
        ...(isLogin ? {} : { name: displayName || username })
      });

      console.log('Response:', response.data);
      onAuth(response.data.stream_token, response.data.user_id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('Auth error:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Authentication failed';
      setError(errorMessage);
      alert(errorMessage);
    }
  };

  return (
    <div style={{ maxWidth: '300px', margin: '100px auto', padding: '20px', color: 'white' }}>
      <img src="/icon.svg" alt="Logo" style={{ width: '100px', height: '100px', marginBottom: '20px' }} />
      <h2>{isLogin ? 'Login' : 'Register'}</h2>
      {error && (
        <div style={{ color: 'red', marginBottom: '10px', textAlign: 'center' }}>
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ padding: '8px' }}
          required
        />
        {!isLogin && (
          <input
            type="text"
            placeholder="Display Name (optional)"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            style={{  padding: '8px' }}
          />
        )}
        <button 
          type="submit" 
          style={{ width: '100%', padding: '8px' }}
          disabled={!username}
        >
          {isLogin ? 'Login' : 'Register'}
        </button>
      </form>
      <button
        onClick={() => {
          setIsLogin(!isLogin);
          setError('');
        }}
        style={{ width: '100%', marginTop: '10px', padding: '8px' }}
      >
        {isLogin ? 'Need to register?' : 'Already have an account?'}
      </button>
    </div>
  );
};

export default Auth; 