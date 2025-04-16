import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  IconButton,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import { getAuthToken } from '../../utils/auth';

const FilterBuilder = ({ connectionId, selectedTables, filters, setFilters }) => {
  const [availableColumns, setAvailableColumns] = useState({});
  const [loading, setLoading] = useState(false);
  const [newFilter, setNewFilter] = useState({
    table: '',
    column: '',
    operator: '=',
    value: ''
  });

  // Fetch columns for all selected tables
  useEffect(() => {
    const fetchColumnsForAllTables = async () => {
      setLoading(true);
      const columnsData = {};
      
      for (const table of selectedTables) {
        try {
          const response = await axios.get(
            `/api/query-builder/columns?connection_id=${connectionId}&table_name=${table}`,
            {
              headers: {
                'Authorization': `Bearer ${getAuthToken()}`
              }
            }
          );
          
          if (response.data.status === 'success') {
            columnsData[table] = response.data.columns;
          }
        } catch (error) {
          console.error(`Error fetching columns for ${table}:`, error);
        }
      }
      
      setAvailableColumns(columnsData);
      
      // Set default table if none selected
      if (selectedTables.length > 0 && !newFilter.table) {
        setNewFilter(prev => ({
          ...prev,
          table: selectedTables[0]
        }));
      }
      
      setLoading(false);
    };
    
    if (selectedTables.length > 0) {
      fetchColumnsForAllTables();
    }
  }, [selectedTables, connectionId]);

  // Update column options when table changes
  useEffect(() => {
    if (newFilter.table && availableColumns[newFilter.table]?.length > 0) {
      setNewFilter(prev => ({
        ...prev,
        column: ''
      }));
    }
  }, [newFilter.table]);

  const handleAddFilter = () => {
    if (newFilter.table && newFilter.column && newFilter.operator) {
      // Validate filter before adding
      if (newFilter.value.trim() === '' && newFilter.operator !== 'IS NULL' && newFilter.operator !== 'IS NOT NULL') {
        return; // Don't add filter with empty value
      }
      
      const filterToAdd = { ...newFilter };
      
      // Format value based on column type
      const columnInfo = availableColumns[newFilter.table].find(col => col.name === newFilter.column);
      if (columnInfo) {
        const type = columnInfo.type.toLowerCase();
        if (type.includes('int') || type.includes('float') || type.includes('decimal')) {
          filterToAdd.value = parseFloat(newFilter.value);
        }
      }
      
      setFilters([...filters, filterToAdd]);
      
      // Reset new filter form (except table)
      setNewFilter({
        table: newFilter.table,
        column: '',
        operator: '=',
        value: ''
      });
    }
  };

  const handleRemoveFilter = (index) => {
    const updatedFilters = [...filters];
    updatedFilters.splice(index, 1);
    setFilters(updatedFilters);
  };

  const getOperatorOptions = (columnName) => {
    if (!newFilter.table || !columnName) return [];
    
    const columnInfo = availableColumns[newFilter.table]?.find(col => col.name === columnName);
    if (!columnInfo) return [];
    
    const type = columnInfo.type.toLowerCase();
    
    if (type.includes('varchar') || type.includes('char') || type.includes('text')) {
      return [
        { value: '=', label: 'Equals (=)' },
        { value: '!=', label: 'Not Equal (!=)' },
        { value: 'LIKE', label: 'Contains (LIKE)' },
        { value: 'NOT LIKE', label: 'Does Not Contain (NOT LIKE)' },
        { value: 'IS NULL', label: 'Is Empty (NULL)' },
        { value: 'IS NOT NULL', label: 'Is Not Empty (NOT NULL)' }
      ];
    } else if (type.includes('int') || type.includes('float') || type.includes('decimal') || type.includes('numeric')) {
      return [
        { value: '=', label: 'Equals (=)' },
        { value: '!=', label: 'Not Equal (!=)' },
        { value: '>', label: 'Greater Than (>)' },
        { value: '>=', label: 'Greater Than or Equal (>=)' },
        { value: '<', label: 'Less Than (<)' },
        { value: '<=', label: 'Less Than or Equal (<=)' },
        { value: 'IS NULL', label: 'Is Empty (NULL)' },
        { value: 'IS NOT NULL', label: 'Is Not Empty (NOT NULL)' }
      ];
    } else if (type.includes('date') || type.includes('time')) {
      return [
        { value: '=', label: 'Equals (=)' },
        { value: '!=', label: 'Not Equal (!=)' },
        { value: '>', label: 'After (>)' },
        { value: '>=', label: 'On or After (>=)' },
        { value: '<', label: 'Before (<)' },
        { value: '<=', label: 'On or Before (<=)' },
        { value: 'IS NULL', label: 'Is Empty (NULL)' },
        { value: 'IS NOT NULL', label: 'Is Not Empty (NOT NULL)' }
      ];
    } else {
      return [
        { value: '=', label: 'Equals (=)' },
        { value: '!=', label: 'Not Equal (!=)' },
        { value: 'IS NULL', label: 'Is Empty (NULL)' },
        { value: 'IS NOT NULL', label: 'Is Not Empty (NOT NULL)' }
      ];
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Add Filters
        <Tooltip title="Filters allow you to limit the results of your query based on specific conditions. For example, you can filter to only see data for a specific date range or client.">
          <IconButton size="small">
            <InfoIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Typography>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="flex-end">
          <Grid item xs={2.5}>
            <FormControl fullWidth size="small">
              <InputLabel id="filter-table-label">Table</InputLabel>
              <Select
                labelId="filter-table-label"
                value={newFilter.table}
                label="Table"
                onChange={(e) => setNewFilter({...newFilter, table: e.target.value})}
              >
                {selectedTables.map((table) => (
                  <MenuItem key={table} value={table}>{table}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={2.5}>
            <FormControl fullWidth size="small">
              <InputLabel id="filter-column-label">Column</InputLabel>
              <Select
                labelId="filter-column-label"
                value={newFilter.column}
                label="Column"
                onChange={(e) => setNewFilter({...newFilter, column: e.target.value})}
                disabled={!newFilter.table}
              >
                {availableColumns[newFilter.table]?.map((column) => (
                  <MenuItem key={column.name} value={column.name}>
                    {column.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={2.5}>
            <FormControl fullWidth size="small">
              <InputLabel id="filter-operator-label">Operator</InputLabel>
              <Select
                labelId="filter-operator-label"
                value={newFilter.operator}
                label="Operator"
                onChange={(e) => setNewFilter({...newFilter, operator: e.target.value})}
                disabled={!newFilter.column}
              >
                {getOperatorOptions(newFilter.column).map((op) => (
                  <MenuItem key={op.value} value={op.value}>{op.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={3.5}>
            <TextField
              fullWidth
              size="small"
              label="Value"
              value={newFilter.value}
              onChange={(e) => setNewFilter({...newFilter, value: e.target.value})}
              disabled={
                !newFilter.column || 
                newFilter.operator === 'IS NULL' || 
                newFilter.operator === 'IS NOT NULL'
              }
              placeholder={
                newFilter.operator === 'LIKE' || newFilter.operator === 'NOT LIKE' 
                  ? "Use % as wildcard (e.g. %term%)" 
                  : "Enter value"
              }
            />
          </Grid>
          
          <Grid item xs={1}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleAddFilter}
              disabled={
                !newFilter.table || 
                !newFilter.column || 
                !newFilter.operator || 
                (newFilter.value.trim() === '' && 
                 newFilter.operator !== 'IS NULL' && 
                 newFilter.operator !== 'IS NOT NULL')
              }
              startIcon={<AddIcon />}
            >
              Add
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {filters.length > 0 ? (
        <Paper sx={{ maxHeight: 300, overflow: 'auto' }}>
          <List dense>
            {filters.map((filter, index) => (
              <ListItem key={index} divider={index < filters.length - 1}>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                      <Chip label={filter.table} color="primary" size="small" sx={{ mr: 1 }} />
                      <Typography variant="body2" component="span" sx={{ mr: 1, fontWeight: 'bold' }}>
                        {filter.column}
                      </Typography>
                      <Typography variant="body2" component="span" sx={{ mr: 1 }}>
                        {filter.operator}
                      </Typography>
                      {filter.operator !== 'IS NULL' && filter.operator !== 'IS NOT NULL' && (
                        <Chip 
                          label={filter.value} 
                          size="small" 
                          variant="outlined" 
                          color="default" 
                        />
                      )}
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton edge="end" onClick={() => handleRemoveFilter(index)} size="small">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Paper>
      ) : (
        <Typography variant="body2" color="text.secondary">
          No filters added yet. Filters are optional - you can continue without adding any.
        </Typography>
      )}
      
      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {filters.length} filter(s) applied
        </Typography>
      </Box>
    </Box>
  );
};

export default FilterBuilder;
