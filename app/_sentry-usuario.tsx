"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { createClient } from "@/lib/supabase/client";

// Identifica quem estava logado quando um erro acontece — sem isso, o
// registro no Sentry mostra o erro mas não quem passou por ele.
export default function SentryUsuario() {
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) {
        Sentry.setUser({ email: data.user.email });
      }
    });
  }, []);

  return null;
}
