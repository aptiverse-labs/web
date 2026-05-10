"use client";

import { useTheme } from "@mui/material/styles";
import type { PieArcLabelProps } from "@mui/x-charts";

// Pill-shaped arc label with a soft drop shadow. Matches Euphoria.v4's
// pie-chart treatment so the slice percentages read as chips, not raw text.
export function PieChartArcLabel(props: PieArcLabelProps) {
  const theme = useTheme();
  const { startAngle, endAngle, arcLabelRadius, formattedArcLabel, isFaded } = props;

  if (arcLabelRadius == null || !formattedArcLabel) {
    return null;
  }

  const start = startAngle.get();
  const end = endAngle.get();
  const radius = arcLabelRadius.get();
  const midAngle = (start + end) / 2;
  const adjustedAngle = midAngle - Math.PI / 2;
  const x = radius * Math.cos(adjustedAngle);
  const y = radius * Math.sin(adjustedAngle);

  return (
    <g>
      <rect
        x={x - 26}
        y={y - 16}
        width="52"
        height="32"
        rx="16"
        ry="16"
        fill={isFaded ? theme.palette.action.hover : theme.palette.background.paper}
        stroke={isFaded ? theme.palette.divider : theme.palette.primary.main}
        strokeWidth={1.5}
        style={!isFaded ? { filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.18))" } : undefined}
      />
      <text
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="central"
        style={{
          fontSize: "0.75rem",
          fontWeight: 700,
          fill: isFaded ? theme.palette.text.disabled : theme.palette.primary.main,
        }}
      >
        {formattedArcLabel}
      </text>
    </g>
  );
}
