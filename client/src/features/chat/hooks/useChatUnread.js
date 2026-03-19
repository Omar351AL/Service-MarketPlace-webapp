import { useContext } from 'react';

import { ChatUnreadContext } from '../context/ChatUnreadContext.js';

export const useChatUnread = () => {
  const context = useContext(ChatUnreadContext);

  if (!context) {
    throw new Error('useChatUnread must be used within ChatUnreadProvider.');
  }

  return context;
};
