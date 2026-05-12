"use client";

import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { Button, TextField, InputGroup } from "@heroui/react";
import clsx from "clsx";

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
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [currentUser] = useState<User>({ id: "me", name: "You", isOnline: true });
  const [users, setUsers] = useState<User[]>([
    { id: "me", name: "You", isOnline: true },
    { id: "user1", name: "Alice", isOnline: true },
    { id: "user2", name: "Bob", isOnline: false }
  ]);
  const [isTyping, setIsTyping] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Connect to backend
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:8000";
    const newSocket = io(socketUrl);
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Connected to server");
    });

    newSocket.on("message", (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    newSocket.on("typing", (data: { userId: string, isTyping: boolean, name: string }) => {
      if (data.userId !== currentUser.id) {
        setIsTyping(data.isTyping ? data.name : null);
      }
    });

    return () => {
      newSocket.close();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [currentUser.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!inputText.trim() || !socket) return;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      senderId: currentUser.id,
      senderName: currentUser.name,
      timestamp: Date.now(),
    };

    socket.emit("message", newMessage);
    setInputText("");
    
    // Stop typing indicator
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket.emit("typing", { userId: currentUser.id, isTyping: false, name: currentUser.name });
  };

  const handleInputChange = (val: string) => {
    setInputText(val);
    
    if (socket) {
      socket.emit("typing", { userId: currentUser.id, isTyping: true, name: currentUser.name });
      
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("typing", { userId: currentUser.id, isTyping: false, name: currentUser.name });
      }, 2000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  return (
    <div className="flex h-full min-h-[calc(100vh-140px)] w-full gap-4 py-4">
      {/* Sidebar - User List */}
      <div className="hidden md:flex flex-col w-64 lg:w-80 border border-separator rounded-2xl bg-surface shadow-surface p-4 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 px-2">Contacts</h2>
        
        <div className="mb-4">
          <TextField aria-label="Search users" type="search">
            <InputGroup>
              <InputGroup.Input className="text-sm" placeholder="Search contacts..." />
            </InputGroup>
          </TextField>
        </div>

        <div className="flex flex-col gap-2">
          {users.map((user) => (
            <div key={user.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-accent/10 cursor-pointer transition-colors">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-bold">
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
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {messages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-muted">
              <p>No messages yet. Start a conversation!</p>
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