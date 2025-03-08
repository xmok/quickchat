import { useState, useEffect, createContext } from 'react'
import { StreamChat } from 'stream-chat'
import { LoadingIndicator } from 'stream-chat-react'
import 'stream-chat-react/dist/css/v2/index.css'
import Auth from './views/Auth'
import ChatBox from './views/ChatBox'
// import "./styles/index.css";
import "./App.css";

interface AuthContextType {
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({ logout: () => {} });

const API_KEY = import.meta.env.VITE_STREAM_API_KEY
if (!API_KEY) {
  throw new Error('VITE_STREAM_API_KEY is not set in environment variables')
}

const client = StreamChat.getInstance(API_KEY)
const STORAGE_USER_KEY = "quickchat-user";

function App() {
  const [user, setUser] = useState<{ id: string; token: string } | null>(() => {
    // Check for saved user data
    const saved = localStorage.getItem(STORAGE_USER_KEY)
    return saved ? JSON.parse(saved) : null
  })
  const [clientReady, setClientReady] = useState(false)

  useEffect(() => {
    if (user) {
      const connectUser = async () => {
        try {
          console.log('Attempting to connect user:', user.id);
          await client.connectUser(
            { id: user.id, name: user.id },
            user.token
          )
          console.log('Successfully connected user:', user.id);
          setClientReady(true)
        } catch (error) {
          console.error('Error connecting user:', error);
          if (error instanceof Error) {
            console.error('Error details:', error.message);
          }
          // If connection fails, clear saved data and reset state
          localStorage.removeItem(STORAGE_USER_KEY)
          setUser(null)
          setClientReady(false)
        }
      }

      connectUser()

      // Proper cleanup function
      return () => {
        console.log('Cleaning up user connection');
        client.disconnectUser().then(() => {
          console.log('User disconnected successfully');
          setClientReady(false)
        }).catch(error => {
          console.error('Error during disconnect:', error);
        });
      }
    }
  }, [user])

  const handleAuth = (token: string, userId: string) => {
    const userData = { token, id: userId }
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(userData))
    setUser(userData)
  }

  const handleLogout = () => {
    console.log("logging out")
    client.disconnectUser()
    localStorage.removeItem(STORAGE_USER_KEY)
    setUser(null)
    setClientReady(false)
  }

  const AuthProvider = ({children}: {children: React.ReactNode}) => {
    return (
      <AuthContext.Provider value={{ logout: handleLogout }}>
        {children}
      </AuthContext.Provider>
    )
  }

  if (!user) {
    return <Auth onAuth={handleAuth} />
  }

  if (!clientReady) {
    return <LoadingIndicator />
  }

  return (
    <AuthProvider>
      <ChatBox
        apiKey={API_KEY}
        user={{ id: user.id, name: user.id }}
        userToken={user.token}
        onLogout={handleLogout}
      />
    </AuthProvider>
  )
}

export default App
