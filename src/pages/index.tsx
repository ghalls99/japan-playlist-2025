"use client";
import { generateCodeChallenge, generateRandomString } from "../app/lib/crypto";

const clientId = "9c9d1901cee94017ad5322993bcac64f";
const redirectUri = "https://dynamic-mochi-1da10f.netlify.app/";

const scope = "user-read-private user-read-email";
const authUrl = new URL("https://accounts.spotify.com/authorize");

// Create a separate Client Component for the interactive parts

function LoginButton() {
  const handleCodeChallenge = async () => {
    const codeVerifier = generateRandomString(128);

    const codeChallenge = await generateCodeChallenge(64);
    window.localStorage.setItem("code_verifier", codeVerifier);

    const params = {
      response_type: "code",
      client_id: clientId,
      scope,
      code_challenge_method: "S256",
      code_challenge: codeChallenge,
      redirect_uri: redirectUri,
    };

    authUrl.search = new URLSearchParams(params).toString();
    window.location.href = authUrl.toString();
  };

  return <button onClick={handleCodeChallenge}>Click me</button>;
}

// Convert this component to a Client Component
export default function Home() {
  return (
    <div>
      <LoginButton />
    </div>
  );
}
