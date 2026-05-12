"use client";

import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { Button, TextField, InputGroup } from "@heroui/react";
import clsx from "clsx";
import { useAuth } from "@/context/auth-context";
import { LoginButton } from "@/components/login-button";

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: number;
}

interface User {
  id: string;
  name: string;
  isOnline: boolean;
}

export default function Home() {
  const { user, loading } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");

  const currentUser = user ? { 
    id: user.uid, 
    name: user.displayName || user.email || "Anonymous", 
    isOnline: true 
  } : null;

  const [users, setUsers] = useState<User[]>([
    { id: "user1", name: "Alice", isOnline: true },
    { id: "user2", name: "Bob", isOnline: false }
  ]);
  const [isTyping, setIsTyping] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!currentUser || !user) return;

    let socketInstance: Socket;

    const initSocket = async () => {
      try {
        const token = await user.getIdToken();
        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:8000";
        socketInstance = io(socketUrl, {
          auth: { token }
        });
        setSocket(socketInstance);

        socketInstance.on("connect", () => {
          console.log("Connected to server");
        });

        socketInstance.on("receive_message", (data: any) => {
          // Map backend receive_message to frontend Message structure
          const formattedMsg: Message = {
            id: data.id.toString(),
            text: data.content,
            senderId: data.sender,
            senderName: data.sender, // We might need to fetch names later
            timestamp: new Date(data.timestamp).getTime(),
          };
          setMessages((prev) => [...prev, formattedMsg]);
        });

        socketInstance.on("typing", (data: { sender: string, is_typing: boolean }) => {
          if (data.sender !== currentUser.id) {
            setIsTyping(data.is_typing ? data.sender : null);
          }
        });
      } catch (error) {
        console.error("Failed to initialize socket:", error);
      }
    };

    initSocket();

    return () => {
      if (socketInstance) socketInstance.close();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [currentUser?.id, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!inputText.trim() || !socket || !currentUser) return;

    const payload = {
      content: inputText.trim(),
      recipient: "general",
      timestamp: new Date().toISOString(),
    };

    socket.emit("message", payload);
    setInputText("");

    // Stop typing indicator
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket.emit("typing", { sender: currentUser.id, is_typing: false, recipient: "general" });
  };

  const handleInputChange = (val: string) => {
    setInputText(val);

    if (socket && currentUser) {
      socket.emit("typing", { sender: currentUser.id, is_typing: true, recipient: "general" });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("typing", { sender: currentUser.id, is_typing: false, recipient: "general" });
      }, 2000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-140px)] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !currentUser) {
    return (
      <div className="flex h-[calc(100vh-140px)] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-6 p-8 border border-separator rounded-3xl bg-surface shadow-surface max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-accent/10 text-accent flex items-center justify-center">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold mb-2">Welcome to AI Chat</h1>
            <p className="text-muted">Sign in to start chatting with your friends and AI assistants.</p>
          </div>
          <LoginButton />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-[calc(100vh-140px)] w-full gap-4 py-4">
      {/* Sidebar - User List */}
      <div className="hidden md:flex flex-col w-64 lg:w-80 border border-separator rounded-2xl bg-surface shadow-surface p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-4 px-2">
          <h2 className="text-xl font-bold">Contacts</h2>
          <div className="w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-bold" title={currentUser.name}>
            {currentUser.name.charAt(0)}
          </div>
        </div>

        <div className="mb-4">
          <TextField aria-label="Search users" type="search">
            <InputGroup>
              <InputGroup.Input className="text-sm" placeholder="Search contacts..." />
            </InputGroup>
          </TextField>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-accent/5 border border-accent/10">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-bold">
                {currentUser.name.charAt(0)}
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-success border-2 border-surface"></div>
            </div>
            <div className="flex-col">
              <p className="text-sm font-medium">{currentUser.name} (You)</p>
              <p className="text-xs text-muted">Online</p>
            </div>
          </div>
          {users.map((user) => (
            <div key={user.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-accent/10 cursor-pointer transition-colors">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-accent/50 text-accent-foreground flex items-center justify-center font-bold">
                  {user.name.charAt(0)}
                </div>
                {user.isOnline && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-success border-2 border-surface"></div>
                )}
              </div>
              <div className="flex-col">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted">{user.isOnline ? 'Online' : 'Offline'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 border border-separator rounded-2xl bg-surface shadow-surface overflow-hidden">
        {/* Chat Header */}
        <div className="flex items-center justify-between p-4 border-b border-separator bg-background/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/20 text-accent flex items-center justify-center font-bold">
              G
            </div>
            <div>
              <h2 className="font-semibold">General Chat</h2>
              <p className="text-xs text-muted">Online</p>
            </div>
          </div>
          <LoginButton />
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {messages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-muted text-center">
              <div>
                <p className="mb-2">No messages yet.</p>
                <p className="text-sm opacity-70">Start a conversation by typing a message below!</p>
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === currentUser.id;
              return (
                <div key={msg.id} className={clsx("flex max-w-[80%]", isMe ? "self-end" : "self-start")}>
                  <div className={clsx(
                    "px-4 py-2 rounded-2xl",
                    isMe ? "bg-accent text-accent-foreground rounded-br-sm" : "bg-muted/20 text-foreground rounded-bl-sm"
                  )}>
                    {!isMe && <p className="text-xs font-semibold mb-1 opacity-70">{msg.senderName}</p>}
                    <p className="text-sm break-words">{msg.text}</p>
                    <p className="text-[10px] opacity-60 text-right mt-1">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          {isTyping && (
            <div className="self-start px-4 py-2 bg-muted/20 rounded-2xl rounded-bl-sm flex items-center gap-2">
              <span className="text-xs text-muted">{isTyping} is typing</span>
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-separator bg-background/50 flex-shrink-0">
          <div className="flex items-center gap-2">
            <TextField 
              className="flex-1" 
              aria-label="Type a message" 
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
            >
              <InputGroup>
                <InputGroup.Input 
                  placeholder="Type your message..." 
                />
              </InputGroup>
            </TextField>
            <Button 
              variant="primary"
              onPress={sendMessage}
              isDisabled={!inputText.trim()}
              className="rounded-full px-6"
            >
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}