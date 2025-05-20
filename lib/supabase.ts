"use client";

import { createClientComponentClient,createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";

export const supabase = createClientComponentClient();
export const supabaseBrowser = createPagesBrowserClient();
