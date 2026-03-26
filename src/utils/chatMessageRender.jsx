/**
 * Renders chat text: segments wrapped in single asterisks *like this* as italics (action / stage direction).
 */
export function MessageBody({ text }) {
  const parts = String(text ?? '').split(/(\*[^*]+\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
          return (
            <em key={i} style={{ fontStyle: 'italic' }}>
              {part.slice(1, -1)}
            </em>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}
