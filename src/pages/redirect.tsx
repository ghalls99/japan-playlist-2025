"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function Redirect() {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Function to exchange the code for an access token
    async function getAccessToken() {
      try {
        const code = router.query.code as string;
        if (!code) return;

        const codeVerifier = localStorage.getItem("code_verifier");
        if (!codeVerifier) {
          throw new Error("No code verifier found");
        }

        const response = await fetch("https://accounts.spotify.com/api/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            client_id: "9c9d1901cee94017ad5322993bcac64f",
            grant_type: "authorization_code",
            code,
            redirect_uri: "https://dynamic-mochi-1da10f.netlify.app/",
            code_verifier: codeVerifier,
          }),
        });

        const data = await response.json();
        if (response.ok) {
          localStorage.setItem("token", data.access_token);
          localStorage.setItem("access_token", data.access_token);
          // Redirect to home page or dashboard
          router.push("/");
        } else {
          setError(data.error || "Failed to get access token");
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      }
    }

    if (router.isReady) {
      getAccessToken();
    }
  }, [router.isReady, router.query.code]);

  if (error) {
    return <div>Error: {error}</div>;
  }

  return <div>Processing login...</div>;
}
