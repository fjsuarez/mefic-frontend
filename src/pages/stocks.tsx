import * as React from 'react';
import { useState, useEffect } from 'react';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import StockChart from '../components/StockChart';
import { firebaseAuth } from '../firebase/firebaseConfig';
import { buildApiUrl } from '../config/api'; 

// Create interfaces for the data
interface StockFinancials {
  symbol: string;
  company_name: string;
  pe_ratio?: number;
  roe?: number;
  roa?: number;
  dividend_score?: number;
  dividend_yield?: number;
  payout_ratio?: number;
}

interface TechnicalIndicators {
  symbol: string;
  sma_20?: number;
  sma_50?: number;
  sma_200?: number;
  ema_20?: number;
  rsi_14?: number;
  macd?: number;
  macd_signal?: number;
  bollinger_upper?: number;
  bollinger_lower?: number;
}

interface RiskMetrics {
  symbol: string;
  beta: number;
  volatility: number;
  sharpe_ratio: number;
  max_drawdown: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// Tab panel component
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`metrics-tabpanel-${index}`}
      aria-labelledby={`metrics-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function StocksPage() {
  const [stocks, setStocks] = useState<Record<string, string>>({});
  const [selectedStock, setSelectedStock] = useState<string>('');
  const [financials, setFinancials] = useState<StockFinancials | null>(null);
  const [technicals, setTechnicals] = useState<TechnicalIndicators | null>(null);
  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    // Fetch available stocks
    const fetchAvailableStocks = async () => {
      try {
        const response = await fetch(buildApiUrl('/stocks/available'));
        if (!response.ok) {
          throw new Error('Failed to fetch available stocks');
        }
        const data = await response.json();
        setStocks(data);
        
        // Set first stock as default if available
        const symbols = Object.keys(data);
        if (symbols.length > 0) {
          setSelectedStock(symbols[0]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAvailableStocks();
  }, []);

  useEffect(() => {
    // Fetch data for selected stock
    const fetchStockData = async () => {
      if (!selectedStock) return;
      
      setLoading(true);
      
      try {
        // Fetch financial metrics
        const financialsResponse = await fetch(buildApiUrl(`/financial/metrics/${selectedStock}`));
        if (!financialsResponse.ok) {
          throw new Error('Failed to fetch financial metrics');
        }
        const financialsData = await financialsResponse.json();
        setFinancials(financialsData);
        
        // Fetch technical indicators
        const technicalsResponse = await fetch(buildApiUrl(`/technical/indicators/${selectedStock}`));
        if (!technicalsResponse.ok) {
          throw new Error('Failed to fetch technical indicators');
        }
        const technicalsData = await technicalsResponse.json();
        setTechnicals(technicalsData);
        
        // Fetch risk metrics
        const riskResponse = await fetch(buildApiUrl(`/risk/metrics/${selectedStock}`));
        if (!riskResponse.ok) {
          throw new Error('Failed to fetch risk metrics');
        }
        const riskData = await riskResponse.json();
        setRiskMetrics(riskData);
        
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchStockData();
  }, [selectedStock]);

  const handleStockChange = (event: SelectChangeEvent) => {
    setSelectedStock(event.target.value);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Format metrics for display
  const formatValue = (value: number | undefined, suffix: string = '') => {
    if (value === undefined || value === null) return 'N/A';
    return `${value.toFixed(2)}${suffix}`;
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <FormControl fullWidth>
          <InputLabel id="stock-select-label">Stock</InputLabel>
          <Select
            labelId="stock-select-label"
            value={selectedStock}
            label="Stock"
            onChange={handleStockChange}
            disabled={loading}
          >
            {Object.entries(stocks).map(([symbol, name]) => (
              <MenuItem key={symbol} value={symbol}>
                {name} ({symbol})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      
      {loading ? (
        <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Grid>
      ) : error ? (
        <Grid item xs={12}>
          <Typography color="error">{error}</Typography>
        </Grid>
      ) : (
        <>
          {/* Stock Chart */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              {selectedStock && <StockChart symbol={selectedStock} />}
            </Paper>
          </Grid>
          
          {/* Metrics Tabs */}
          <Grid item xs={12}>
            <Paper sx={{ width: '100%' }}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabValue} onChange={handleTabChange} aria-label="stock metrics tabs">
                  <Tab label="Financial Metrics" id="metrics-tab-0" />
                  <Tab label="Technical Indicators" id="metrics-tab-1" />
                  <Tab label="Risk Metrics" id="metrics-tab-2" />
                </Tabs>
              </Box>
              
              {/* Financial Metrics Tab */}
              <TabPanel value={tabValue} index={0}>
                {financials && (
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle1">P/E Ratio</Typography>
                        <Typography variant="h6">{formatValue(financials.pe_ratio)}</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle1">Return on Equity</Typography>
                        <Typography variant="h6">{formatValue(financials.roe, '%')}</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle1">Return on Assets</Typography>
                        <Typography variant="h6">{formatValue(financials.roa, '%')}</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle1">Dividend Score</Typography>
                        <Typography variant="h6">{formatValue(financials.dividend_score)}</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle1">Dividend Yield</Typography>
                        <Typography variant="h6">{formatValue(financials.dividend_yield, '%')}</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle1">Payout Ratio</Typography>
                        <Typography variant="h6">{formatValue(financials.payout_ratio, '%')}</Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                )}
              </TabPanel>
              
              {/* Technical Indicators Tab */}
              <TabPanel value={tabValue} index={1}>
                {technicals && (
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle1">SMA (20)</Typography>
                        <Typography variant="h6">{formatValue(technicals.sma_20)}</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle1">SMA (50)</Typography>
                        <Typography variant="h6">{formatValue(technicals.sma_50)}</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle1">SMA (200)</Typography>
                        <Typography variant="h6">{formatValue(technicals.sma_200)}</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle1">RSI (14)</Typography>
                        <Typography variant="h6">{formatValue(technicals.rsi_14)}</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle1">MACD</Typography>
                        <Typography variant="h6">{formatValue(technicals.macd)}</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle1">MACD Signal</Typography>
                        <Typography variant="h6">{formatValue(technicals.macd_signal)}</Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                )}
              </TabPanel>
              
              {/* Risk Metrics Tab */}
              <TabPanel value={tabValue} index={2}>
                {riskMetrics && (
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={3}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle1">Beta</Typography>
                        <Typography variant="h6">{formatValue(riskMetrics.beta)}</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle1">Volatility</Typography>
                        <Typography variant="h6">{formatValue(riskMetrics.volatility * 100, '%')}</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle1">Sharpe Ratio</Typography>
                        <Typography variant="h6">{formatValue(riskMetrics.sharpe_ratio)}</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle1">Max Drawdown</Typography>
                        <Typography variant="h6">{formatValue(riskMetrics.max_drawdown * 100, '%')}</Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                )}
              </TabPanel>
            </Paper>
          </Grid>
        </>
      )}
    </Grid>
  );
}