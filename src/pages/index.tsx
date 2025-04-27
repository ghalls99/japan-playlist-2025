import { useEffect } from "react";
import { getAccessToken, redirectToAuthCodeFlow } from "../app/lib/authorize";

// Convert this component to a Client Component
export default function Home() {
  const getCode = async () => {
    await redirectToAuthCodeFlow("9c9d1901cee94017ad5322993bcac64f");
  };

  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");

    if (code) {
      // Create an async function inside useEffect and call it immediately
      const fetchToken = async () => {
        const { access_token, expires_in } = await getAccessToken(
          "9c9d1901cee94017ad5322993bcac64f",
          code
        );

        localStorage.setItem("token", access_token);
        localStorage.setItem("expires_in", expires_in);
      };

      fetchToken().catch(console.error); // Handle any errors from the async function
    }
  }, []);

  const generatePlaylist = async () => {
    const token = localStorage.getItem("token");
    const expires_in = localStorage.getItem("expires_in");

    console.log(token, expires_in);
  };

  return (
    <div>
      <button onClick={getCode}>Login</button>
      {localStorage.getItem("token") && (
        <button onClick={generatePlaylist}>Generate Playlist</button>
      )}
    </div>
  );
}
