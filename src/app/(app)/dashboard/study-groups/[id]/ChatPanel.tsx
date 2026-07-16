"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import CircularProgress from "@mui/material/CircularProgress";
import { alpha } from "@mui/material/styles";
import dayjs from "dayjs";
import { useSnackbar } from "notistack";
import { SendHorizontal, Trash2, MessagesSquare, Lock } from "lucide-react";
import {
  useStudyGroupMessages,
  useSendStudyGroupMessage,
  useDeleteStudyGroupMessage,
} from "@/lib/api/queries";
import type { StudyGroupMessage } from "@/lib/mockData";

// A run of consecutive messages from one author, shown under a single name +
// avatar so a back-and-forth reads as a conversation rather than a stack of
// labelled cards.
type Cluster = { userId: string; authorName: string; isMine: boolean; messages: StudyGroupMessage[] };

function cluster(messages: StudyGroupMessage[]): Cluster[] {
  const out: Cluster[] = [];
  for (const m of messages) {
    const tail = out[out.length - 1];
    if (tail && tail.userId === m.userId) tail.messages.push(m);
    else out.push({ userId: m.userId, authorName: m.authorName, isMine: m.isMine, messages: [m] });
  }
  return out;
}

export function ChatPanel({ groupId, isMember }: { groupId: string; isMember: boolean }) {
  const { enqueueSnackbar } = useSnackbar();
  const messagesQuery = useStudyGroupMessages(groupId, isMember);
  const send = useSendStudyGroupMessage(groupId);
  const del = useDeleteStudyGroupMessage(groupId);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const messages = messagesQuery.data ?? [];
  const clusters = useMemo(() => cluster(messages), [messages]);
  const lastId = messages[messages.length - 1]?.id;

  // Ride the bottom as new messages arrive.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lastId, isMember]);

  if (!isMember) {
    return (
      <Locked
        icon={<Lock size={26} />}
        title="Join to see the conversation"
        body="This group's chat is for its members. Join from the top of the page to read along and pitch in."
      />
    );
  }

  const submit = () => {
    const body = draft.trim();
    if (!body || send.isPending) return;
    setDraft("");
    send.mutate(body, {
      onError: (err) => {
        setDraft(body);
        enqueueSnackbar(err instanceof Error ? err.message : "Message didn't send.", { variant: "error" });
      },
    });
  };

  const remove = (id: string) =>
    del.mutate(id, {
      onError: (err) =>
        enqueueSnackbar(err instanceof Error ? err.message : "Couldn't delete.", { variant: "error" }),
    });

  return (
    <Stack sx={{ height: { xs: "62vh", md: "64vh" }, minHeight: 380 }}>
      <Box
        ref={scrollRef}
        sx={{
          flex: 1,
          overflowY: "auto",
          px: { xs: 0.5, sm: 1 },
          py: 1,
          overscrollBehavior: "contain",
        }}
      >
        {messagesQuery.isLoading ? (
          <Stack alignItems="center" justifyContent="center" sx={{ height: "100%" }}>
            <CircularProgress size={22} />
          </Stack>
        ) : clusters.length === 0 ? (
          <Locked
            icon={<MessagesSquare size={26} />}
            title="No messages yet"
            body="Say hello, drop a question, or share what tripped you up. Someone here has been there."
            embedded
          />
        ) : (
          <Stack spacing={2}>
            {clusters.map((c, i) => (
              <MessageCluster key={c.messages[0].id + i} cluster={c} onDelete={remove} />
            ))}
          </Stack>
        )}
      </Box>

      <Box
        component="form"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        sx={(t) => ({
          pt: 1.5,
          borderTop: `1px solid ${t.palette.divider}`,
          display: "flex",
          gap: 1,
          alignItems: "flex-end",
        })}
      >
        <TextField
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Write a message"
          fullWidth
          size="small"
          multiline
          maxRows={4}
          autoComplete="off"
        />
        <IconButton
          type="submit"
          color="secondary"
          disabled={!draft.trim() || send.isPending}
          sx={(t) => ({
            bgcolor: "secondary.main",
            color: t.palette.secondary.contrastText,
            "&:hover": { bgcolor: "secondary.dark" },
            "&.Mui-disabled": { bgcolor: "action.disabledBackground" },
          })}
          aria-label="Send message"
        >
          <SendHorizontal size={18} />
        </IconButton>
      </Box>
    </Stack>
  );
}

