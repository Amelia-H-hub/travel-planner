import Plot from 'react-plotly.js';

interface ChartProps {
  chartData: any;
  className?: string;
}

export default function PlotlyChart({ chartData, className }: ChartProps) {
  if (!chartData || !chartData.data) {
    return <div className="flex items-center justify-center h-full text-slate-400 text-sm">Waiting for chart data...</div>;
  }

  return (
    <div className={`w-full h-full flex justify-center items-center ${className}`}>
      <Plot
        data={chartData.data}
        layout={{
          ...chartData.layout,
          autosize: true,
          responsive: true,
          font: { family: 'inherit' },
          paper_bgcolor: 'rgba(0,0,0,0)', 
          plot_bgcolor: 'rgba(0,0,0,0)',
          margin: chartData.layout.margin || { t: 40, r: 20, l: 50, b: 40 },
        }}
        useResizeHandler={true}
        style={{ width: "100%", height: "100%" }}
        config={{ 
          displayModeBar: false, 
          responsive: true 
        }}
      />
    </div>
  );
}