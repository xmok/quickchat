import { Channel, ChannelHeader, ChannelList, Chat, LoadingIndicator, MessageInput, MessageList, Thread, useCreateChatClient, Window } from 'stream-chat-react';
import 'stream-chat-react/dist/css/v2/index.css';
import '../styles/override.css'

type ChatBoxProps = {
  apiKey: string;
  user: { id: string; name?: string; image?: string };
  userToken: string | undefined;
};

const ChatBox = (props: ChatBoxProps) => {
  const { apiKey, user, userToken } = props;
  const chatClient = useCreateChatClient({
    apiKey,
    userData: user,
    tokenOrProvider: userToken,
  });
  
  if (!chatClient) {
    return <LoadingIndicator />
  }

  const channelListOptions = {
    filters: { type: 'messaging', members: { $in: [user.id] } },
    sort: { last_message_at: undefined },
    options: { state: true, presence: true, watch: true, limit: 10 }
  }
  return (
    <Chat client={chatClient}>
    <ChannelList {...channelListOptions} />
    <Channel>
      <Window>
        <ChannelHeader />
        <MessageList />
        <MessageInput />
      </Window>
      <Thread />
    </Channel>
  </Chat>

  );
};

export default ChatBox;
