import React, { useMemo } from 'react';

/**
 * Leaderboard Component
 *
 * Displays a feed of "Beyond the Call" (btc_nomination) and
 * "citizen_commendation" events.
 * It takes the full 'events' array and filters it internally.
 */
function Leaderboard({ events }) {

  /**
   * We use useMemo to filter the events.
   * This calculation only re-runs if the 'events' prop changes.
   * We are looking for any event that is NOT a 'community_engagement'.
   */
  const recognitionEvents = useMemo(() => {
    return events
      .filter(event => 
        event.type === 'btc_nomination' || 
        event.type === 'citizen_commendation'
      )
      .sort((a, b) => new Date(b.date) - new Date(a.date)); // Show newest first
  }, [events]);

  /**
   * Helper function to return a styled icon based on the event type.
   */
  const getIcon = (type) => {
    switch (type) {
      case 'btc_nomination':
        return <span className="text-xl" title="AI Transcript Flag">🌟</span>; // Star
      case 'citizen_commendation':
        return <span className="text-xl" title="Citizen Commendation">👍</span>; // Thumbs up
      default:
        return <span className="text-xl"></span>;
    }
  };

  return (
    // 'h-full' and 'flex-col' make it fill the container from App.js
    <div className="flex flex-col h-full space-y-4">
      {recognitionEvents.length > 0 ? (
        recognitionEvents.map(event => (
          <div 
            key={event.id} 
            className="flex items-start p-3 bg-gray-700/50 rounded-lg shadow-md"
          >
            {/* Icon Column */}
            <div className="mr-3 pt-1">
              {getIcon(event.type)}
            </div>
            
            {/* Content Column */}
            <div className="flex-1">
              <p className="font-semibold text-white">{event.summary}</p>
              <p className="text-sm text-gray-400">
                {event.officer} - <span className="font-mono text-xs">{event.date}</span>
              </p>
              {/* Add a source tag if it came from our AI */}
              {event.source && (
                <span className="text-xs font-medium bg-purple-600 text-purple-100 px-2 py-0.5 rounded-full mt-1 inline-block">
                  {event.source.replace('_', ' ')}
                </span>
              )}
            </div>
          </div>
        ))
      ) : (
        // Show this if no recognition events are found
        <p className="text-gray-400">No recognitions logged yet.</p>
      )}
    </div>
  );
}

export default Leaderboard;