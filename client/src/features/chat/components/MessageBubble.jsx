import { formatTime } from '../../../lib/utils/format.js';

export const MessageBubble = ({ message, isOwnMessage }) => (
  <article className={isOwnMessage ? 'message-bubble message-bubble--own' : 'message-bubble'}>
    <p className="message-bubble__content">{message.content}</p>
    <time className="message-bubble__time" dateTime={message.createdAt}>
      {formatTime(message.createdAt)}
    </time>
  </article>
);
