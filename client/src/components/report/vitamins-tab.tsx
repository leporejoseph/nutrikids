import { useEffect, useRef } from "react";
import { Nutrient } from "@shared/schema";
import Chart from "chart.js/auto";

interface VitaminsTabProps {
  vitamins: Nutrient[];
}

export default function VitaminsTab({ vitamins }: VitaminsTabProps) {
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current || vitamins.length === 0) return;

    // Destroy previous chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Prepare data for the radar chart
    const labels = vitamins.map(vitamin => vitamin.name);
    const percentages = vitamins.map(vitamin => vitamin.percentOfDaily);

    // Create the chart
    const ctx = chartRef.current.getContext('2d');
    if (ctx) {
      chartInstance.current = new Chart(ctx, {
        type: 'radar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Current Intake (%)',
            data: percentages,
            backgroundColor: 'rgba(107, 70, 193, 0.2)',
            borderColor: 'rgba(107, 70, 193, 0.8)',
            pointBackgroundColor: 'rgba(107, 70, 193, 1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(107, 70, 193, 1)',
            borderWidth: 2
          }, {
            label: 'Target (100%)',
            data: Array(labels.length).fill(100),
            backgroundColor: 'rgba(42, 147, 213, 0.1)',
            borderColor: 'rgba(42, 147, 213, 0.5)',
            borderWidth: 1,
            borderDash: [5, 5],
            pointRadius: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            r: {
              angleLines: {
                display: true,
                color: 'rgba(0, 0, 0, 0.1)'
              },
              suggestedMin: 0,
              suggestedMax: 100,
              ticks: {
                stepSize: 25,
                callback: function(value) {
                  return value + '%';
                }
              }
            }
          },
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                font: {
                  family: 'Inter, sans-serif',
                  size: 12
                },
                padding: 20
              }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const label = context.dataset.label || '';
                  const value = context.raw || 0;
                  return `${label}: ${value}%`;
                }
              }
            }
          },
          animation: {
            duration: 1000,
            easing: 'easeOutCubic'
          }
        }
      });
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [vitamins]);

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-success';
    if (percentage >= 70) return 'bg-primary';
    if (percentage >= 50) return 'bg-secondary';
    if (percentage >= 30) return 'bg-accent';
    return 'bg-warning';
  };

  return (
    <div className="tab-content animate-in fade-in">
      {/* Vitamins Radar Chart */}
      <div className="chart-container mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="h-64">
          <canvas ref={chartRef}></canvas>
        </div>
      </div>

      {/* Vitamins List */}
      <div className="space-y-3">
        {vitamins.map((vitamin, index) => (
          <div key={index} className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
            <div className="flex justify-between mb-1">
              <span className="font-semibold">{vitamin.name}</span>
              <span className="font-semibold">{vitamin.value} {vitamin.unit}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className={`${getProgressColor(vitamin.percentOfDaily)} h-2.5 rounded-full`} 
                style={{ width: `${Math.min(100, vitamin.percentOfDaily)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span className="text-gray-500">{vitamin.percentOfDaily}% of daily target</span>
              <span className="text-gray-500">Recommended: {vitamin.recommendedRange}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
