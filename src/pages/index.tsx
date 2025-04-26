import { redirectToAuthCodeFlow } from "../app/lib/authorize";

// Convert this component to a Client Component
export default function Home() {
  const getCode = async () => {
    await redirectToAuthCodeFlow("9c9d1901cee94017ad5322993bcac64f");
  };
  return (
    <div>
      <button onClick={getCode}>Click me</button>
    </div>
  );
}
