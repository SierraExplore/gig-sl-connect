import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MessageCircle, Send, ArrowLeft, User } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  gig_id: string | null;
  participant_1: string;
  participant_2: string;
  last_message_at: string;
  created_at: string;
  other_user: {
    id: string;
    full_name: string;
    profile_photo_url: string | null;
  };
  gig?: {
    title: string;
  };
  last_message?: string;
  unread_count?: number;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

export default function Messages() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchConversations();

    // Check if we need to open a specific conversation
    const conversationId = searchParams.get("conversation");
    if (conversationId) {
      openConversationById(conversationId);
    }
  }, [user, navigate, searchParams]);

  // Real-time subscription for new messages
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("messages-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const newMsg = payload.new as Message;
          // Add to current conversation if it matches
          if (selectedConversation && newMsg.conversation_id === selectedConversation.id) {
            setMessages((prev) => [...prev, newMsg]);
            // Mark as read if not sender
            if (newMsg.sender_id !== user.id) {
              markAsRead(newMsg.id);
            }
          }
          // Refresh conversations list
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedConversation]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function fetchConversations() {
    if (!user) return;

    const { data, error } = await supabase
      .from("conversations")
      .select(`
        *,
        gig:gigs(title)
      `)
      .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
      .order("last_message_at", { ascending: false });

    if (error) {
      console.error("Error fetching conversations:", error);
      setLoading(false);
      return;
    }

    // Fetch other user details and last message for each conversation
    const conversationsWithDetails = await Promise.all(
      (data || []).map(async (conv) => {
        const otherUserId = conv.participant_1 === user.id ? conv.participant_2 : conv.participant_1;
        
        const { data: otherUser } = await supabase
          .from("profiles")
          .select("id, full_name, profile_photo_url")
          .eq("id", otherUserId)
          .single();

        const { data: lastMsg } = await supabase
          .from("messages")
          .select("content")
          .eq("conversation_id", conv.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const { count } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("conversation_id", conv.id)
          .neq("sender_id", user.id)
          .is("read_at", null);

        return {
          ...conv,
          other_user: otherUser || { id: otherUserId, full_name: "Unknown", profile_photo_url: null },
          last_message: lastMsg?.content,
          unread_count: count || 0,
        };
      })
    );

    setConversations(conversationsWithDetails);
    setLoading(false);
  }

  async function openConversationById(conversationId: string) {
    const { data } = await supabase
      .from("conversations")
      .select(`*, gig:gigs(title)`)
      .eq("id", conversationId)
      .single();

    if (data && user) {
      const otherUserId = data.participant_1 === user.id ? data.participant_2 : data.participant_1;
      const { data: otherUser } = await supabase
        .from("profiles")
        .select("id, full_name, profile_photo_url")
        .eq("id", otherUserId)
        .single();

      const conversation: Conversation = {
        ...data,
        other_user: otherUser || { id: otherUserId, full_name: "Unknown", profile_photo_url: null },
      };
      
      selectConversation(conversation);
    }
  }

  async function selectConversation(conversation: Conversation) {
    setSelectedConversation(conversation);
    
    // Fetch messages
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: true });

    if (data) {
      setMessages(data);
      // Mark unread messages as read
      const unreadIds = data
        .filter((m) => m.sender_id !== user?.id && !m.read_at)
        .map((m) => m.id);
      
      if (unreadIds.length > 0) {
        await supabase
          .from("messages")
          .update({ read_at: new Date().toISOString() })
          .in("id", unreadIds);
        fetchConversations();
      }
    }
  }

  async function markAsRead(messageId: string) {
    await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("id", messageId);
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || !user) return;

    setSending(true);
    const messageContent = newMessage.trim();
    setNewMessage("");

    const { error } = await supabase.from("messages").insert({
      conversation_id: selectedConversation.id,
      sender_id: user.id,
      content: messageContent,
    });

    if (error) {
      toast({ title: "Failed to send message", variant: "destructive" });
      setNewMessage(messageContent);
    } else {
      // Update conversation's last_message_at
      await supabase
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", selectedConversation.id);
    }

    setSending(false);
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (days === 1) {
      return "Yesterday";
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: "short" });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-6">
          <Card className="h-[600px] animate-pulse bg-muted" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-6">
        <Card className="glass-card overflow-hidden">
          <div className="flex h-[calc(100vh-200px)] min-h-[500px]">
            {/* Conversations List */}
            <div
              className={cn(
                "w-full md:w-80 border-r border-border flex flex-col",
                selectedConversation && "hidden md:flex"
              )}
            >
              <div className="p-4 border-b border-border">
                <h2 className="font-semibold text-lg">Messages</h2>
              </div>
              <ScrollArea className="flex-1">
                {conversations.length > 0 ? (
                  conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => selectConversation(conv)}
                      className={cn(
                        "w-full p-4 flex items-start gap-3 hover:bg-muted/50 transition-colors text-left border-b border-border/50",
                        selectedConversation?.id === conv.id && "bg-muted"
                      )}
                    >
                      <Avatar className="h-12 w-12 shrink-0">
                        <AvatarImage src={conv.other_user?.profile_photo_url || undefined} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {conv.other_user?.full_name?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium truncate">{conv.other_user?.full_name}</p>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {formatTime(conv.last_message_at)}
                          </span>
                        </div>
                        {conv.gig && (
                          <p className="text-xs text-primary truncate">{conv.gig.title}</p>
                        )}
                        <p className="text-sm text-muted-foreground truncate">
                          {conv.last_message || "No messages yet"}
                        </p>
                      </div>
                      {conv.unread_count && conv.unread_count > 0 && (
                        <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                          {conv.unread_count}
                        </span>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No conversations yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Start a conversation from a gig page
                    </p>
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Chat Area */}
            <div
              className={cn(
                "flex-1 flex flex-col",
                !selectedConversation && "hidden md:flex"
              )}
            >
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-border flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="md:hidden"
                      onClick={() => setSelectedConversation(null)}
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedConversation.other_user?.profile_photo_url || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {selectedConversation.other_user?.full_name?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{selectedConversation.other_user?.full_name}</p>
                      {selectedConversation.gig && (
                        <p className="text-xs text-muted-foreground">
                          Re: {selectedConversation.gig.title}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {messages.map((msg) => {
                        const isOwn = msg.sender_id === user?.id;
                        return (
                          <div
                            key={msg.id}
                            className={cn("flex", isOwn ? "justify-end" : "justify-start")}
                          >
                            <div
                              className={cn(
                                "max-w-[75%] rounded-2xl px-4 py-2",
                                isOwn
                                  ? "bg-primary text-primary-foreground rounded-br-md"
                                  : "bg-muted rounded-bl-md"
                              )}
                            >
                              <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                              <p
                                className={cn(
                                  "text-xs mt-1",
                                  isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                                )}
                              >
                                {formatTime(msg.created_at)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Message Input */}
                  <form onSubmit={sendMessage} className="p-4 border-t border-border">
                    <div className="flex gap-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1"
                        disabled={sending}
                      />
                      <Button type="submit" size="icon" disabled={sending || !newMessage.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold">Select a conversation</h3>
                    <p className="text-muted-foreground">
                      Choose a conversation from the list to start chatting
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}