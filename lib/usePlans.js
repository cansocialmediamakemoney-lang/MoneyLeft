"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase-browser";

export function usePlans() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [plans, setPlans] = useState([]);
  const [user, setUser] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData?.user) throw new Error("Not signed in");
      setUser(userData.user);

      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .eq("user_id", userData.user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setPlans(data || []);
    } catch (e) {
      setError(e.message || "Couldn't load your plans.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const addPlan = async (plan) => {
    if (!user) throw new Error("Not signed in");
    const { data, error } = await supabase
      .from("plans")
      .insert({ ...plan, user_id: user.id })
      .select()
      .single();
    if (error) throw error;
    setPlans((p) => [data, ...p]);
    return data;
  };

  const deletePlan = async (id) => {
    const { error } = await supabase.from("plans").delete().eq("id", id);
    if (error) throw error;
    setPlans((p) => p.filter((x) => x.id !== id));
  };

  const updatePlan = async (id, patch) => {
    const { error } = await supabase.from("plans").update(patch).eq("id", id);
    if (error) throw error;
    setPlans((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  };

  const getPlan = (id) => plans.find((p) => p.id === id);

  return { loading, error, plans, addPlan, updatePlan, deletePlan, getPlan, refresh: load };
}