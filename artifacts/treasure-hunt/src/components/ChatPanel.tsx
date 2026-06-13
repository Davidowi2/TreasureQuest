import { useState, useRef, useEffect } from "react";
import { Send, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppContext } from "@/context/AppContext";

interface ChatPanelProps {
  teamId: string;
  compact?: boolean;
}

export function ChatPanel({ teamId, compact = false }: ChatPanelProps) {
  const { teams, currentUser, sendMessage } = useAppContext();
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  
  const team = teams.find(t => t.id === teamId);
  
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [team?.messages?.length]);

  if (!team || !currentUser) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || text.length > 150) return;
    sendMessage(teamId, text.trim());
    setText("");
  };

  const getAvatarColor = (userId: string) => {
    return `hsl(${(userId.charCodeAt(0) * 15) % 360}, 60%, 55%)`;
  };

  const content = (
    <div className="flex flex-col h-full bg-card">
      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {team.messages?.map((msg) => {
          if (msg.isSystem) {
            return (
              <div key={msg.id} className="text-center">
                <span className="text-xs text-muted-foreground italic bg-muted/50 px-2 py-1 rounded-full">
                  {msg.text}
                </span>
              </div>
            );
          }
          
          const isOwn = msg.userId === currentUser.id;
          
          return (
            <div key={msg.id} className={`flex items-end gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
              {!isOwn && (
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: getAvatarColor(msg.userId) }}
                >
                  {msg.userName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className={`flex flex-col max-w-[75%] ${isOwn ? 'items-end' : 'items-start'}`}>
                {!isOwn && <span className="text-[10px] text-muted-foreground ml-1 mb-0.5">{msg.userName}</span>}
                <div 
                  className={`px-3 py-2 text-sm ${
                    isOwn 
                      ? 'bg-primary text-primary-foreground rounded-tl-2xl rounded-tr-sm rounded-b-2xl' 
                      : 'bg-muted rounded-tr-2xl rounded-tl-sm rounded-b-2xl'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <div className="p-3 border-t bg-background">
        <form onSubmit={handleSend} className="flex gap-2">
          <div className="relative flex-grow">
            <Input 
              value={text} 
              onChange={e => setText(e.target.value)} 
              placeholder="Message team..." 
              className="pr-12"
              maxLength={150}
            />
            <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${text.length >= 130 ? 'text-destructive font-bold' : 'text-muted-foreground'}`}>
              {text.length}/150
            </span>
          </div>
          <Button type="submit" size="icon" disabled={!text.trim() || text.length > 150} className="flex-shrink-0">
            <Send size={16} />
          </Button>
        </form>
      </div>
    </div>
  );

  if (compact) {
    return content;
  }

  return (
    <Card className="h-[380px] flex flex-col border-2 shadow-sm overflow-hidden mt-6 md:mt-0">
      <CardHeader className="py-3 px-4 border-b bg-muted/30">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageCircle size={18} className="text-primary" /> Team Chat
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-grow overflow-hidden flex flex-col">
        {content}
      </CardContent>
    </Card>
  );
}