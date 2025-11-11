'use client';

import { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface RegistroProgreso {
  semana: number;
  peso: number;
  repeticiones: number;
  volumen: number;
  fecha: string;
}

interface ProgressChartProps {
  registros: RegistroProgreso[];
  ejercicioId: string;
}

export default function ProgressChart({ registros, ejercicioId }: ProgressChartProps) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isDesktop, setIsDesktop] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Detectar si es desktop y actualizar en resize
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  if (!registros || registros.length === 0) {
    return null;
  }

  // Preparar datos para la gráfica
  const datosGrafica = registros
    .sort((a, b) => a.semana - b.semana)
    .map((registro) => ({
      semana: `Sem ${registro.semana}`,
      semanaNum: registro.semana,
      peso: registro.peso,
      repeticiones: registro.repeticiones,
      volumen: registro.volumen,
      fecha: new Date(registro.fecha).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short'
      })
    }));

  // Si solo hay un punto de datos, no tiene sentido mostrar una gráfica
  if (datosGrafica.length < 2) {
    return null;
  }

  // Calcular ancho base: en desktop usar menos espacio por punto, en mobile más
  const anchoBasePorPunto = isDesktop ? 60 : 100;
  const anchoBase = Math.max(isDesktop ? 400 : 600, datosGrafica.length * anchoBasePorPunto);
  const anchoGrafica = Math.round(anchoBase * zoomLevel);

  // Manejar zoom con la rueda del mouse en desktop (solo cuando está sobre el contenedor)
  useEffect(() => {
    if (!isDesktop || !containerRef.current) return;

    const container = containerRef.current;
    let isHovering = false;

    const handleMouseEnter = () => {
      isHovering = true;
    };

    const handleMouseLeave = () => {
      isHovering = false;
    };

    const handleWheel = (e: WheelEvent) => {
      if (isHovering && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        e.stopPropagation();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoomLevel((prev) => Math.max(0.5, Math.min(3, prev + delta)));
      }
    };

    container.addEventListener('mouseenter', handleMouseEnter);
    container.addEventListener('mouseleave', handleMouseLeave);
    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('mouseenter', handleMouseEnter);
      container.removeEventListener('mouseleave', handleMouseLeave);
      container.removeEventListener('wheel', handleWheel);
    };
  }, [isDesktop]);

  // Calcular altura del eje X y márgenes basado en si está rotado y si es mobile
  const tieneAngulo = datosGrafica.length > 8 || (isDesktop && datosGrafica.length > 6);
  const alturaEjeX = isDesktop 
    ? (tieneAngulo ? 45 : 15)
    : (tieneAngulo ? 40 : 12);
  const marginBottom = isDesktop 
    ? (tieneAngulo ? 45 : 10)
    : (tieneAngulo ? 25 : 8);
  const marginTop = isDesktop ? 5 : 20;
  const marginLeft = isDesktop ? 10 : 5;
  const alturaChart = isDesktop ? 250 : 240;

  return (
    <div className={isDesktop ? "mt-4" : "mt-2"}>
      <div className={`flex items-center justify-between ${isDesktop ? 'mb-2' : 'mb-1'}`}>
        <h5 className={`${isDesktop ? 'text-sm' : 'text-xs'} font-medium text-gray-700`}>Gráfica de Progreso</h5>
        {isDesktop && (
          <span className="text-xs text-gray-500">
            Ctrl/Cmd + Rueda para hacer zoom
          </span>
        )}
      </div>
      <div 
        ref={containerRef}
        className="w-full overflow-x-auto overflow-y-visible" 
        style={{ 
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'thin',
          scrollbarColor: '#cbd5e1 #f1f5f9'
        }}
      >
        <div style={{ width: `${anchoGrafica}px`, height: `${alturaChart}px` }}>
          <LineChart 
            width={anchoGrafica} 
            height={alturaChart} 
            data={datosGrafica} 
            margin={{ top: marginTop, right: 15, left: marginLeft, bottom: marginBottom }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="semana" 
              stroke="#6b7280"
              style={{ fontSize: isDesktop ? '11px' : '10px' }}
              tick={{ fill: '#6b7280', fontSize: isDesktop ? 11 : 10 }}
              angle={tieneAngulo ? -45 : 0}
              textAnchor={tieneAngulo ? 'end' : 'middle'}
              height={alturaEjeX}
            />
            <YAxis 
              yAxisId="left"
              stroke="#3b82f6"
              style={{ fontSize: isDesktop ? '11px' : '10px' }}
              tick={{ fill: '#3b82f6', fontSize: isDesktop ? 11 : 10 }}
              width={isDesktop ? 60 : 45}
              label={isDesktop ? { value: 'Peso (kg) / Reps', angle: -90, position: 'insideLeft', style: { fontSize: '11px', fill: '#6b7280' } } : undefined}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              stroke="#10b981"
              style={{ fontSize: isDesktop ? '11px' : '10px' }}
              tick={{ fill: '#10b981', fontSize: isDesktop ? 11 : 10 }}
              width={isDesktop ? 60 : 45}
              label={isDesktop ? { value: 'Volumen (kg)', angle: 90, position: 'insideRight', style: { fontSize: '11px', fill: '#6b7280' } } : undefined}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '12px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              formatter={(value: number, name: string) => {
                if (name === 'peso') return [`${value.toFixed(1)} kg`, 'Peso'];
                if (name === 'repeticiones') return [value, 'Repeticiones'];
                if (name === 'volumen') return [`${value.toLocaleString('es-ES')} kg`, 'Volumen'];
                return [value, name];
              }}
              labelFormatter={(label, payload) => {
                if (payload && payload[0]) {
                  return `${label} - ${payload[0].payload.fecha}`;
                }
                return label;
              }}
            />
            <Legend 
              wrapperStyle={{ 
                fontSize: isDesktop ? '11px' : '9px', 
                paddingTop: isDesktop ? '5px' : '2px', 
                paddingBottom: '0' 
              }}
              iconType="line"
              iconSize={isDesktop ? 12 : 10}
            />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="peso" 
              stroke="#3b82f6" 
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
              name="Peso (kg)"
            />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="repeticiones" 
              stroke="#8b5cf6" 
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6, stroke: '#8b5cf6', strokeWidth: 2 }}
              name="Repeticiones"
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="volumen" 
              stroke="#10b981" 
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
              name="Volumen (kg)"
            />
          </LineChart>
        </div>
      </div>
    </div>
  );
}

