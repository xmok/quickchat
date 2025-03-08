import { AIStateIndicator, Avatar, Channel, ChannelHeader, ChannelList, Chat, ChatView, LoadingIndicator, MessageInput, MessageList, SendButton, StreamedMessageText, Thread, ThreadList, useChannelStateContext, useCreateChatClient, useMessageContext, useMessageTextStreaming, Window } from 'stream-chat-react';
import 'stream-chat-react/dist/css/v2/index.css';
import '../styles/override.css'
import { EmojiPicker } from 'stream-chat-react/emojis';
import { AppMenu } from '../components/AppMenu/AppMenu';
import { useCallback, useEffect, useState } from 'react';
import { useMembers } from '../hooks/useMembers';
import { aiService } from '../services/ai';
import { AIControls } from '../components/AIControls/AIControls';

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

  const ChatBoxMessage = () => {
    const { message, renderText } = useMessageContext();
    return <StreamedMessageText message={message} renderText={renderText} />
  }

  const ChatBoxChannelHeader = () => {
    const { channel } = useChannelStateContext();
    const [aiInChannel, setAiInChannel] = useState(false);

    useEffect(() => {
      channel?.queryMembers({}).then((members) => {
        const isAiInChannel =
          members.members.filter((member) => member.user_id?.includes('ai-bot'))
            .length > 0;
        setAiInChannel(isAiInChannel);
      });
  
      const relevantEvents = ['member.added', 'member.removed'];
      channel?.on((event) => {
        if (relevantEvents.includes(event.type)) {
          channel?.queryMembers({}).then((members) => {
            const isAiInChannel =
              members.members.filter((member) =>
                member.user_id?.includes('ai-bot')
              ).length > 0;
            setAiInChannel(isAiInChannel);
          });
        }
      });
    }, [channel]);

    if (channel.id) return <AIControls channelId={channel.id} />

  return (
    <div className='my-channel-header'>
      <h2>{channel?.data?.name ?? 'Chat with an AI'}</h2>

      <button onClick={addOrRemoveAgent}>
        {aiInChannel ? 'Remove AI' : 'Add AI'}
      </button>
    </div>
  );

  async function addOrRemoveAgent() {
    if (!channel) return;
    if (aiInChannel) {
      await aiService.stopAIAgent(channel.id)
    } else {
      await aiService.startAIAgent(channel.id);
    }
  }

    }

  const channelListOptions = {
    filters: { type: 'messaging', members: { $in: [user.id] } },
    sort: { last_message_at: undefined },
    options: { state: true, presence: true, watch: true, limit: 10 }
  }
  return (
    <Chat client={chatClient} theme='str-chat__theme-dark'>
      <ChatView>
        <ChatView.Selector />
        <ChatView.Channels>
          {/* <Avatar /> */}
          <ChannelList {...channelListOptions} additionalChannelSearchProps={{ AppMenu }} showChannelSearch />
          <Channel maxNumberOfFiles={10} multipleUploads={true} EmojiPicker={EmojiPicker} enrichURLForPreview Message={ChatBoxMessage}>
            <Window>
              <ChatBoxChannelHeader />
              <MessageList />
              <AIStateIndicator />
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
