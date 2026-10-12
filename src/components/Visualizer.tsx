import React, { useEffect, useRef } from 'react';
import { VisualizerMode } from '../types';
import { audioEngine } from '../services/audioEngine';

interface VisualizerProps {
  mode: VisualizerMode;
  isPlaying: boolean;
  className?: string;
  accentColor?: string;
}

export const Visualizer: React.FC<VisualizerProps> = ({
  mode,
  isPlaying,
  className = '',
  accentColor = '#f59e0b',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const peakHoldRef = useRef<number[]>([]);
  const vuNeedleRef = useRef<{ left: number; right: number }>({ left: 0, right: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const freqData = audioEngine.getFrequencyData();
      const timeData = audioEngine.getTimeDomainData();

      if (mode === 'bars') {
        const barCount = 48;
        const barWidth = (width / barCount) - 3;
        const step = Math.floor(freqData.length / barCount);

        if (peakHoldRef.current.length !== barCount) {
          peakHoldRef.current = new Array(barCount).fill(0);
        }

        for (let i = 0; i < barCount; i++) {
          const val = isPlaying ? freqData[i * step] : 12;
          const barHeight = (val / 255) * (height - 12);
          const x = i * (barWidth + 3);
          const y = height - barHeight;

          // Peak drop logic
          if (barHeight > peakHoldRef.current[i]) {
            peakHoldRef.current[i] = barHeight;
          } else {
            peakHoldRef.current[i] = Math.max(0, peakHoldRef.current[i] - 1.2);
          }

          // Bar gradient
          const grad = ctx.createLinearGradient(0, height, 0, y);
          grad.addColorStop(0, 'rgba(245, 158, 11, 0.2)');
          grad.addColorStop(0.6, accentColor);
          grad.addColorStop(1, '#ec4899');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, [2, 2, 0, 0]);
          ctx.fill();

          // Peak dot
          const peakY = height - peakHoldRef.current[i] - 2;
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(x, Math.max(2, peakY), barWidth, 2);
        }
      } else if (mode === 'wave') {
        ctx.lineWidth = 2.5;
        const grad = ctx.createLinearGradient(0, 0, width, 0);
        grad.addColorStop(0, '#f59e0b');
        grad.addColorStop(0.5, '#38bdf8');
        grad.addColorStop(1, '#a855f7');
        ctx.strokeStyle = grad;
        ctx.shadowColor = 'rgba(56, 189, 248, 0.4)';
        ctx.shadowBlur = 8;

        ctx.beginPath();
        const sliceWidth = width / (timeData.length - 1);
        let x = 0;

        for (let i = 0; i < timeData.length; i++) {
          const v = isPlaying ? timeData[i] / 128.0 : 1;
          const y = (v * height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }

        ctx.stroke();
        ctx.shadowBlur = 0;
      } else if (mode === 'radial') {
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(centerX, centerY) * 0.45;
        const barCount = 64;
        const step = Math.floor(freqData.length / barCount);

        for (let i = 0; i < barCount; i++) {
          const val = isPlaying ? freqData[i * step] : 8;
          const barLen = (val / 255) * (Math.min(centerX, centerY) * 0.48);
          const angle = (i / barCount) * Math.PI * 2;

          const startX = centerX + Math.cos(angle) * radius;
          const startY = centerY + Math.sin(angle) * radius;
          const endX = centerX + Math.cos(angle) * (radius + barLen);
          const endY = centerY + Math.sin(angle) * (radius + barLen);

          ctx.strokeStyle = i % 2 === 0 ? accentColor : '#38bdf8';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
        }

        // Inner glowing ring
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius - 2, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else if (mode === 'vu') {
        // Dual Analog VU Meter (Left and Right channel)
        const meterWidth = (width - 24) / 2;
        const meterHeight = height - 12;

        const drawSingleVU = (offsetX: number, label: string, isLeft: boolean) => {
          // Meter casing
          ctx.fillStyle = '#141822';
          ctx.strokeStyle = '#2d3748';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(offsetX, 6, meterWidth, meterHeight, 8);
          ctx.fill();
          ctx.stroke();

          // Dial face background
          ctx.fillStyle = '#f8fafc';
          ctx.beginPath();
          ctx.roundRect(offsetX + 6, 12, meterWidth - 12, meterHeight - 24, 6);
          ctx.fill();

          // Arc scale
          const pivotX = offsetX + meterWidth / 2;
          const pivotY = meterHeight + 4;
          const radius = meterHeight * 0.85;

          ctx.strokeStyle = '#64748b';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(pivotX, pivotY, radius, Math.PI * 1.25, Math.PI * 1.75);
          ctx.stroke();

          // Red zone arc (+0 to +3 dB)
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(pivotX, pivotY, radius, Math.PI * 1.62, Math.PI * 1.75);
          ctx.stroke();

          // Scale markers
          const ticks = [-20, -10, -7, -5, -3, -1, 0, 1, 2, 3];
          ticks.forEach((tick, idx) => {
            const ratio = idx / (ticks.length - 1);
            const angle = Math.PI * 1.25 + ratio * (Math.PI * 0.5);
            const x1 = pivotX + Math.cos(angle) * (radius - 5);
            const y1 = pivotY + Math.sin(angle) * (radius - 5);
            const x2 = pivotX + Math.cos(angle) * radius;
            const y2 = pivotY + Math.sin(angle) * radius;

            ctx.strokeStyle = tick >= 0 ? '#ef4444' : '#334155';
            ctx.lineWidth = tick === 0 ? 2 : 1;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
          });

          // Compute average audio energy for needle
          let sum = 0;
          const slice = isLeft ? freqData.slice(0, 32) : freqData.slice(32, 64);
          for (let s = 0; s < slice.length; s++) {
            sum += slice[s];
          }
          const target = isPlaying ? (sum / (slice.length * 255)) : 0.05;

          // Ballistics smoothing
          const currentNeedle = isLeft ? vuNeedleRef.current.left : vuNeedleRef.current.right;
          const nextVal = currentNeedle + (target - currentNeedle) * 0.22;
          if (isLeft) vuNeedleRef.current.left = nextVal;
          else vuNeedleRef.current.right = nextVal;

          const needleAngle = Math.PI * 1.25 + Math.min(1, Math.max(0, nextVal)) * (Math.PI * 0.5);
          const tipX = pivotX + Math.cos(needleAngle) * (radius + 2);
          const tipY = pivotY + Math.sin(needleAngle) * (radius + 2);

          // Needle shadow & needle line
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(pivotX, pivotY);
          ctx.lineTo(tipX, tipY);
          ctx.stroke();

          // Pivot screw
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(pivotX, pivotY - 4, 4, 0, Math.PI * 2);
          ctx.fill();

          // Label
          ctx.fillStyle = '#475569';
          ctx.font = '10px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`CH ${label}`, offsetX + meterWidth / 2, meterHeight - 2);
        };

        drawSingleVU(6, 'LEFT', true);
        drawSingleVU(meterWidth + 18, 'RIGHT', false);
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [mode, isPlaying, accentColor]);

  // Adjust canvas size to parent container
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};
