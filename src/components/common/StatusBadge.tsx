import { Tag } from 'antd';
import { getEstadoClass, getEstadoColor } from '../../utils/formatters';

interface StatusBadgeProps {
  estado: string | undefined;
}

const estadoLabels: Record<string, string> = {
  pendiente: 'Pendiente',
  enviado_nubefact: 'Enviado',
  enviado: 'Enviado',
  aceptado: 'Aceptado',
  aceptada: 'Aceptado',
  aceptado_observaciones: 'Observado',
  rechazado: 'Rechazado',
  rechazada: 'Rechazado',
  error: 'Error',
};

export default function StatusBadge({ estado }: StatusBadgeProps) {
  if (!estado) {
    return <Tag className="status-badge status-pending">Pendiente</Tag>;
  }

  const estadoLower = estado.toLowerCase();
  const label = estadoLabels[estadoLower] || estado;
  const color = getEstadoColor(estadoLower);

  return (
    <Tag
      className={`status-badge ${getEstadoClass(estado)}`}
      color={color}
      style={{ borderRadius: 4 }}
    >
      {label}
    </Tag>
  );
}
