"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, session } from "@/lib/api";
import { FormAlert } from "@/components/ui/form";

const CLIENT_ID = process.env.NEXT_PUBLIC_PHONE_EMAIL_CLIENT_ID;
const SCRIPT_SRC = "https://www.phone.email/sign_in_button_v1.js";

/** Phone sign-in is only offered when a Phone.email client ID is configured. */
export const phoneSignInEnabled = Boolean(CLIENT_ID);

declare global {
  interface Window {
    phoneEmailListener?: (userObj: { user_json_url: string }) => void;
  }
}

/**
 * Phone.email "Sign in with Phone" button. Phone.email sends and checks the OTP, then hands us a
 * user_json_url; the server fetches the verified number from it and starts the session.
 * New numbers become one-time donor accounts.
 */
export function PhoneSignIn({ next, name }: { next?: string | null; name?: string }) {
  const router = useRouter();
  const container = useRef<HTMLDivElement>(null);
  const nameRef = useRef(name);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    nameRef.current = name;
  }, [name]);

  useEffect(() => {
    const host = container.current;
    if (!CLIENT_ID || !host) return;

    window.phoneEmailListener = async (userObj) => {
      setPending(true);
      setError(null);
      try {
        const { redirectTo } = await session<{ redirectTo: string }>("phone", {
          userJsonUrl: userObj.user_json_url,
          name: nameRef.current?.trim() || null,
        });
        router.replace(next ?? redirectTo);
        router.refresh();
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Phone sign-in failed. Please try again.");
        setPending(false);
      }
    };

    // Built by hand (not by React) so cleanup can clear whatever the script injects.
    // The script looks for .pe_signin_button when it loads, so the button goes in first.
    const button = document.createElement("div");
    button.className = "pe_signin_button";
    button.dataset.clientId = CLIENT_ID;
    host.appendChild(button);
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    host.appendChild(script);

    return () => {
      delete window.phoneEmailListener;
      host.innerHTML = "";
    };
  }, [next, router]);

  if (!CLIENT_ID) return null;
  return (
    <div className="grid gap-3">
      {error && <FormAlert>{error}</FormAlert>}
      {pending ? (
        <p className="rounded-full border border-line bg-surface px-5 py-3 text-center text-sm text-muted">Signing you in...</p>
      ) : null}
      <div className={pending ? "hidden" : ""}>
        <div ref={container} />
      </div>
    </div>
  );
}
