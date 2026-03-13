export const EdgeMarkers = () => {
  const ENTRY_HEX = '#10b981';
  const EXIT_HEX = '#6366f1';
  const DEFAULT_HEX = '#94a3b8';

  return (
    <svg style={{ position: 'absolute', width: 0, height: 0 }}>
      <defs>
        <marker
          id="floating-arrow-entry"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerUnits="strokeWidth"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={ENTRY_HEX} />
        </marker>
        <marker
          id="floating-arrow-exit"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerUnits="strokeWidth"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={EXIT_HEX} />
        </marker>
        <marker
          id="floating-arrow-default"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerUnits="strokeWidth"
          markerWidth="5"
          markerHeight="5"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={DEFAULT_HEX} />
        </marker>
      </defs>
    </svg>
  );
};
