"use client";

import React, { use, useEffect, useState } from "react";
import axios from "axios";
import HubChatPanel from "@/components/HubChatPanel";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function AdminHubChatPage({ params }) {
  const resolved = use(params);
  const routeHubId = resolved.id;

  const [hubs, setHubs] = useState([]);
  const [selectedHubId, setSelectedHubId] = useState(routeHubId);

  useEffect(() => {
    const fetchHubs = async () => {
      try {
        const token = localStorage.getItem("userToken");
        const { data } = await axios.get(`${API}/hubs`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setHubs(data || []);

        if (routeHubId) {
          setSelectedHubId(routeHubId);
        } else if (data?.length) {
          setSelectedHubId(data[0]._id);
        }
      } catch {
        setHubs([]);
      }
    };

    fetchHubs();
  }, [routeHubId]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-black/45">Choose Hub</div>
        <select
          value={selectedHubId || ""}
          onChange={(e) => setSelectedHubId(e.target.value)}
          className="w-full md:w-80 bg-white border-2 border-black/15 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-black"
        >
          {hubs.map((hub) => (
            <option key={hub._id} value={hub._id}>
              {hub.name}
            </option>
          ))}
        </select>
        <p className="text-xs font-bold text-black/45">Chat is isolated per hub and tenant.</p>
      </div>

      {selectedHubId ? (
        <HubChatPanel hubId={selectedHubId} title="Hub Chat (Admin View)" />
      ) : (
        <div className="p-4 border-2 border-red-400 bg-red-50 rounded-xl text-red-700 text-sm font-bold">No hubs found for this account.</div>
      )}
    </div>
  );
}
