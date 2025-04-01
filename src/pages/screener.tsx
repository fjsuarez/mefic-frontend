import * as React from 'react';
import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Slider from '@mui/material/Slider';
import TextField from '@mui/material/TextField';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import { buildApiUrl } from '../config/api';
import TableSortLabel from '@mui/material/TableSortLabel';

interface Stock {
  symbol: string;
  company: string;
  pe_ratio?: number;
  roe?: number;
  roa?: number;
  dividend_yield?: number;
  weighted_score?: number;
}

interface Weights {
  pe_ratio: number;
  roe: number;
  roa: number;
  dividend_yield: number;
}

type Order = 'asc' | 'desc';
type SortableColumn = 'symbol' | 'company' | 'pe_ratio' | 'roe' | 'roa' | 'dividend_yield' | 'weighted_score';

export default function ScreenerPage() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Weights with default values
  const [weights, setWeights] = useState<Weights>({
    pe_ratio: 0.25,
    roe: 0.25,
    roa: 0.25,
    dividend_yield: 0.25
  });
  
  // Track if weights are valid (sum to 1.0)
  const [weightsValid, setWeightsValid] = useState(true);
  
  // Add these state variables
  const [order, setOrder] = useState<Order>('desc');
  const [orderBy, setOrderBy] = useState<SortableColumn>('weighted_score');
  
  // Fetch screener data
  const fetchScreenerData = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(buildApiUrl('/screener/'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(weights)
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch screener data');
      }
      
      const data = await response.json();
      setStocks(data.stocks);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  // Initial data fetch
  useEffect(() => {
    fetchScreenerData();
  }, []);
  
  // Validate weights whenever they change
  useEffect(() => {
    const sum = Object.values(weights).reduce((a, b) => a + b, 0);
    setWeightsValid(Math.abs(sum - 1.0) < 0.01); // Allow small rounding errors
  }, [weights]);
  
  // Handle weight changes
  const handleWeightChange = (metric: keyof Weights, value: number) => {
    setWeights(prev => {
      const newWeights = { ...prev, [metric]: value };
      
      // Optionally normalize other weights automatically
      const sum = Object.values(newWeights).reduce((a, b) => a + b, 0);
      
      if (sum > 0) {
        // You could auto-normalize here, but for user control
        // we'll just validate and let them adjust manually
        return newWeights;
      }
      
      return newWeights;
    });
  };
  
  // Apply weights and refetch data
  const applyWeights = () => {
    if (weightsValid) {
      fetchScreenerData();
    }
  };
  
  // Auto-normalize all weights to sum to 1.0
  const normalizeWeights = () => {
    const sum = Object.values(weights).reduce((a, b) => a + b, 0);
    if (sum > 0) {
      const normalized: Weights = {
        pe_ratio: weights.pe_ratio / sum,
        roe: weights.roe / sum,
        roa: weights.roa / sum,
        dividend_yield: weights.dividend_yield / sum
      };
      setWeights(normalized);
    }
  };
  
  // Reset to default equal weights
  const resetWeights = () => {
    setWeights({
      pe_ratio: 0.25,
      roe: 0.25,
      roa: 0.25,
      dividend_yield: 0.25
    });
  };
  
  // Pagination handlers
  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Format values for display
  const formatValue = (value: number | undefined, precision: number = 2) => {
    if (value === undefined || value === null) return 'N/A';
    return value.toFixed(precision);
  };
  
  // Add this function to handle sorting
  const handleRequestSort = (property: SortableColumn) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };
  
  // Add this sorting function
  const sortData = (data: Stock[], sortBy: SortableColumn, sortOrder: Order) => {
    return [...data].sort((a, b) => {
      // Handle undefined values
      const valueA = a[sortBy] ?? -Infinity;
      const valueB = b[sortBy] ?? -Infinity;
      
      // For string columns
      if (sortBy === 'symbol' || sortBy === 'company') {
        return sortOrder === 'asc'
          ? String(valueA).localeCompare(String(valueB))
          : String(valueB).localeCompare(String(valueA));
      }
      
      // For number columns
      return sortOrder === 'asc' ? Number(valueA) - Number(valueB) : Number(valueB) - Number(valueA);
    });
  };
  
  return (
    <Box>
      {/* Weights Configuration */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Configure Metric Weights
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Typography id="pe-ratio-slider">P/E Ratio: {(weights.pe_ratio * 100).toFixed(0)}%</Typography>
            <Slider
              aria-labelledby="pe-ratio-slider"
              value={weights.pe_ratio}
              onChange={(_, value) => handleWeightChange('pe_ratio', value as number)}
              min={0}
              max={1}
              step={0.05}
              marks
              valueLabelDisplay="auto"
              valueLabelFormat={(x) => `${(x * 100).toFixed(0)}%`}
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Typography id="roe-slider">Return on Equity: {(weights.roe * 100).toFixed(0)}%</Typography>
            <Slider
              aria-labelledby="roe-slider"
              value={weights.roe}
              onChange={(_, value) => handleWeightChange('roe', value as number)}
              min={0}
              max={1}
              step={0.05}
              marks
              valueLabelDisplay="auto"
              valueLabelFormat={(x) => `${(x * 100).toFixed(0)}%`}
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Typography id="roa-slider">Return on Assets: {(weights.roa * 100).toFixed(0)}%</Typography>
            <Slider
              aria-labelledby="roa-slider"
              value={weights.roa}
              onChange={(_, value) => handleWeightChange('roa', value as number)}
              min={0}
              max={1}
              step={0.05}
              marks
              valueLabelDisplay="auto"
              valueLabelFormat={(x) => `${(x * 100).toFixed(0)}%`}
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Typography id="dividend-slider">Dividend Yield: {(weights.dividend_yield * 100).toFixed(0)}%</Typography>
            <Slider
              aria-labelledby="dividend-slider"
              value={weights.dividend_yield}
              onChange={(_, value) => handleWeightChange('dividend_yield', value as number)}
              min={0}
              max={1}
              step={0.05}
              marks
              valueLabelDisplay="auto"
              valueLabelFormat={(x) => `${(x * 100).toFixed(0)}%`}
            />
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2">
            Sum: {Object.values(weights).reduce((a, b) => a + b, 0).toFixed(2)}
            {!weightsValid && (
              <span style={{ color: 'red' }}> (should be 1.0)</span>
            )}
          </Typography>
          
          <Button onClick={normalizeWeights} variant="outlined" size="small">
            Normalize
          </Button>
          
          <Button onClick={resetWeights} variant="outlined" size="small">
            Reset
          </Button>
          
          <Button 
            onClick={applyWeights} 
            variant="contained" 
            disabled={!weightsValid}
          >
            Apply Weights
          </Button>
        </Box>
      </Paper>
      
      {/* Stocks Table */}
      <Paper>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <>
            <TableContainer>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'symbol'}
                        direction={orderBy === 'symbol' ? order : 'asc'}
                        onClick={() => handleRequestSort('symbol')}
                      >
                        Symbol
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'company'}
                        direction={orderBy === 'company' ? order : 'asc'}
                        onClick={() => handleRequestSort('company')}
                      >
                        Company
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="right">
                      <TableSortLabel
                        active={orderBy === 'pe_ratio'}
                        direction={orderBy === 'pe_ratio' ? order : 'asc'}
                        onClick={() => handleRequestSort('pe_ratio')}
                      >
                        P/E Ratio
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="right">
                      <TableSortLabel
                        active={orderBy === 'roe'}
                        direction={orderBy === 'roe' ? order : 'asc'}
                        onClick={() => handleRequestSort('roe')}
                      >
                        ROE (%)
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="right">
                      <TableSortLabel
                        active={orderBy === 'roa'}
                        direction={orderBy === 'roa' ? order : 'asc'}
                        onClick={() => handleRequestSort('roa')}
                      >
                        ROA (%)
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="right">
                      <TableSortLabel
                        active={orderBy === 'dividend_yield'}
                        direction={orderBy === 'dividend_yield' ? order : 'asc'}
                        onClick={() => handleRequestSort('dividend_yield')}
                      >
                        Dividend Yield (%)
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="right">
                      <TableSortLabel
                        active={orderBy === 'weighted_score'}
                        direction={orderBy === 'weighted_score' ? order : 'asc'}
                        onClick={() => handleRequestSort('weighted_score')}
                      >
                        Score
                      </TableSortLabel>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortData(stocks, orderBy, order)
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((stock) => (
                      <TableRow key={stock.symbol}>
                        <TableCell>{stock.symbol}</TableCell>
                        <TableCell>{stock.company}</TableCell>
                        <TableCell align="right">{formatValue(stock.pe_ratio)}</TableCell>
                        <TableCell align="right">{formatValue(stock.roe)}</TableCell>
                        <TableCell align="right">{formatValue(stock.roa)}</TableCell>
                        <TableCell align="right">{formatValue(stock.dividend_yield)}</TableCell>
                        <TableCell align="right">{formatValue(stock.weighted_score, 1)}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[10, 25, 50]}
              component="div"
              count={stocks.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </Paper>
    </Box>
  );
} 