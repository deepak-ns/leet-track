"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    async function verifySession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      setCheckingAuth(false);
    }

    verifySession();
  }, [router]);

  if (checkingAuth) {
    return (
      <div className="saas-shell flex min-h-screen items-center justify-center text-sm text-zinc-300">
        Checking authentication...
      </div>
    );
  }

  return <>{children}</>;
}
