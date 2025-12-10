import { supabase } from "@/integrations/supabase/client";

export async function getOrCreateConversation(
  currentUserId: string,
  otherUserId: string,
  gigId?: string
): Promise<string | null> {
  // Try to find existing conversation
  let query = supabase
    .from("conversations")
    .select("id")
    .or(
      `and(participant_1.eq.${currentUserId},participant_2.eq.${otherUserId}),and(participant_1.eq.${otherUserId},participant_2.eq.${currentUserId})`
    );

  if (gigId) {
    query = query.eq("gig_id", gigId);
  }

  const { data: existing } = await query.maybeSingle();

  if (existing) {
    return existing.id;
  }

  // Create new conversation
  const { data: newConv, error } = await supabase
    .from("conversations")
    .insert({
      participant_1: currentUserId,
      participant_2: otherUserId,
      gig_id: gigId || null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error creating conversation:", error);
    return null;
  }

  return newConv.id;
}