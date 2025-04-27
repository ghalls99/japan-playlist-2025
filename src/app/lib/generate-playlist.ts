export const generatePlaylist = async (before: number, token: string) => {
  const userId = await getUserId(token);
  const playlistName = `My Retrospective - ${new Date().toLocaleDateString()}`;

  // Create a new playlist
  const playlist = await createPlaylist(token, userId, playlistName);
  const playlistId = playlist.id;

  // Set up time variables
  const twoWeeksInMs = 14 * 24 * 60 * 60 * 1000;
  const twoHoursInMs = 2 * 60 * 60 * 1000;
  const endTime = before;
  const startTime = before - twoWeeksInMs;

  // Store track URIs to avoid duplicates
  const trackUris = new Set();

  // Fetch data in 2-hour chunks
  let currentTime = endTime;

  while (currentTime > startTime) {
    try {
      const response = await fetch(
        `https://api.spotify.com/v1/me/player/recently-played?before=${currentTime}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();
      console.log(
        `Fetched data for timestamp: ${new Date(currentTime).toISOString()}`,
      );

      if (data.items && data.items.length > 0) {
        // Extract track URIs and add to set (prevents duplicates)
        const newTracks = data.items.map((item) => item.track.uri);
        newTracks.forEach((uri) => trackUris.add(uri));

        // If we have tracks, add them to the playlist
        if (newTracks.length > 0) {
          await addTracksToPlaylist(
            token,
            playlistId,
            Array.from(trackUris as unknown as string),
          );
        }

        // Update the timestamp for the next iteration
        // Use the oldest timestamp from the current batch
        const oldestTimestamp = new Date(
          data.items[data.items.length - 1].played_at,
        ).getTime();
        currentTime = oldestTimestamp - 1; // Subtract 1ms to avoid duplicate entries
      } else {
        // If no items returned, move back by 2 hours
        currentTime -= twoHoursInMs;
      }
    } catch (error) {
      console.error("Error fetching or adding tracks:", error);
      // Still move the time window in case of errors
      currentTime -= twoHoursInMs;
    }
  }

  console.log(
    `Playlist created with ${trackUris.size} unique tracks from the last two weeks`,
  );
  return playlistId;
};

// Helper function to get user ID
const getUserId = async (token: string): Promise<string> => {
  const response = await fetch("https://api.spotify.com/v1/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  return data.id;
};

// Helper function to create a playlist
const createPlaylist = async (token: string, userId: string, name: string) => {
  const response = await fetch(
    `https://api.spotify.com/v1/users/${userId}/playlists`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        description: "Automatically generated playlist of my listening history",
        public: false,
      }),
    },
  );

  return await response.json();
};

// Helper function to add tracks to a playlist
const addTracksToPlaylist = async (
  token: string,
  playlistId: string,
  trackUris: string[],
) => {
  // Spotify API limits 100 tracks per request
  const chunkSize = 100;

  for (let i = 0; i < trackUris.length; i += chunkSize) {
    const chunk = trackUris.slice(i, i + chunkSize);

    await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        uris: chunk,
      }),
    });
  }
};
