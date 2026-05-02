import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function POST() {
  // Verify the caller is authenticated via their session cookie.
  // createClient() from supabase-server uses the anon key + cookie — safe to call here.
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const uid = user.id;

  try {
    // Delete all user-owned rows in dependency order.
    // goal_contributions cascades from plans (FK on delete cascade), but we delete
    // explicitly first to be safe in case the migration hasn't run on this instance.
    await supabase.from("goal_contributions").delete().eq("user_id", uid);
    await supabase.from("income_entries").delete().eq("user_id", uid);
    await supabase.from("spending_entries").delete().eq("user_id", uid);
    await supabase.from("bills").delete().eq("user_id", uid);
    await supabase.from("plans").delete().eq("user_id", uid);
    await supabase.from("profiles").delete().eq("id", uid);

    // Delete the auth record using the service role key (admin-only, never exposed client-side).
    // If SUPABASE_SERVICE_ROLE_KEY is not set in env, skip auth deletion and log a warning —
    // data rows are already gone so the account is effectively unusable.
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (serviceKey) {
      const admin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        serviceKey,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );
      const { error: deleteErr } = await admin.auth.admin.deleteUser(uid);
      if (deleteErr) throw deleteErr;
    } else {
      console.warn("[delete-account] SUPABASE_SERVICE_ROLE_KEY not set — auth user not deleted");
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[delete-account]", err);
    return NextResponse.json(
      { error: err.message || "Failed to delete account" },
      { status: 500 }
    );
  }
}
