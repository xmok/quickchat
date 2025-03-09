import { LoadingIndicator } from "stream-chat-react";

const Loader = () => (
    <div style={{ maxWidth: '300px', margin: '100px auto', padding: '20px', color: 'white' }}>
      <LoadingIndicator size={200} color="var(--color-green)" />
    </div>)
export default Loader;