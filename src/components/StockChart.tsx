import * as React from 'react';
import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import { LineChart } from '@mui/x-charts/LineChart';

interface StockChartProps {
  symbol: string;
}

interface StockData {
  symbol: string;
  company_name: string;
  data: {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }[];
}

export default function StockChart({ symbol }: StockChartProps) {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('6M');
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStockData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `http://localhost:8000/stocks/${symbol}/history?period=${period}`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch stock data');
        }
        
        const data = await response.json();
        setStockData(data);
        console.log(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchStockData();
  }, [symbol, period]);
  
  const handlePeriodChange = (event: SelectChangeEvent) => {
    setPeriod(event.target.value as string);
  };

  // Transform stock data for the chart
  const prepareChartData = () => {
    if (!stockData || !stockData.data || stockData.data.length === 0) {
      return { xAxis: [], series: [] };
    }

    // Sort data by date (ascending)
    const sortedData = [...stockData.data].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Get dates for x-axis
    const dates = sortedData.map(item => new Date(item.date));
    
    // Get closing prices for main series
    const closingPrices = sortedData.map(item => item.close);
    
    return {
      xAxis: [{ 
        data: dates,
        scaleType: 'time' as const,
        valueFormatter: (date: Date) => date.toLocaleDateString()
      }],
      series: [
        {
          data: closingPrices,
          label: 'Close Price',
          color: '#2e7d32'
        }
      ]
    };
  };
  
  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          {symbol} Price History
        </Typography>
        
        <FormControl sx={{ minWidth: 120 }} size="small">
          <InputLabel id="period-select-label">Period</InputLabel>
          <Select
            labelId="period-select-label"
            value={period}
            label="Period"
            onChange={handlePeriodChange}
          >
            <MenuItem value="1M">1 Month</MenuItem>
            <MenuItem value="3M">3 Months</MenuItem>
            <MenuItem value="6M">6 Months</MenuItem>
            <MenuItem value="1Y">1 Year</MenuItem>
            <MenuItem value="2Y">2 Years</MenuItem>
            <MenuItem value="5Y">5 Years</MenuItem>
          </Select>
        </FormControl>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : stockData && stockData.data && stockData.data.length > 0 ? (
        <Box sx={{ height: 400, width: '100%' }}>
          <LineChart
            height={400}
            series={prepareChartData().series}
            xAxis={prepareChartData().xAxis}
            grid={{ vertical: true, horizontal: true }}
            slotProps={{
              legend: {
                position: { vertical: 'top', horizontal: 'end' }
              }
            }}
          />
        </Box>
      ) : (
        <Typography>No data available for this stock</Typography>
      )}
    </Box>
  );
}