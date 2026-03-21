"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Loader2, MessageSquare, Send, Building2 } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function HubChatPanel({ hubId, title = "Hub Chat" }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sendError, setSendError] = useState("");
  const [hubName, setHubName] = useState("");

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("userInfo") || "{}");
    } catch {
      return {};
    }
  }, []);

  const fetchChat = async (isPolling = false) => {
    if (!hubId) return;
    try {
      const token = localStorage.getItem("userToken");

      if (!isPolling && !hubName) {
        const { data: hubData } = await axios.get(`${API}/hubs/${hubId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setHubName(hubData?.hub?.name || "Hub");
      }

      const { data } = await axios.get(`${API}/hubs/${hubId}/chat`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(data);
      setError("");
    } catch (err) {
      if (!isPolling) {
        setError(err.response?.data?.message || "Failed to load hub chat");
      }
    } finally {
      if (!isPolling) setLoading(false);
    }
  };

  useEffect(() => {
    fetchChat();
    const interval = setInterval(() => fetchChat(true), 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hubId]);

  const sendMessage = async (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || !hubId) return;

    setSending(true);
    setSendError("");
    try {
      const token = localStorage.getItem("userToken");
      const { data } = await axios.post(
        `${API}/hubs/${hubId}/chat`,
        { text: trimmed },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages((prev) => [...prev, data]);
      setText("");
    } catch (err) {
      setSendError(err.response?.data?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 flex items-center justify-center gap-3 text-black/50 font-black uppercase tracking-widest text-xs">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading chat...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-black/10 pb-5">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/40 mb-2">Admin-Hub Communication</p>
        <h1 className="text-3xl font-black tracking-tight text-black">{title}</h1>
        <p className="text-sm font-medium text-black/50 mt-1 inline-flex items-center gap-2">
          <Building2 className="w-4 h-4" /> {hubName || "Hub"}
        </p>
      </div>

      {error ? (
        <div className="p-4 border-2 border-red-400 bg-red-50 rounded-xl text-red-700 text-sm font-bold">{error}</div>
      ) : null}

      <div className="bg-white border-2 border-black/10 rounded-2xl p-4 md:p-5 min-h-105 flex flex-col">
        <div className="flex-1 space-y-3 max-h-105 overflow-y-auto pr-1">
          {messages.length === 0 ? (
            <div className="h-full min-h-65 flex flex-col items-center justify-center text-center bg-black/2 border border-black/10 rounded-xl">
              <MessageSquare className="w-8 h-8 text-black/30 mb-2" />
              <p className="text-xs font-black uppercase tracking-[0.16em] text-black/40">No messages yet</p>
              <p className="text-xs font-medium text-black/45 mt-1">Start the conversation with your hub/admin team.</p>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-black/35 mt-2">Messages are visible only within this hub.</p>
            </div>
          ) : (
            messages.map((msg) => {
              const mine = msg.sender?._id === currentUser?._id;
              return (
                <div key={msg._id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[82%] rounded-2xl border px-4 py-3 ${mine ? "bg-black text-white border-black" : "bg-white text-black border-black/12"}`}>
                    <p className={`text-[10px] font-black uppercase tracking-[0.14em] mb-1 ${mine ? "text-white/70" : "text-black/45"}`}>
                      {msg.sender?.name || "User"} · {msg.senderRole}
                    </p>
                    <p className="text-sm font-bold leading-relaxed">{msg.text}</p>
                    <p className={`text-[10px] font-bold mt-1 ${mine ? "text-white/70" : "text-black/40"}`}>
                      {new Date(msg.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <form onSubmit={sendMessage} className="mt-4 flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message for this hub..."
            className="flex-1 border-2 border-black/15 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-black"
          />
          <button
            type="submit"
            disabled={sending || !text.trim()}
            className={`px-5 rounded-xl border-2 border-black text-[11px] font-black uppercase tracking-[0.14em] inline-flex items-center gap-2 ${
              sending || !text.trim()
                ? "bg-black/60 text-white cursor-not-allowed"
                : "bg-black text-white shadow-[4px_4px_0_0_#2d66ff] hover:shadow-none hover:translate-x-1 hover:translate-y-1"
            }`}
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send
          </button>
        </form>

        {sendError && (
          <div className="mt-3 p-3 border border-red-300 bg-red-50 rounded-xl text-red-700 text-xs font-bold">
            {sendError}
          </div>
        )}
      </div>
    </div>
  );
}
