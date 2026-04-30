"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useBudgetData } from "@/lib/useBudgetData";
import { monthRange, currentMonthKey } from "@/lib/constants";

export function useIncomeEntries() {
  const { user } = useBudgetData();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    const { start, end } = monthRange(currentMonthKey());
    supabase
      .from("income_entries")
      .select("*")
      .eq("user_id", user.id)
      .gte("received_on", start)
      .lte("received_on", end)
      .order("received_on", { ascending: false })
      .then(({ data }) => {
        setEntries(data || []);
        setLoading(false);
      });
  }, [user]);

  const addEntry = async (entry) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("income_entries")
      .insert({ ...entry, user_id: user.id })
      .select()
      .single();
    if (error) throw error;
    setEntries((prev) => [data, ...prev]);
    return data;
  };

  const deleteEntry = async (id) => {
    const supabase = createClient();
    await supabase.from("income_entries").delete().eq("id", id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const totalAdditionalIncome = entries.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);

  return { loading, entries, totalAdditionalIncome, addEntry, deleteEntry };
}
