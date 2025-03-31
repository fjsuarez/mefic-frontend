import * as React from 'react';
import { useState, useEffect } from 'react';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import UserPortfolioList from '../components/UserPortfolioList';
import PortfolioPerformance from '../components/PortfolioPerformance';
import StockChart from '../components/StockChart';
import { firebaseAuth } from '../firebase/firebaseConfig';

interface Stock {
  symbol: string;
  allocation: number;
  purchase_price?: number;
  purchase_date?: string;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [portfolioStocks, setPortfolioStocks] = useState<Stock[]>([]);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserPortfolio = async () => {
      try {
        setLoading(true);
        const user = firebaseAuth.currentUser;
        const token = await user?.getIdToken();
        
        if (!token) {
          setError("You must be logged in to view portfolio");
          setLoading(false);
          return;
        }
        
        const response = await fetch('http://localhost:8000/user-portfolio/', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch portfolio');
        }
        
        const data = await response.json();
        setPortfolioStocks(data.stocks || []);
        
        // Set the first stock as selected by default if available
        if (data.stocks && data.stocks.length > 0) {
          setSelectedStock(data.stocks[0]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserPortfolio();
  }, []);
  
  const handleStockSelect = (stock: Stock) => {
    setSelectedStock(stock);
  };
  
  if (loading) {
    return (
      <Grid container justifyContent="center" alignItems="center" style={{ height: '50vh' }}>
        <CircularProgress />
      </Grid>
    );
  }
  
  if (error) {
    return (
      <Typography color="error" variant="h6">
        {error}
      </Typography>
    );
  }
  
  return (
    <Grid container spacing={3}>
      {/* Portfolio List */}
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 2, height: '100%' }}>
          <Typography variant="h6" gutterBottom>
            Your Portfolio
          </Typography>
          <UserPortfolioList 
            stocks={portfolioStocks} 
            onSelectStock={handleStockSelect}
            selectedStock={selectedStock}
          />
        </Paper>
      </Grid>
      
      {/* Performance Metrics */}
      <Grid item xs={12} md={8}>
        <Paper sx={{ p: 2, height: '100%' }}>
          <Typography variant="h6" gutterBottom>
            Performance Metrics
          </Typography>
          <PortfolioPerformance/>
        </Paper>
      </Grid>
      
      {/* Stock Chart */}
      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            {selectedStock ? `${selectedStock.symbol} Historical Data` : 'Select a stock to view chart'}
          </Typography>
          {selectedStock && (
            <StockChart 
              symbol={selectedStock.symbol}
            />
          )}
        </Paper>
      </Grid>
    </Grid>
  );
}