function MessageCluster({ cluster: c, onDelete }: { cluster: Cluster; onDelete: (id: string) => void }) {
  return (
    <Stack direction="row" spacing={1.25} justifyContent={c.isMine ? "flex-end" : "flex-start"}>
      {!c.isMine && <Avatar name={c.authorName} />}
      <Box sx={{ maxWidth: "78%", minWidth: 0 }}>
        {!c.isMine && (
          <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", ml: 1, mb: 0.5, display: "block" }}>
            {c.authorName}
          </Typography>
        )}
        <Stack spacing={0.5} alignItems={c.isMine ? "flex-end" : "flex-start"}>
          {c.messages.map((m) => (
            <Bubble key={m.id} message={m} mine={c.isMine} onDelete={onDelete} />
          ))}
        </Stack>
      </Box>
    </Stack>
  );
}

function Bubble({
  message: m,
  mine,
  onDelete,
}: {
  message: StudyGroupMessage;
  mine: boolean;
  onDelete: (id: string) => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <Stack
      direction="row"
      spacing={0.5}
      alignItems="center"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      sx={{ flexDirection: mine ? "row" : "row-reverse" }}
    >
      {m.canDelete && (
        <IconButton
          size="small"
          onClick={() => onDelete(m.id)}
          aria-label="Delete message"
          sx={{ opacity: hover ? 0.6 : 0, transition: "opacity .15s", "&:hover": { opacity: 1 } }}
        >
          <Trash2 size={13} />
        </IconButton>
      )}
      <Box
        title={dayjs(m.createdAt).format("ddd D MMM, HH:mm")}
        sx={(t) => ({
          px: 1.5,
          py: 1,
          borderRadius: 2.5,
          borderTopRightRadius: mine ? 4 : 20,
          borderTopLeftRadius: mine ? 20 : 4,
          bgcolor: mine ? "secondary.main" : t.palette.mode === "dark" ? alpha("#F6F7F5", 0.06) : t.palette.action.hover,
          color: mine ? t.palette.secondary.contrastText : t.palette.text.primary,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        })}
      >
        <Typography variant="body2">{m.body}</Typography>
      </Box>
    </Stack>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((p) => p.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const hue = useMemo(() => {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
    return h;
  }, [name]);
  return (
    <Box
      sx={(t) => ({
        flexShrink: 0,
        width: 32,
        height: 32,
        borderRadius: "50%",
        display: "grid",
        placeItems: "center",
        fontSize: "0.72rem",
        fontWeight: 800,
        color: t.palette.mode === "dark" ? "#F6F7F5" : "#1B1D22",
        bgcolor: `hsl(${hue} 40% ${t.palette.mode === "dark" ? 30 : 84}%)`,
      })}
    >
      {initials || "?"}
    </Box>
  );
}

function Locked({
  icon,
  title,
  body,
  embedded = false,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  embedded?: boolean;
}) {
  return (
    <Stack
      alignItems="center"
      justifyContent="center"
      spacing={1}
      sx={{
        textAlign: "center",
        py: embedded ? 6 : 8,
        px: 3,
        height: embedded ? "100%" : "auto",
        color: "text.secondary",
      }}
    >
      <Box sx={{ color: "text.disabled" }}>{icon}</Box>
      <Typography sx={{ fontWeight: 700, color: "text.primary" }}>{title}</Typography>
      <Typography variant="body2" sx={{ maxWidth: 340 }}>
        {body}
      </Typography>
    </Stack>
  );
}
