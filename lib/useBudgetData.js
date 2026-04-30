"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase-browser";
import { currentMonthKey, monthRange } from "@/lib/constants";

export function useBudgetData() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [bills, setBills] = useState([]);
  const [entries, setEntries] = useState([]); // entries for the CURRENT month only

  const loadAll = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData?.user) throw new Error("Not signed in");
      setUser(userData.user);

      const { start, end } = monthRange(currentMonthKey());

      const [profRes, billsRes, entriesRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userData.user.id).maybeSingle(),
        supabase.from("bills").select("*").eq("user_id", userData.user.id).order("due_day"),
        supabase.from("spending_entries").select("*")
          .eq("user_id", userData.user.id)
          .gte("spent_on", start).lte("spent_on", end)
          .order("spent_on", { ascending: false }),
      ]);

      if (profRes.error)    throw profRes.error;
      if (billsRes.error)   throw billsRes.error;
      if (entriesRes.error) throw entriesRes.error;

      setProfile(profRes.data || { income: 0, savings_goal: 0, pay_date: 1, currency: "USD" });
      setBills(billsRes.data || []);
      setEntries(entriesRes.data || []);
    } catch (e) {
      setError(e.message || "Couldn't load your data. Please refresh and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Mutations — each returns updated server state and refreshes local state.
  const updateProfile = async (patch) => {
    if (!user) throw new Error("Not signed in — please refresh and try again.");
    const { error } = await supabase
      .from("profiles")
      .upsert(
        { id: user.id, ...patch, updated_at: new Date().toISOString() },
        { onConflict: "id" }
      );
    if (error) throw error;
    setProfile((p) => ({ ...(p || {}), ...patch }));
  };

  const addBill = async (bill) => {
    if (!user) throw new Error("Not signed in — please refresh and try again.");
    const { data, error } = await supabase.from("bills").insert({ ...bill, user_id: user.id }).select().single();
    if (error) throw error;
    setBills((bs) => [...bs, data].sort((a,b) => a.due_day - b.due_day));
  };

  const updateBill = async (id, patch) => {
    const { error } = await supabase.from("bills").update(patch).eq("id", id);
    if (error) throw error;
    setBills((bs) => bs.map((b) => (b.id === id ? { ...b, ...patch } : b)).sort((a,b) => a.due_day - b.due_day));
  };

  const deleteBill = async (id) => {
    const { error } = await supabase.from("bills").delete().eq("id", id);
    if (error) throw error;
    setBills((bs) => bs.filter((b) => b.id !== id));
  };

  const addEntry = async (entry) => {
    if (!user) return;
    const { data, error } = await supabase.from("spending_entries").insert({ ...entry, user_id: user.id }).select().single();
    if (error) throw error;
    setEntries((es) => [data, ...es]);
  };

  const deleteEntry = async (id) => {
    const { error } = await supabase.from("spending_entries").delete().eq("id", id);
    if (error) throw error;
    setEntries((es) => es.filter((e) => e.id !== id));
  };

  return {
    loading, error, user, profile, bills, entries,
    updateProfile, addBill, updateBill, deleteBill, addEntry, deleteEntry,
    refresh: loadAll,
  };
}
