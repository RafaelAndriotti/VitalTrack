import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import type { ReactNode } from 'react';
import { Colors } from '@/constants/theme';

export interface RingArc {
  value: number;
  max: number;
  color: string;
  /** Lido por leitores de tela: "Hidratação, 50% da meta". */
  label?: string;
}

interface RingProps {
  /** Do mais externo para o mais interno. */
  arcs: RingArc[];
  size?: number;
  stroke?: number;
  /** Espaço entre um anel e o seguinte. */
  gap?: number;
  track?: string;
  /** Leitura central (número grande, unidade). */
  children?: ReactNode;
}

const ratio = (value: number, max: number) => (max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0);

/**
 * Arco que começa às 12 h e avança no sentido horário. Desenhado como path, e
 * não como círculo girado, porque `transform` em <G> vaza um atributo inválido
 * no DOM quando o app roda na web.
 */
function arcPath(cx: number, cy: number, r: number, fraction: number): string {
  // Um círculo completo não cabe em um único arco: 360° começa e termina no
  // mesmo ponto. Dois semicírculos resolvem.
  if (fraction >= 1) {
    return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx} ${cy + r} A ${r} ${r} 0 1 1 ${cx} ${cy - r}`;
  }
  const theta = fraction * 2 * Math.PI;
  const x = cx + r * Math.sin(theta);
  const y = cy - r * Math.cos(theta);
  return `M ${cx} ${cy - r} A ${r} ${r} 0 ${theta > Math.PI ? 1 : 0} 1 ${x} ${y}`;
}

/**
 * Anéis concêntricos — a assinatura do VitalTrack: o dia lido de uma vez,
 * uma cor por domínio. Sem brilho, sem gradiente: arco cheio sobre trilho.
 */
export function Ring({ arcs, size = 168, stroke = 12, gap = 6, track = Colors.track, children }: RingProps) {
  const center = size / 2;
  const radiusOf = (index: number) => center - stroke / 2 - index * (stroke + gap);
  const label = arcs
    .map((arc) => arc.label && `${arc.label}, ${Math.round(ratio(arc.value, arc.max) * 100)}% da meta`)
    .filter(Boolean)
    .join('. ');

  return (
    <View
      style={[styles.wrap, { width: size, height: size }]}
      accessible={label.length > 0}
      accessibilityRole="image"
      accessibilityLabel={label || undefined}
    >
      <Svg width={size} height={size}>
        {arcs.map((arc, index) => {
          const radius = radiusOf(index);
          if (radius <= 0) return null;
          return (
            <Circle
              key={`track-${index}`}
              cx={center}
              cy={center}
              r={radius}
              stroke={track}
              strokeWidth={stroke}
              fill="none"
            />
          );
        })}
        {arcs.map((arc, index) => {
          const radius = radiusOf(index);
          const fraction = ratio(arc.value, arc.max);
          if (radius <= 0 || fraction <= 0) return null;
          return (
            <Path
              key={`arc-${index}`}
              d={arcPath(center, center, radius, fraction)}
              stroke={arc.color}
              strokeWidth={stroke}
              strokeLinecap="round"
              fill="none"
            />
          );
        })}
      </Svg>
      {children ? <View style={styles.center} pointerEvents="none">{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  center: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center' },
});
