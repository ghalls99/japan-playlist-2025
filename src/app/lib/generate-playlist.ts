export const generatePlaylist = async (before: number) => {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `https://api.spotify.com/v1/me/player/recently-played?before=${before}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const data = await response.json();
  console.log(data);
};
