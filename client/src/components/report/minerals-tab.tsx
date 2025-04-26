import { useEffect, useRef } from "react";
import { Nutrient } from "@shared/schema";
import Chart from "chart.js/auto";

interface MineralsTabProps {
  minerals: Nutrient[];
}

export default function MineralsTab({ minerals }: MineralsTabProps) {
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current || minerals.length === 0) return;

    // Destroy previous chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Prepare data for the bar chart
    const labels = minerals.map(mineral => mineral.name);
    const percentages = minerals.map(mineral => mineral.percentOfDaily);
    
    // Dynamically calculate the maximum scale based on the highest percentage
    const maxPercentage = Math.max(...percentages, 100);
    const scaleMax = maxPercentage > 100 
      ? Math.ceil(maxPercentage / 100) * 100 // Round up to the nearest 100
      : 100;

    // Colors based on percentage for each bar
    const barColors = percentages.map(percentage => {
      if (percentage >= 90) return 'rgba(72, 187, 120, 0.8)'; // success
      if (percentage >= 70) return 'rgba(107, 70, 193, 0.8)'; // primary
      if (percentage >= 50) return 'rgba(42, 147, 213, 0.8)'; // secondary
      if (percentage >= 30) return 'rgba(159, 122, 234, 0.8)'; // accent
      return 'rgba(237, 137, 54, 0.8)'; // warning
    });

    // Create the chart
    const ctx = chartRef.current.getContext('2d');
    if (ctx) {
      chartInstance.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Percent of Daily Value',
            data: percentages,
            backgroundColor: barColors,
            borderColor: barColors.map(color => color.replace('0.8', '1')),
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'y',
          scales: {
            x: {
              beginAtZero: true,
              max: scaleMax,
              title: {
                display: true,
                text: 'Percent of Daily Value (%)',
                font: {
                  family: 'Inter, sans-serif',
                  size: 12
                }
              },
              ticks: {
                callback: function(value) {
                  return value + '%';
                }
              }
            },
            y: {
              ticks: {
                font: {
                  family: 'Inter, sans-serif',
                  size: 11
                }
              }
            }
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const value = context.raw || 0;
                  const index = context.dataIndex;
                  const mineralValue = minerals[index].value;
                  const mineralUnit = minerals[index].unit;
                  return [
                    `${value}% of daily value`,
                    `Amount: ${mineralValue} ${mineralUnit}`
                  ];
                }
              }
            }
          },
          animation: {
            duration: 1000,
            easing: 'easeOutQuad'
          }
        }
      });
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [minerals]);

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-success';
    if (percentage >= 70) return 'bg-primary';
    if (percentage >= 50) return 'bg-secondary';
    if (percentage >= 30) return 'bg-accent';
    return 'bg-warning';
  };

  return (
    <div className="tab-content animate-in fade-in">
      {/* Minerals Bar Chart */}
      <div className="chart-container mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="h-64">
          <canvas ref={chartRef}></canvas>
        </div>
      </div>

      {/* Minerals List */}
      <div className="space-y-3">
        {minerals.map((mineral, index) => (
          <div key={index} className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
            <div className="flex justify-between mb-1">
              <span className="font-semibold">{mineral.name}</span>
              <span className="font-semibold">{mineral.value} {mineral.unit}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className={`${getProgressColor(mineral.percentOfDaily)} h-2.5 rounded-full`} 
                style={{ width: `${Math.min(100, mineral.percentOfDaily)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span className="text-gray-500">{mineral.percentOfDaily}% of daily target</span>
              <span className="text-gray-500">Recommended: {mineral.recommendedRange}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
