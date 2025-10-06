
/**
 * Overlay de carga global con spinner + barra de progreso indeterminada.
 * No requiere estilos extra: usa clases globales ya existentes (base.scss)
 * y el <progress> nativo para ofrecer un "slider" de espera.
 */

export default function LoadingOverlay({
  show,
  label,
}: {
  show: boolean;
  label?: string;
}) {
  if (!show) return null;

  return (
    <div className="overlay-backdrop" role="dialog" aria-modal="true" aria-label="Operación en curso">
      <div className="overlay-card" style={{ minWidth: 260 }}>
        <div className="spinner" aria-hidden />
        <div className="overlay-text">{label || 'Trabajando…'}</div>
        {/* Barra indeterminada (slider de espera) */}
        <progress style={{ width: '100%' }} />
      </div>
    </div>
  );
}
