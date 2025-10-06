
export default function ErrorBanner({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 12,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 60,
        background: '#fef2f2',
        color: '#991b1b',
        border: '1px solid #fecaca',
        borderRadius: 8,
        padding: '8px 10px',
        boxShadow: '0 6px 18px rgba(0,0,0,.15)',
        fontSize: 14,
      }}
    >
      <span style={{ marginRight: 12 }}>{message}</span>
      <button onClick={onClose}>Cerrar</button>
    </div>
  );
}