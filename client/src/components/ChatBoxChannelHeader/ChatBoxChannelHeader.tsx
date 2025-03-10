import axios from "axios";
import { useEffect, useState } from "react";
import { ChannelHeader, useChannelStateContext } from "stream-chat-react";
import "./ChatBoxChannelHeader.css";

export default function ChatBoxChannelHeader() {
	const { channel } = useChannelStateContext();
	const [aiInChannel, setAiInChannel] = useState(false);

	useEffect(() => {
		channel?.queryMembers({}).then((members) => {
			const isAiInChannel =
				members.members.filter((member) => member.user_id?.includes("ai-bot"))
					.length > 0;
			setAiInChannel(isAiInChannel);
		});

		const relevantEvents = ["member.added", "member.removed"];
		channel?.on((event) => {
			if (relevantEvents.includes(event.type)) {
				channel?.queryMembers({}).then((members) => {
					const isAiInChannel =
						members.members.filter((member) =>
							member.user_id?.includes("ai-bot"),
						).length > 0;
					setAiInChannel(isAiInChannel);
				});
			}
		});
	}, [channel]);

	const channelName = channel.data?.name;
	
	return channel.id === "ai" ? (
		<div className="str-chat__channel-header">
			<button aria-label="Menu" className="str-chat__header-hamburger">
				<svg data-testid="menu-icon" viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg">
					<title>Menu</title>
					<path d="M0 88C0 74.75 10.75 64 24 64H424C437.3 64 448 74.75 448 88C448 101.3 437.3 112 424 112H24C10.75 112 0 101.3 0 88zM0 248C0 234.7 10.75 224 24 224H424C437.3 224 448 234.7 448 248C448 261.3 437.3 272 424 272H24C10.75 272 0 261.3 0 248zM424 432H24C10.75 432 0 421.3 0 408C0 394.7 10.75 384 24 384H424C437.3 384 448 394.7 448 408C448 421.3 437.3 432 424 432z" fill="currentColor"></path>
				</svg>
			</button>
			<div className="str-chat__avatar str-chat__message-sender-avatar str-chat__avatar--channel-header str-chat__avatar--one-letter" data-testid="avatar" role="button" title={channelName}>
					<div className="str-chat__avatar-fallback" data-testid="avatar-fallback">{channelName?.charAt(0)}</div>
				</div>
			<div className="str-chat__channel-header-end">
				<p className="str-chat__channel-header-title">{channel.data?.name} </p>
				<p className="str-chat__channel-header-info">{channel.data?.member_count} members, {aiInChannel ? 2 : 1} online</p>
			</div>
			<AddOrRemoveAIAgent />
		</div>
	) : (
		<ChannelHeader />
	);

	function AddOrRemoveAIAgent() {
		const [isLoading, setIsLoading] = useState(false);

		async function addOrRemoveAgent() {
			if (!channel) return;
			const endpoint = aiInChannel ? "stop-ai-agent" : "start-ai-agent";
			setIsLoading(true);
			await axios.post(`${import.meta.env.VITE_API_URL}/${endpoint}`, {
				channel_id: channel.id,
			});
			setIsLoading(false);
		}

		return (<button type="button" onClick={addOrRemoveAgent} disabled={isLoading} className="ai-button">
			{isLoading ? (aiInChannel ? "Removing" : "Adding") : (aiInChannel ? "Remove AI" : "Add AI")}
		</button>)
	}
}
