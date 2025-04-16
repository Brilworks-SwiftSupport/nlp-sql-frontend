import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemText, 
  Checkbox, 
  Chip, 
  Paper, 
  TextField,
  InputAdornment,
  IconButton
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import InfoIcon from '@mui/icons-material/Info';
import Tooltip from '@mui/material/Tooltip';

const TableSelector = ({ tables, selectedTables, setSelectedTables }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const handleToggle = (tableName) => () => {
    const currentIndex = selectedTables.indexOf(tableName);
    const newSelectedTables = [...selectedTables];

    if (currentIndex === -1) {
      newSelectedTables.push(tableName);
    } else {
      newSelectedTables.splice(currentIndex, 1);
    }

    setSelectedTables(newSelectedTables);
  };

  const filteredTables = tables.filter(table => 
    table.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (table.description && table.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Select Tables
        <Tooltip title="Select the tables you want to include in your query.">
          <IconButton size="small">
            <InfoIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Typography>
      
      <TextField
        fullWidth
        margin="normal"
        variant="outlined"
        placeholder="Search tables..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2, mt: 2 }}>
        {selectedTables.map((table) => (
          <Chip 
            key={table}
            label={table}
            onDelete={handleToggle(table)}
          />
        ))}
      </Box>
      
      <Paper sx={{ maxHeight: 400, overflow: 'auto', mt: 2 }}>
        <List dense>
          {filteredTables.map((table) => {
            const labelId = `checkbox-list-label-${table.name}`;
            const isSelected = selectedTables.indexOf(table.name) !== -1;

            return (
              <ListItem 
                key={table.name} 
                disablePadding
              >
                <ListItemButton role={undefined} onClick={handleToggle(table.name)} dense>
                  <Checkbox
                    edge="start"
                    checked={isSelected}
                    tabIndex={-1}
                    disableRipple
                    inputProps={{ 'aria-labelledby': labelId }}
                  />
                  <ListItemText 
                    id={labelId} 
                    primary={table.name}
                    secondary={
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {table.description || 'No description'}
                        {table.preview_columns && table.preview_columns.length > 0 && (
                          <Box component="span" sx={{ ml: 1 }}>
                            | Columns: {table.preview_columns.join(', ')}
                          </Box>
                        )}
                      </Typography>
                    }
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Paper>
      
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="body2" color="text.secondary">
          {selectedTables.length} table(s) selected
        </Typography>
      </Box>
    </Box>
  );
};

export default TableSelector;
