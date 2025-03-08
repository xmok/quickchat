
import { useCallback, useEffect, useState } from 'react';
import { Channel } from 'stream-chat';

export const useMembers = ({ channel }: { channel: Channel }) => {
  const [members, setMembers] = useState<string[] | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const queryMembers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await channel.queryMembers({});
      setMembers(result.members.map((watcher) => watcher.user_id));
      setLoading(false);
      return;
    } catch (err) {
      console.error('An error has occurred while querying members: ', err);
      setError(err as Error);
    }
  }, [channel]);

  useEffect(() => {
    queryMembers();
  }, [queryMembers]);

  useEffect(() => {
    const watchingStartListener = channel.on('user.watching.start', (event) => {
      const userId = event?.user?.id;
      if (userId && userId.startsWith('ai-bot')) {
        setMembers((prevMembers) => [
          userId,
          ...(prevMembers || []).filter((watcherId) => watcherId !== userId),
        ]);
      }
    });

    const watchingStopListener = channel.on('user.watching.stop', (event) => {
      const userId = event?.user?.id;
      if (userId && userId.startsWith('ai-bot')) {
        setMembers((prevMembers) =>
          (prevMembers || []).filter((watcherId) => watcherId !== userId)
        );
      }
    });

    return () => {
      watchingStartListener.unsubscribe();
      watchingStopListener.unsubscribe();
    };
  }, [channel]);

  return { members, loading, error };
};
