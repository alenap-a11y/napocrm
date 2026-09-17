import { useState } from 'react';

function extractSpotifyTrackId(url) {
  const match = url.match(/track\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

export default function SpotifyMiniPlayer({ url }) {
  const [loaded, setLoaded] = useState(false);
  const trackId = extractSpotifyTrackId(url);

  if (!trackId) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-sauge underline">
        Écouter
      </a>
    );
  }

  if (!loaded) {
    return (
      <button
        onClick={() => setLoaded(true)}
        className="text-xs px-3 py-1.5 rounded-full border border-sauge/25 text-saugeDark hover:bg-sauge/10"
      >
        ▶ Écouter sur Spotify
      </button>
    );
  }

  return (
    <iframe
      src={`https://open.spotify.com/embed/track/${trackId}`}
      width="100%"
      height="80"
      frameBorder="0"
      allow="encrypted-media"
      loading="lazy"
      title="Lecteur Spotify"
    />
  );
}
