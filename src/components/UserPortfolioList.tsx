import * as React from 'react';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';

interface Stock {
  symbol: string;
  allocation: number;
  purchase_price?: number;
  purchase_date?: string;
}

interface UserPortfolioListProps {
  stocks: Stock[];
  selectedStock: Stock | null;
  onSelectStock: (stock: Stock) => void;
}

export default function UserPortfolioList({ 
  stocks, 
  selectedStock, 
  onSelectStock 
}: UserPortfolioListProps) {
  if (stocks.length === 0) {
    return (
      <Typography variant="body1">
        No stocks in your portfolio. Start by adding some!
      </Typography>
    );
  }

  return (
    <List>
      {stocks.map((stock) => (
        <ListItem key={stock.symbol} disablePadding>
          <ListItemButton 
            selected={selectedStock?.symbol === stock.symbol}
            onClick={() => onSelectStock(stock)}
          >
            <ListItemText 
              primary={stock.symbol} 
              secondary={`Allocation: ${stock.allocation}%`} 
            />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );
}