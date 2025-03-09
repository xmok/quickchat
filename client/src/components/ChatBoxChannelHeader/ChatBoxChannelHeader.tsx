import axios from "axios";
import { useEffect, useState } from "react";
import { useChannelStateContext } from "stream-chat-react";
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

	return channel.id === "ai" ? (
		<div className="chatbox-channel-header">
			<h2>{channel?.data?.name ?? "Chat with an AI"}</h2>

			<button onClick={addOrRemoveAgent}>
				{aiInChannel ? "Remove AI" : "Add AI"}
			</button>
		</div>
	) : (
		<div></div>
	);

	async function addOrRemoveAgent() {
		if (!channel) return;
		const endpoint = aiInChannel ? "stop-ai-agent" : "start-ai-agent";
		await axios.post(`${import.meta.env.VITE_API_URL}/${endpoint}`, {
			channel_id: channel.id,
		});
	}
}
