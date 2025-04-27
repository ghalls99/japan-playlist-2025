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
    // Add exponential backoff parameters
    let retryCount = 0;
    const maxRetries = 5;
    const baseDelay = 1000; // 1 second initial delay

    let success = false;

    while (!success && retryCount < maxRetries) {
      try {
        const response = await fetch(
          `https://api.spotify.com/v1/me/player/recently-played?before=${currentTime}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        // Check if response is OK
        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`);
        }

        const data = await response.json();
        console.log(
          `Fetched data for timestamp: ${new Date(currentTime).toISOString()}`,
        );

        console.log("data", JSON.stringify(data));

        if (data.items && data.items.length > 0) {
          console.log("data", JSON.stringify(data.items));
          // Extract track URIs and add to set (prevents duplicates)
          const newTracks = data.items.map((item) => item.track.uri);
          newTracks.forEach((uri) => trackUris.add(uri));

          // If we have tracks, add them to the playlist with exponential backoff
          if (newTracks.length > 0) {
            await addTracksToPlaylistWithBackoff(
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

        // If we made it here, the operation was successful
        success = true;
      } catch (error) {
        retryCount++;

        if (retryCount >= maxRetries) {
          console.error(`Max retries reached. Last error: ${error}`);
          // Still move the time window in case of errors
          currentTime -= twoHoursInMs;
          break;
        }

        // Calculate exponential backoff delay: baseDelay * 2^retryCount + small random jitter
        const delay =
          baseDelay * Math.pow(2, retryCount) + Math.random() * 1000;
        console.log(
          `Attempt ${retryCount} failed. Retrying in ${delay}ms. Error: ${error}`,
        );

        // Wait for the calculated delay before retrying
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  console.log(
    `Playlist created with ${trackUris.size} unique tracks from the last two weeks`,
  );
  return playlistId;
};

// Helper function to get user ID with exponential backoff
const getUserId = async (token: string): Promise<string> => {
  let retryCount = 0;
  const maxRetries = 5;
  const baseDelay = 1000;

  while (retryCount <= maxRetries) {
    try {
      const response = await fetch("https://api.spotify.com/v1/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      const data = await response.json();
      return data.id;
    } catch (error) {
      retryCount++;

      if (retryCount > maxRetries) {
        console.error("Failed to get user ID after maximum retries");
        throw error;
      }

      const delay = baseDelay * Math.pow(2, retryCount) + Math.random() * 1000;
      console.log(
        `Attempt to get user ID failed. Retrying in ${delay}ms. Error: ${error}`,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error("Could not get user ID"); // Failsafe
};

// Helper function to create a playlist with exponential backoff
const createPlaylist = async (token: string, userId: string, name: string) => {
  let retryCount = 0;
  const maxRetries = 5;
  const baseDelay = 1000;

  while (retryCount <= maxRetries) {
    try {
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
            description:
              "Automatically generated playlist of my listening history",
            public: false,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      retryCount++;

      if (retryCount > maxRetries) {
        console.error("Failed to create playlist after maximum retries");
        throw error;
      }

      const delay = baseDelay * Math.pow(2, retryCount) + Math.random() * 1000;
      console.log(
        `Attempt to create playlist failed. Retrying in ${delay}ms. Error: ${error}`,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error("Could not create playlist"); // Failsafe
};

// Helper function to add tracks to a playlist with exponential backoff
const addTracksToPlaylistWithBackoff = async (
  token: string,
  playlistId: string,
  trackUris: string[],
) => {
  // Spotify API limits 100 tracks per request
  const chunkSize = 100;

  for (let i = 0; i < trackUris.length; i += chunkSize) {
    const chunk = trackUris.slice(i, i + chunkSize);

    let retryCount = 0;
    const maxRetries = 5;
    const baseDelay = 1000;

    let success = false;

    while (!success && retryCount <= maxRetries) {
      try {
        const response = await fetch(
          `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              uris: chunk,
            }),
          },
        );

        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`);
        }

        // If we get here, the operation succeeded
        success = true;
      } catch (error) {
        retryCount++;

        if (retryCount > maxRetries) {
          console.error(
            `Failed to add tracks to playlist after maximum retries: ${error}`,
          );
          throw error;
        }

        const delay =
          baseDelay * Math.pow(2, retryCount) + Math.random() * 1000;
        console.log(
          `Attempt to add tracks failed. Retrying in ${delay}ms. Error: ${error}`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
};

// Keep the old function as a fallback or reference
// const addTracksToPlaylist = async (
//   token: string,
//   playlistId: string,
//   trackUris: string[],
// ) => {
//   // Spotify API limits 100 tracks per request
//   const chunkSize = 100;

//   for (let i = 0; i < trackUris.length; i += chunkSize) {
//     const chunk = trackUris.slice(i, i + chunkSize);

//     await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
//       method: "POST",
//       headers: {
//         Authorization: `Bearer ${token}`,
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         uris: chunk,
//       }),
//     });
//   }
// };
