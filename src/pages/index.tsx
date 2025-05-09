import { useState, useEffect } from "react";
import { getAccessToken, redirectToAuthCodeFlow } from "../app/lib/authorize";
import { generatePlaylist } from "@/app/lib/generate-playlist";

// Convert this component to a Client Component
export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  const [expires_in, setExpires] = useState<number | null>(null);

  const [afterDate, setAfterDate] = useState("");
  const getCode = async () => {
    await redirectToAuthCodeFlow("9c9d1901cee94017ad5322993bcac64f");
  };

  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");

    setToken(localStorage.getItem("token"));
    setExpires(Number(localStorage.getItem("expires_in")));

    if (code && !token && !expires_in) {
      // Create an async function inside useEffect and call it immediately
      const fetchToken = async () => {
        const { access_token, expires_in } = await getAccessToken(
          "9c9d1901cee94017ad5322993bcac64f",
          code,
        );

        localStorage.setItem("token", access_token);
        localStorage.setItem("expires_in", expires_in);
      };

      fetchToken().catch(console.error); // Handle any errors from the async function
    }
  }, []);

  const handleGenerateClick = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    generatePlaylist(new Date(afterDate).valueOf(), token || "");
  };

  return (
    <div className="playlist-generator">
      {(expires_in && expires_in > Date.now()) ||
        (!token && <button onClick={getCode}>Login</button>)}
      {token && (
        <form onSubmit={handleGenerateClick}>
          <div className="date-picker-container">
            <div className="date-picker">
              <label htmlFor="before-date">after Date</label>
              <input
                id="before-date"
                type="date"
                value={afterDate}
                onChange={(e) => setAfterDate(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit">Generate Playlist</button>
        </form>
      )}
    </div>
  );
}
