

export const GateElement = ({ name }: { name: string }) => {
  const getColor = (gateName: string) => {
    switch (gateName) {
      case 'X': return '#4ade80'; // Green
      case 'Y': return '#60a5fa'; // Blue
      case 'Z': return '#f87171'; // Red
      case 'H': return '#c084fc'; // Purple
      default: return '#94a3b8';  // Gray
    }
  };

  return (
    <div
      style={{
        width: '40px',
        height: '40px',
        background: getColor(name),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontWeight: 'bold',
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        cursor: 'default',
      }}
    >
      {name}
    </div>
  );
};
