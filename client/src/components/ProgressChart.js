import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaCalendarDay, FaCalendarWeek, FaCalendar } from 'react-icons/fa';
import './ProgressChart.css';

const ProgressChart = () => {
  const [period, setPeriod] = useState('week');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgressData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const loadProgressData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/stats/progress?period=${period}`);
      setData(response.data);
    } catch (error) {
      console.error('Error al cargar datos de progreso:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    
    if (period === 'day') {
      return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
    } else if (period === 'week') {
      return `Sem ${Math.ceil((date.getDate()) / 7)}`;
    } else {
      return date.toLocaleDateString('es-ES', { month: 'short' });
    }
  };

  const renderChart = () => {
    if (!data || data.length === 0) {
      return (
        <div className="chart-empty">
          <p>No hay datos disponibles para este período</p>
        </div>
      );
    }

    const chartWidth = 100; // porcentaje
    const chartHeight = 200; // px
    const padding = { top: 20, right: 10, bottom: 30, left: 40 };
    
    const maxScore = 100;
    const minScore = 0;
    
    // Calcular puntos para la línea
    const points = data.map((item, index) => {
      const x = (index / (data.length - 1 || 1)) * (chartWidth - padding.left - padding.right) + padding.left;
      const y = chartHeight - padding.bottom - ((item.percentage - minScore) / (maxScore - minScore)) * (chartHeight - padding.top - padding.bottom);
      return { x, y, percentage: item.percentage, date: item.date, count: item.count };
    });

    // Crear path para la línea
    const linePath = points.map((point, index) => {
      return `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`;
    }).join(' ');

    // Crear path para el área bajo la línea
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${chartHeight - padding.bottom} L ${padding.left} ${chartHeight - padding.bottom} Z`;

    return (
      <div className="chart-wrapper">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none" className="chart-svg">
          {/* Grid lines */}
          <g className="grid-lines">
            {[0, 25, 50, 75, 100].map((value) => {
              const y = chartHeight - padding.bottom - ((value - minScore) / (maxScore - minScore)) * (chartHeight - padding.top - padding.bottom);
              return (
                <line
                  key={value}
                  x1={padding.left}
                  y1={y}
                  x2={chartWidth - padding.right}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeWidth="0.2"
                />
              );
            })}
          </g>

          {/* Área bajo la línea */}
          <path
            d={areaPath}
            fill="url(#gradient)"
            opacity="0.2"
          />

          {/* Línea principal */}
          <path
            d={linePath}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="0.8"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Puntos en la línea */}
          {points.map((point, index) => (
            <circle
              key={index}
              cx={point.x}
              cy={point.y}
              r="1"
              fill="#3b82f6"
              className="chart-point"
            />
          ))}

          {/* Gradiente para el área */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        {/* Y-axis labels */}
        <div className="y-axis-labels">
          {[100, 75, 50, 25, 0].map((value) => (
            <div key={value} className="y-label">
              {value}%
            </div>
          ))}
        </div>

        {/* X-axis labels */}
        <div className="x-axis-labels">
          {data.map((item, index) => (
            <div key={index} className="x-label">
              {formatDate(item.date)}
            </div>
          ))}
        </div>

        {/* Tooltip on hover */}
        <div className="chart-tooltip-container">
          {points.map((point, index) => (
            <div
              key={index}
              className="tooltip-trigger"
              style={{
                left: `${point.x}%`,
                top: `${point.y}px`
              }}
            >
              <div className="chart-tooltip">
                <div className="tooltip-date">{formatDate(data[index].date)}</div>
                <div className="tooltip-score">{point.percentage.toFixed(1)}%</div>
                <div className="tooltip-count">{point.count} cuestionarios</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="progress-chart-container">
      <div className="progress-chart-header">
        <h2>Progreso en el Tiempo</h2>
        <div className="period-toggle">
          <button
            className={`period-btn ${period === 'day' ? 'active' : ''}`}
            onClick={() => setPeriod('day')}
            title="Últimos 7 días"
          >
            <FaCalendarDay />
            <span>Día</span>
          </button>
          <button
            className={`period-btn ${period === 'week' ? 'active' : ''}`}
            onClick={() => setPeriod('week')}
            title="Últimas 8 semanas"
          >
            <FaCalendarWeek />
            <span>Semana</span>
          </button>
          <button
            className={`period-btn ${period === 'month' ? 'active' : ''}`}
            onClick={() => setPeriod('month')}
            title="Últimos 6 meses"
          >
            <FaCalendar />
            <span>Mes</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="chart-loading">
          <div className="spinner"></div>
        </div>
      ) : (
        renderChart()
      )}
    </div>
  );
};

export default ProgressChart;
