import React, { useEffect, useState, useMemo, useRef } from 'react';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import {
  fetchAdminSupportChats,
  fetchSupportChatMessages,
  sendSupportChatMessage,
  markSupportChatAsRead,
  closeSupportChat,
} from '../services/supportChatApi';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import { resolveImageUrl } from '../utils/urlHelper';

const formatTime = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleString();
};

const SupportChats = () => {
  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [page, setPage] = useState(1);
  const messagesEndRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const [isUserTyping, setIsUserTyping] = useState(false);
  const selectedChatIdRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const lastTypingEmitRef = useRef(0);
  const navigate = useNavigate();

  const selectedChat = useMemo(
    () => chats.find((chat) => String(chat._id) === String(selectedChatId)) || null,
    [chats, selectedChatId]
  );

  const getInitials = (fullName, email) => {
    const source = fullName && fullName.trim().length > 0 ? fullName : email || '';
    if (!source) return 'U';
    const parts = source.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const getUserRoleRoute = (role) => {
    if (!role) return null;
    if (role === 'rider') return '/riders';
    if (role === 'customer') return '/customers';
    return null;
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    selectedChatIdRef.current = selectedChatId;
  }, [selectedChatId]);

  useEffect(() => {
    const loadChats = async () => {
      setLoadingChats(true);
      setError('');
      try {
        const data = await fetchAdminSupportChats();
        const list = data.chats || [];
        setChats(list);
        if (list.length > 0 && !selectedChatId) {
          setSelectedChatId(list[0]._id);
        }
      } catch (e) {
        setError('Failed to load support chats.');
      } finally {
        setLoadingChats(false);
      }
    };

    loadChats();
  }, []);

  useEffect(() => {
    const base = import.meta.env.VITE_API_BASE_URL || '';
    if (!base) return;
    if (socket) return;
    const socketUrl = base.replace(/\/api\/?$/, '');
    const s = io(socketUrl, { transports: ['websocket'], withCredentials: true });

    s.on('chat.message', (payload) => {
      if (!payload || payload.type !== 'support') return;
      const chat = payload.supportChat;
      if (!chat) return;

      setChats((prevChats) => {
        const existingIndex = prevChats.findIndex(
          (c) => String(c._id) === String(chat._id)
        );
        const updated = {
          ...chat,
          lastMessage: payload.message || chat.lastMessage || null,
          unreadCount:
            String(chat._id) === String(selectedChatIdRef.current)
              ? 0
              : (prevChats[existingIndex]?.unreadCount || 0) + 1,
        };

        if (existingIndex === -1) {
          return [updated, ...prevChats];
        }

        const copy = [...prevChats];
        copy[existingIndex] = updated;
        return copy;
      });

      if (String(payload.supportChatId) === String(selectedChatIdRef.current)) {
        setMessages((prevMessages) => [...prevMessages, payload.message]);
        scrollToBottom();
      }
    });

    s.on('chat.typing', (payload) => {
      if (!payload) return;
      if (payload.type && payload.type !== 'support') return;
      if (!payload.supportChatId) return;
      if (String(payload.supportChatId) !== String(selectedChatIdRef.current)) return;
      if (payload.fromRole === 'admin') return;
      setIsUserTyping(Boolean(payload.isTyping));
      if (payload.isTyping) {
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
          setIsUserTyping(false);
        }, 3000);
      }
    });

    s.on('support.chat_closed', (payload) => {
      if (!payload || !payload.chatId) return;
      setChats((prev) =>
        prev.map((chat) =>
          String(chat._id) === String(payload.chatId)
            ? { ...chat, status: 'closed' }
            : chat
        )
      );
    });

    setSocket(s);

    return () => {
      s.off('chat.message');
      s.off('chat.typing');
      s.disconnect();
      setSocket(null);
      setIsUserTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    };
  }, [socket]);

  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedChatId) return;
      setLoadingMessages(true);
      setError('');
      try {
        const data = await fetchSupportChatMessages(selectedChatId, { page: 1, limit: 50 });
        setMessages(data.messages || []);
        setHasMore(Boolean(data.hasMore));
        setPage(1);
        scrollToBottom();
        try {
          await markSupportChatAsRead(selectedChatId);
        } catch {}
        setChats((prev) =>
          prev.map((chat) =>
            String(chat._id) === String(selectedChatId)
              ? { ...chat, unreadCount: 0 }
              : chat
          )
        );
      } catch (e) {
        setError('Failed to load messages.');
      } finally {
        setLoadingMessages(false);
      }
    };

    loadMessages();
  }, [selectedChatId]);

  const handleSelectChat = (chatId) => {
    if (chatId === selectedChatId) return;
    setSelectedChatId(chatId);
  };

  const handleMessageInputChange = (e) => {
    const value = e.target.value;
    setMessageInput(value);
    if (!socket || !selectedChatIdRef.current) return;

    const now = Date.now();
    if (now - lastTypingEmitRef.current > 1000) {
      socket.emit('chat.typing', {
        supportChatId: selectedChatIdRef.current,
        isTyping: true,
        type: 'support',
      });
      lastTypingEmitRef.current = now;
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (!socket || !selectedChatIdRef.current) return;
      socket.emit('chat.typing', {
        supportChatId: selectedChatIdRef.current,
        isTyping: false,
        type: 'support',
      });
    }, 1500);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedChatId) return;
    setSending(true);
    setError('');
    const text = messageInput.trim();
    try {
      const data = await sendSupportChatMessage(selectedChatId, text);
      const newMessage = data.message || data.supportMessage || data.support_message;
      if (newMessage) {
        setMessages((prev) => [...prev, newMessage]);
      }
      setMessageInput('');
      if (socket && selectedChatIdRef.current) {
        socket.emit('chat.typing', {
          supportChatId: selectedChatIdRef.current,
          isTyping: false,
          type: 'support',
        });
      }
      scrollToBottom();
      setChats((prev) =>
        prev.map((chat) =>
          String(chat._id) === String(selectedChatId)
            ? { ...chat, lastMessage: newMessage || chat.lastMessage, lastMessageAt: new Date().toISOString() }
            : chat
        )
      );
    } finally {
      setSending(false);
    }
  };

  const handleResolveChat = async () => {
    if (!selectedChatId) return;
    if (!window.confirm('Are you sure you want to resolve this chat?')) return;

    setSending(true);
    try {
      await closeSupportChat(selectedChatId);
      setChats((prev) =>
        prev.map((chat) =>
          String(chat._id) === String(selectedChatId)
            ? { ...chat, status: 'closed' }
            : chat
        )
      );
    } catch (e) {
      setError('Failed to resolve chat.');
    } finally {
      setSending(false);
    }
  };

  const handleLoadOlder = async () => {
    if (!selectedChatId || !hasMore || loadingMessages) return;
    const nextPage = page + 1;
    setLoadingMessages(true);
    setError('');
    try {
      const data = await fetchSupportChatMessages(selectedChatId, {
        page: nextPage,
        limit: 50,
      });
      const older = data.messages || [];
      setMessages((prev) => [...older, ...prev]);
      setHasMore(Boolean(data.hasMore));
      setPage(nextPage);
    } catch (e) {
      setError('Failed to load older messages.');
    } finally {
      setLoadingMessages(false);
    }
  };

  return (
    <div className="flex h-full">
      <div className="w-80 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Support Chats</h1>
            <p className="text-sm text-gray-500 mt-1">Chats assigned to you as admin</p>
          </div>
          <button
            type="button"
            onClick={async () => {
              setLoadingChats(true);
              setError('');
              try {
                const data = await fetchAdminSupportChats();
                const list = data.chats || [];
                setChats(list);
                if (list.length > 0 && !selectedChatId) {
                  setSelectedChatId(list[0]._id);
                }
              } catch (e) {
                setError('Failed to refresh support chats.');
              } finally {
                setLoadingChats(false);
              }
            }}
            disabled={loadingChats}
            className="text-xs text-accent-blue hover:underline disabled:opacity-50"
          >
            {loadingChats ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingChats ? (
            <div className="p-4">
              <Loader />
            </div>
          ) : chats.length === 0 ? (
            <div className="p-4">
              <EmptyState title="No support chats yet" message="Support chats from users will appear here." />
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {chats.map((chat) => {
                const user = chat.userId || {};
                const lastMessageText =
                  chat.lastMessage?.message ||
                  chat.lastMessage?.text ||
                  '';
                const isActive = String(chat._id) === String(selectedChatId);
                const initials = getInitials(user.fullName, user.email);
                return (
                  <li
                    key={chat._id}
                    onClick={() => handleSelectChat(chat._id)}
                    className={`cursor-pointer px-4 py-3 hover:bg-gray-50 ${
                      isActive ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="flex-shrink-0">
                          {user.profilePicture ? (
                            <img
                              src={resolveImageUrl(user.profilePicture)}
                              alt={user.fullName || user.email || 'User'}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-700">
                              {initials}
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900">
                              {user.fullName || user.email || 'User'}
                            </span>
                            {user.role && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                {user.role}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mt-1 truncate">
                            {lastMessageText || 'No messages yet'}
                          </p>
                        </div>
                      </div>
                      <div className="ml-3 flex flex-col items-end">
                        {chat.lastMessageAt && (
                          <span className="text-xs text-gray-400">
                            {new Date(chat.lastMessageAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                        {chat.unreadCount > 0 && (
                          <span className="mt-1 inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-full bg-red-500 text-white">
                            {chat.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                      <span className="uppercase tracking-wide">
                        {chat.status || 'waiting'}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  {selectedChat.userId?.profilePicture ? (
                    <img
                      src={resolveImageUrl(selectedChat.userId.profilePicture)}
                      alt={selectedChat.userId.fullName || selectedChat.userId.email || 'User'}
                      className="h-11 w-11 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-11 w-11 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-700">
                      {getInitials(
                        selectedChat.userId?.fullName,
                        selectedChat.userId?.email
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-semibold text-gray-900">
                      {selectedChat.userId?.fullName ||
                        selectedChat.userId?.email ||
                        'User'}
                    </span>
                    {selectedChat.userId?.role && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        {selectedChat.userId.role}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Last updated {formatTime(selectedChat.lastMessageAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className={`text-xs uppercase tracking-wide font-bold ${selectedChat.status === 'closed' ? 'text-green-600' : 'text-gray-500'}`}>
                  {selectedChat.status || 'waiting'}
                </div>
                {selectedChat.status !== 'closed' && (
                  <button
                    type="button"
                    onClick={handleResolveChat}
                    disabled={sending}
                    className="text-xs px-3 py-1 rounded-full border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50"
                  >
                    Resolve Chat
                  </button>
                )}
                {selectedChat.userId?.role && (
                  <button
                    type="button"
                    onClick={() => {
                      const route = getUserRoleRoute(selectedChat.userId.role);
                      if (route) {
                        navigate(route);
                      }
                    }}
                    className="text-xs px-3 py-1 rounded-full border border-accent-blue text-accent-blue hover:bg-accent-blue hover:text-white transition-colors"
                  >
                    View {selectedChat.userId.role === 'rider' ? 'Rider' : 'Customer'} page
                  </button>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 bg-gray-50">
              {error && (
                <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                  {error}
                </div>
              )}
              {hasMore && (
                <button
                  type="button"
                  onClick={handleLoadOlder}
                  disabled={loadingMessages}
                  className="mb-3 text-xs text-accent-blue hover:underline disabled:opacity-50"
                >
                  {loadingMessages ? 'Loading...' : 'Load earlier messages'}
                </button>
              )}
              {loadingMessages && messages.length === 0 ? (
                <Loader />
              ) : messages.length === 0 ? (
                <EmptyState
                  title="No messages yet"
                  message="Start the conversation by sending a message."
                />
              ) : (
                <div className="space-y-3">
                  {messages.map((msg) => {
                    const isAdminSender =
                      msg.senderId?.role === 'admin' ||
                      msg.senderId === selectedChat.adminId;
                    const senderObject =
                      msg.senderId && typeof msg.senderId === 'object'
                        ? msg.senderId
                        : isAdminSender
                        ? selectedChat.adminId
                        : selectedChat.userId;
                    const avatarSrc = senderObject?.profilePicture;
                    const avatarInitials = getInitials(
                      senderObject?.fullName,
                      senderObject?.email
                    );
                    return (
                      <div
                        key={msg._id}
                        className={`flex items-end ${
                          isAdminSender ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {!isAdminSender && (
                          <div className="mr-2 flex-shrink-0">
                            {avatarSrc ? (
                              <img
                                src={resolveImageUrl(avatarSrc)}
                                alt={
                                  senderObject?.fullName ||
                                  senderObject?.email ||
                                  'User'
                                }
                                className="h-8 w-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-semibold text-gray-700">
                                {avatarInitials}
                              </div>
                            )}
                          </div>
                        )}
                        <div
                          className={`max-w-xs md:max-w-md rounded-lg px-3 py-2 text-sm ${
                            isAdminSender
                              ? 'bg-accent-blue text-white'
                              : 'bg-white text-gray-900 border border-gray-200'
                          }`}
                        >
                          <div>{msg.message}</div>
                          <div className="mt-1 text-[10px] opacity-75 text-right">
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                        {isAdminSender && (
                          <div className="ml-2 flex-shrink-0">
                            {avatarSrc ? (
                              <img
                                src={resolveImageUrl(avatarSrc)}
                                alt={
                                  senderObject?.fullName ||
                                  senderObject?.email ||
                                  'Admin'
                                }
                                className="h-8 w-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-semibold text-gray-700">
                                {avatarInitials}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {isUserTyping && (
                    <div className="flex justify-start">
                      <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-gray-200 text-gray-700 text-xs">
                        <span>Typing</span>
                        <span className="flex space-x-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-gray-500 animate-bounce" />
                          <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce delay-150" />
                          <span className="h-1.5 w-1.5 rounded-full bg-gray-300 animate-bounce delay-300" />
                        </span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
            {selectedChat.status === 'closed' ? (
              <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 text-center">
                <p className="text-sm font-medium text-gray-500">This chat session has been resolved and closed.</p>
              </div>
            ) : (
              <form onSubmit={handleSend} className="border-t border-gray-200 px-6 py-3 bg-white">
                <div className="flex items-end space-x-3">
                  <textarea
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-accent-blue resize-none"
                    rows={2}
                    placeholder="Type your reply..."
                    value={messageInput}
                    onChange={handleMessageInputChange}
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    disabled={sending || !messageInput.trim()}
                    className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[#000029] text-white text-sm font-medium hover:bg-[#2b72e1] disabled:opacity-60 disabled:hover:bg-[#000029] transition-colors"
                  >
                    {sending ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </form>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            {loadingChats ? (
              <Loader />
            ) : (
              <EmptyState
                title="Select a support chat"
                message="Choose a chat from the list on the left to view messages."
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportChats;
