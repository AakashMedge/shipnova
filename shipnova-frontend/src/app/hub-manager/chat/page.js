"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import HubChatPanel from "@/components/HubChatPanel";
import { Loader2 } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function HubManagerChatPage() {
  const [hubs, setHubs] = useState([]);
  const [hubId, setHubId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHub = async () => {
      try {
        const token = localStorage.getItem("userToken");
        const { data: hubs } = await axios.get(`${API}/hubs`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setHubs(hubs || []);
        if (hubs?.length) setHubId(hubs[0]._id);
      } catch {
        // keep null hubId
      } finally {
        setLoading(false);
      }
    };
    fetchHub();
  }, []);

  if (loading) {
    return (
      <div className="py-16 flex items-center justify-center gap-3 text-black/50 font-black uppercase tracking-widest text-xs">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading hub...
      </div>
    );
  }

  if (!hubId) {
    return <div className="p-4 border-2 border-red-400 bg-red-50 rounded-xl text-red-700 text-sm font-bold">No hub found for this manager.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-black/45">Current Hub</div>
        <select
          value={hubId || ""}
          onChange={(e) => setHubId(e.target.value)}
          className="w-full md:w-80 bg-white border-2 border-black/15 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-black"
        >
          {hubs.map((hub) => (
            <option key={hub._id} value={hub._id}>
              {hub.name}
            </option>
          ))}
        </select>
        <p className="text-xs font-bold text-black/45">Use the same hub selected by Admin to view shared messages.</p>
      </div>

      <HubChatPanel hubId={hubId} title="Hub Chat" />
    </div>
  );
}
