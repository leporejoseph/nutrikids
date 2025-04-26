import { useEffect, useRef } from "react";
import { Nutrient } from "@shared/schema";
import Chart from "chart.js/auto";

interface MacronutrientsTabProps {
  nutrients: Nutrient[];
}

export default function MacronutrientsTab({ nutrients }: MacronutrientsTabProps) {
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current || nutrients.length === 0) return;

    // Destroy previous chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Prepare data for the donut chart
    const labels = nutrients.map(nutrient => nutrient.name);
    const values = nutrients.map(nutrient => {
      const numValue = parseFloat(nutrient.value);
      return isNaN(numValue) ? 0 : numValue;
    });

    // Colors for the chart segments
    const colors = [
      'rgba(107, 70, 193, 0.8)', // primary
      'rgba(42, 147, 213, 0.8)', // secondary
      'rgba(159, 122, 234, 0.8)', // accent
      'rgba(72, 187, 120, 0.8)', // green
      'rgba(237, 137, 54, 0.8)', // orange
    ];

    // Create the chart
    const ctx = chartRef.current.getContext('2d');
    if (ctx) {
      chartInstance.current = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{
            data: values,
            backgroundColor: colors,
            borderColor: 'white',
            borderWidth: 2,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
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
                  const label = context.label || '';
                  const value = context.raw || 0;
                  const unit = nutrients[context.dataIndex]?.unit || '';
                  return `${label}: ${value}${unit}`;
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
  }, [nutrients]);

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-success';
    if (percentage >= 70) return 'bg-primary';
    if (percentage >= 50) return 'bg-secondary';
    if (percentage >= 30) return 'bg-accent';
    return 'bg-warning';
  };

  return (
    <div className="tab-content animate-in fade-in">
      {/* Macronutrients Donut Chart */}
      <div className="chart-container mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="h-64">
          <canvas ref={chartRef}></canvas>
        </div>
      </div>

      {/* Macronutrient Details */}
      <div className="space-y-3">
        {nutrients.map((nutrient, index) => (
          <div key={index} className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
            <div className="flex justify-between mb-1">
              <span className="font-semibold">{nutrient.name}</span>
              <span className="font-semibold">{nutrient.value} {nutrient.unit}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className={`${getProgressColor(nutrient.percentOfDaily)} h-2.5 rounded-full`} 
                style={{ width: `${Math.min(100, nutrient.percentOfDaily)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span className="text-gray-500">{nutrient.percentOfDaily}% of daily target</span>
              <span className="text-gray-500">Recommended: {nutrient.recommendedRange}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
