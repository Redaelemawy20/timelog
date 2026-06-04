import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, MessageSquare, Send, X } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { fetchSprintConversation, sendSprintConversationMessage } from "../../api/sheets";
import { formatDayMonth } from "../../lib/sprintCardFormat";
import { sheetKeys } from "../../lib/sheetQueryKeys";
import type { Sprint, SprintConversationMessage } from "../../types/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Props {
  sprint: Sprint;
  onClose: () => void;
  onUseSummary: (text: string) => void;
}

export function SprintChatPanel({ sprint, onClose, onUseSummary }: Props) {
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const initAttemptedRef = useRef(false);

  const conversationQuery = useQuery({
    queryKey: sheetKeys.conversation(sprint.id),
    queryFn: () => fetchSprintConversation(sprint.id),
  });

  const sendMessage = useMutation({
    mutationFn: (body: { content?: string; init?: boolean }) =>
      sendSprintConversationMessage(sprint.id, body),
    onSuccess: async (newMessages) => {
      queryClient.setQueryData<SprintConversationMessage[]>(
        sheetKeys.conversation(sprint.id),
        (current) => [...(current ?? []), ...newMessages],
      );
      setDraft("");
      setError(null);
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : "Failed to send message";
      setError(message);
    },
  });

  const messages = conversationQuery.data ?? [];
  const isLoading = conversationQuery.isPending;
  const isSending = sendMessage.isPending;

  useEffect(() => {
    initAttemptedRef.current = false;
  }, [sprint.id]);

  useEffect(() => {
    if (!conversationQuery.isSuccess || initAttemptedRef.current || sendMessage.isPending) {
      return;
    }
    if (messages.length === 0) {
      initAttemptedRef.current = true;
      sendMessage.mutate({ init: true });
    }
  }, [conversationQuery.isSuccess, messages.length, sendMessage.isPending, sendMessage.mutate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  const handleSend = () => {
    const content = draft.trim();
    if (!content || isSending) return;
    sendMessage.mutate({ content });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border bg-background shadow-xl">
      <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <MessageSquare className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <h3 className="text-sm font-semibold text-foreground">Sprint chat</h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatDayMonth(sprint.range_start)} – {formatDayMonth(sprint.range_end)}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          aria-label="Close chat"
        >
          <X className="size-4" aria-hidden />
        </Button>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-3 p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
              Loading conversation...
            </div>
          ) : conversationQuery.isError ? (
            <p className="text-sm text-destructive">
              {conversationQuery.error instanceof Error
                ? conversationQuery.error.message
                : "Failed to load conversation."}
            </p>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={
                  message.role === "user"
                    ? "ml-8 rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground"
                    : "mr-4 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-foreground"
                }
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                {message.role === "assistant" ? (
                  <div className="mt-2 flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 bg-background px-2 text-xs"
                      onClick={() => onUseSummary(message.content)}
                    >
                      Use
                    </Button>
                  </div>
                ) : null}
              </div>
            ))
          )}
          {isSending ? (
            <div className="mr-4 flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Thinking...
            </div>
          ) : null}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="border-t border-border p-4">
        {error ? <p className="mb-2 text-xs text-destructive">{error}</p> : null}
        <div className="flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading || isSending || conversationQuery.isError}
            rows={2}
            placeholder="Ask for a shorter summary, stronger tone..."
            className="min-h-10 flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button
            type="button"
            size="icon"
            onClick={handleSend}
            disabled={isLoading || isSending || !draft.trim() || conversationQuery.isError}
            aria-label="Send message"
          >
            {isSending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Send className="size-4" aria-hidden />
            )}
          </Button>
        </div>
      </div>
    </aside>
  );
}
