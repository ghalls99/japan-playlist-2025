const clientId = "YOUR_CLIENT_ID";
const redirectUri = "http://127.0.0.1:8080";

const scope = "user-read-private user-read-email";
const authUrl = new URL("https://accounts.spotify.com/authorize");

export default function Home() {
  return (
    <div>
      <button onClick>Click me</button>
    </div>
  );
}
