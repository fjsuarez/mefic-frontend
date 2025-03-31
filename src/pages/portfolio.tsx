import * as React from 'react';
import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import AddStockDialog from '../components/AddStockDialog';
import { firebaseAuth } from '../firebase/firebaseConfig';

interface Stock {
  symbol: string;
  allocation: number;
  purchase_price?: number;
  purchase_date?: string;
}

export default function PortfolioManagementPage() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });
  
  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      const user = firebaseAuth.currentUser;
      const token = await user?.getIdToken();
      
      if (!token) {
        throw new Error("You must be logged in");
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
      setStocks(data.stocks || []);
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'An error occurred',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchPortfolio();
  }, []);
  
  const handleAddStock = async (newStock: Stock) => {
    try {
      const user = firebaseAuth.currentUser;
      const token = await user?.getIdToken();
      
      if (!token) {
        throw new Error("You must be logged in");
      }
      
      // Calculate new allocations to maintain 100% total
      const updatedStocks = [...stocks, newStock];
      
      const response = await fetch('http://localhost:8000/user-portfolio/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ stocks: updatedStocks })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update portfolio');
      }
      
      await fetchPortfolio();
      setSnackbar({
        open: true,
        message: 'Stock added successfully!',
        severity: 'success'
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'An error occurred',
        severity: 'error'
      });
    }
  };
  
  const handleDeleteStock = async (symbol: string) => {
    try {
      const user = firebaseAuth.currentUser;
      const token = await user?.getIdToken();
      
      if (!token) {
        throw new Error("You must be logged in");
      }
      
      const response = await fetch(`http://localhost:8000/user-portfolio/${symbol}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete stock');
      }
      
      await fetchPortfolio();
      setSnackbar({
        open: true,
        message: 'Stock removed successfully!',
        severity: 'success'
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'An error occurred',
        severity: 'error'
      });
    }
  };
  
  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
        <Button 
          variant="contained" 
          onClick={() => setDialogOpen(true)}
        >
          Add Stock
        </Button>
      </Box>
      
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Symbol</TableCell>
                <TableCell align="right">Allocation (%)</TableCell>
                <TableCell align="right">Purchase Price</TableCell>
                <TableCell align="right">Purchase Date</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">Loading...</TableCell>
                </TableRow>
              ) : stocks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">No stocks in portfolio</TableCell>
                </TableRow>
              ) : (
                stocks.map((stock) => (
                  <TableRow key={stock.symbol}>
                    <TableCell component="th" scope="row">
                      {stock.symbol}
                    </TableCell>
                    <TableCell align="right">{stock.allocation}%</TableCell>
                    <TableCell align="right">
                      {stock.purchase_price ? `$${stock.purchase_price.toFixed(2)}` : 'N/A'}
                    </TableCell>
                    <TableCell align="right">{stock.purchase_date || 'N/A'}</TableCell>
                    <TableCell align="right">
                      <IconButton onClick={() => handleDeleteStock(stock.symbol)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      
      {/* Add Stock Dialog */}
      <AddStockDialog 
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onAdd={handleAddStock}
      />
      
      {/* Notification Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({...snackbar, open: false})}
      >
        <Alert severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}