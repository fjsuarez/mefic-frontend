import { useState, useEffect } from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

interface Stock {
  symbol: string;
  allocation: number;
  purchase_price?: number;
  purchase_date?: string;
}

interface AddStockDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (stock: Stock) => void;
}

export default function AddStockDialog({ open, onClose, onAdd }: AddStockDialogProps) {
  const [availableStocks, setAvailableStocks] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [allocation, setAllocation] = useState<number>(0);
  const [purchasePrice, setPurchasePrice] = useState<number | ''>('');
  const [purchaseDate, setPurchaseDate] = useState<Date | null>(null);
  
  useEffect(() => {
    const fetchAvailableStocks = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:8000/stocks/available');
        
        if (!response.ok) {
          throw new Error('Failed to fetch available stocks');
        }
        
        const data = await response.json();
        setAvailableStocks(data);
      } catch (error) {
        console.error('Error fetching stocks:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (open) {
      fetchAvailableStocks();
    }
  }, [open]);
  
  const handleClose = () => {
    // Reset form
    setSelectedSymbol('');
    setAllocation(0);
    setPurchasePrice('');
    setPurchaseDate(null);
    onClose();
  };
  
  const handleSubmit = () => {
    if (!selectedSymbol || allocation <= 0) return;
    
    const newStock: Stock = {
      symbol: selectedSymbol,
      allocation: allocation
    };
    
    if (purchasePrice !== '') {
      newStock.purchase_price = Number(purchasePrice);
    }
    
    if (purchaseDate) {
      newStock.purchase_date = purchaseDate.toISOString().split('T')[0];
    }
    
    onAdd(newStock);
    handleClose();
  };
  
  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Stock to Portfolio</DialogTitle>
      <DialogContent>
        {loading ? (
          <CircularProgress />
        ) : (
          <>
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel id="stock-symbol-label">Stock Symbol</InputLabel>
              <Select
                labelId="stock-symbol-label"
                value={selectedSymbol}
                label="Stock Symbol"
                onChange={(e) => setSelectedSymbol(e.target.value as string)}
              >
                {Object.entries(availableStocks).map(([symbol, name]) => (
                  <MenuItem key={symbol} value={symbol}>
                    {name} ({symbol})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              margin="dense"
              label="Allocation (%)"
              type="number"
              fullWidth
              value={allocation}
              onChange={(e) => setAllocation(Number(e.target.value))}
              sx={{ mt: 2 }}
              inputProps={{ min: 0, max: 100 }}
            />
            
            <TextField
              margin="dense"
              label="Purchase Price"
              type="number"
              fullWidth
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value === '' ? '' : Number(e.target.value))}
              sx={{ mt: 2 }}
              inputProps={{ min: 0, step: 0.01 }}
            />
            
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Purchase Date"
                value={purchaseDate}
                onChange={(newValue) => setPurchaseDate(newValue)}
                slotProps={{ textField: { margin: 'dense', fullWidth: true, sx: { mt: 2 } } }}
              />
            </LocalizationProvider>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={!selectedSymbol || allocation <= 0}>
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );
}