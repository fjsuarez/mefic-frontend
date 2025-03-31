import * as React from 'react';
import { useState, useEffect } from 'react';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { firebaseAuth } from '../firebase/firebaseConfig';
import { buildApiUrl } from '../config/api';
interface PerformanceData {
  total_value: number;
  daily_change: number;
  total_return: number;
  risk_level: string;
  sector_allocation: Record<string, number>;
}

export default function PortfolioPerformance() {

  const [loading, setLoading] = useState(false);
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPerformanceData = async () => {
      
      try {
        setLoading(true);
        const user = firebaseAuth.currentUser;
        const token = await user?.getIdToken();
        
        if (!token) {
          setError("Authentication required");
          return;
        }
        
        const response = await fetch(buildApiUrl('/user-portfolio/performance'), {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch performance data');
        }
        
        const data = await response.json();
        setPerformanceData(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPerformanceData();
  }, []);
  
  if (loading) {
    return <CircularProgress />;
  }
  
  if (error) {
    return <Typography color="error">{error}</Typography>;
  }
  
  if (!performanceData) {
    return <Typography>No performance data available</Typography>;
  }
  
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary">
              Total Value
            </Typography>
            <Typography variant="h5" component="div">
              ${performanceData.total_value.toLocaleString()}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary">
              Daily Change
            </Typography>
            <Typography 
              variant="h5" 
              component="div" 
              color={performanceData.daily_change >= 0 ? 'success.main' : 'error.main'}
              sx={{ display: 'flex', alignItems: 'center' }}
            >
              {performanceData.daily_change >= 0 ? 
                <TrendingUpIcon sx={{ mr: 0.5 }} /> : 
                <TrendingDownIcon sx={{ mr: 0.5 }} />
              }
              {performanceData.daily_change.toFixed(2)}%
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary">
              Total Return
            </Typography>
            <Typography 
              variant="h5" 
              component="div"
              color={performanceData.total_return >= 0 ? 'success.main' : 'error.main'}
            >
              {performanceData.total_return.toFixed(2)}%
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary">
              Risk Level
            </Typography>
            <Typography variant="h5" component="div">
              {performanceData.risk_level}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          Sector Allocation
        </Typography>
        <Grid container spacing={1}>
          {Object.entries(performanceData.sector_allocation).map(([sector, percentage]) => (
            <Grid item xs={12} key={sector}>
              <Typography variant="body2">
                {sector}: {percentage}%
              </Typography>
              <div
                style={{
                  height: '8px',
                  width: `${percentage}%`,
                  backgroundColor: '#1976d2',
                  borderRadius: '4px',
                  marginTop: '4px'
                }}
              />
            </Grid>
          ))}
        </Grid>
      </Grid>
    </Grid>
  );
}