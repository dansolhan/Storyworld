import { EDGE_COLOR_ENTRY, EDGE_COLOR_EXIT, EDGE_COLOR_DEFAULT } from './edgeColors';

/**
 * Arrowheads for the floating edges, defined once and referenced by id.
 *
 * Sized in stroke-width units, so the multipliers below compensate for the
 * hairline strokes the design calls for — at `markerWidth: 6` a 1px edge would
 * end in a 6px arrow you could barely see.
 */
export const EdgeMarkers = () => {
  const markers = [
    { id: 'floating-arrow-entry', color: EDGE_COLOR_ENTRY, size: 8 },
    { id: 'floating-arrow-exit', color: EDGE_COLOR_EXIT, size: 8 },
    { id: 'floating-arrow-default', color: EDGE_COLOR_DEFAULT, size: 7 },
  ];

  return (
    <svg style={{ position: 'absolute', width: 0, height: 0 }}>
      <defs>
        {markers.map((marker) => (
          <marker
            key={marker.id}
            id={marker.id}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerUnits="strokeWidth"
            markerWidth={marker.size}
            markerHeight={marker.size}
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill={marker.color} />
          </marker>
        ))}
      </defs>
    </svg>
  );
};
