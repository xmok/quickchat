import { Avatar, Channel, ChannelHeader, ChannelList, Chat, ChatView, LoadingIndicator, MessageInput, MessageList, SendButton, Thread, ThreadList, useCreateChatClient, Window } from 'stream-chat-react';
import 'stream-chat-react/dist/css/v2/index.css';
import '../styles/override.css'
import { EmojiPicker } from 'stream-chat-react/emojis';
import { AppMenu } from '../components/AppMenu/AppMenu';

type ChatBoxProps = {
  apiKey: string;
  user: { id: string; name?: string; image?: string };
  userToken: string | undefined;
  onLogout: () => void;
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
      <ChatView>
        <ChatView.Selector />
        <ChatView.Channels>
          {/* <Avatar /> */}
          <ChannelList {...channelListOptions} additionalChannelSearchProps={{ AppMenu }} showChannelSearch />
          <Channel maxNumberOfFiles={10} multipleUploads={true} EmojiPicker={EmojiPicker} enrichURLForPreview>
            <Window>
              <ChannelHeader />
              <MessageList />
              <MessageInput focus audioRecordingEnabled asyncMessagesMultiSendEnabled />
            </Window>
            <Thread />
          </Channel>
        </ChatView.Channels>
        <ChatView.Threads>
          <ThreadList />
          <ChatView.ThreadAdapter>
            <Thread virtualized />
          </ChatView.ThreadAdapter>
        </ChatView.Threads>
      </ChatView>
  </Chat>

  );
};

export default ChatBox;
