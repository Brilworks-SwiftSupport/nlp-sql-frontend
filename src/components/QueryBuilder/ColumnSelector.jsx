import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Box, 
  Typography, 
  Paper, 
  Tabs, 
  Tab, 
  List, 
  ListItem, 
  ListItemText, 
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Grid,
  IconButton,
  CircularProgress
} from '@mui/material';
import KeyIcon from '@mui/icons-material/Key';
import FunctionsIcon from '@mui/icons-material/Functions';
import InfoIcon from '@mui/icons-material/Info';
import Tooltip from '@mui/material/Tooltip';
import { getAuthToken } from '../../utils/auth';

const ColumnSelector = ({ 
  connectionId, 
  selectedTables, 
  selectedColumns, 
  setSelectedColumns,
  aggregations,
  setAggregations
}) => {
  const [currentTable, setCurrentTable] = useState('');
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Set the current table to the first selected table when component mounts
  useEffect(() => {
    if (selectedTables.length > 0 && !currentTable) {
      setCurrentTable(selectedTables[0]);
    }
  }, [selectedTables]);

  // Fetch columns for the current table
  useEffect(() => {
    if (currentTable) {
      fetchColumns(currentTable);
    }
  }, [currentTable, connectionId]);

  const fetchColumns = async (tableName) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `/api/query-builder/columns?connection_id=${connectionId}&table_name=${tableName}`,
        {
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`
          }
        }
      );
      
      if (response.data.status === 'success') {
        setColumns(response.data.columns);
      } else {
        setError(response.data.message || 'Failed to fetch columns');
      }
    } catch (err) {
      setError('Error fetching columns: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (event, newValue) => {
    setCurrentTable(newValue);
  };

  const handleColumnToggle = (columnName) => {
    const tableColumns = selectedColumns[currentTable] || [];
    let updatedColumns;
    
    if (tableColumns.includes(columnName)) {
      // Remove column
      updatedColumns = tableColumns.filter(col => col !== columnName);
      
      // Also remove any aggregation for this column
      if (aggregations[currentTable] && aggregations[currentTable][columnName]) {
        const newTableAggs = { ...aggregations[currentTable] };
        delete newTableAggs[columnName];
        
        setAggregations({
          ...aggregations,
          [currentTable]: Object.keys(newTableAggs).length > 0 ? newTableAggs : undefined
        });
      }
    } else {
      // Add column
      updatedColumns = [...tableColumns, columnName];
    }
    
    // Update selected columns
    if (updatedColumns.length > 0) {
      setSelectedColumns({
        ...selectedColumns,
        [currentTable]: updatedColumns
      });
    } else {
      // If no columns selected for this table, remove the table entry
      const newSelectedColumns = { ...selectedColumns };
      delete newSelectedColumns[currentTable];
      setSelectedColumns(newSelectedColumns);
    }
  };

  const handleAggregationChange = (columnName, newAggregation) => {
    if (currentTable) {
      const currentTableAggs = aggregations[currentTable] || {};
      
      if (newAggregation) {
        // Add or update aggregation
        const newTableAggs = {
          ...currentTableAggs,
          [columnName]: newAggregation
        };
        
        setAggregations({
          ...aggregations,
          [currentTable]: newTableAggs
        });
      } else {
        // If no aggregations for this table, remove the table entry
        const newAggregations = { ...aggregations };
        delete newAggregations[currentTable];
        setAggregations(newAggregations);
      }
    }
  };

  // Number of columns selected for current table
  const currentTableSelectedCount = selectedColumns[currentTable]?.length || 0;
  
  // Total columns selected across all tables
  const totalColumnsSelected = Object.values(selectedColumns)
    .reduce((total, cols) => total + cols.length, 0);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Select Columns
        <Tooltip title="Select columns from each table to include in your query. You can also apply aggregation functions like SUM, AVG, etc.">
          <IconButton size="small">
            <InfoIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Typography>
      
      {selectedTables.length > 0 ? (
        <>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs
              value={currentTable}
              onChange={handleTableChange}
              variant="scrollable"
              scrollButtons="auto"
            >
              {selectedTables.map((table) => (
                <Tab 
                  key={table} 
                  value={table} 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {table}
                      {selectedColumns[table]?.length > 0 && (
                        <Chip 
                          label={selectedColumns[table].length} 
                          size="small" 
                          color="primary" 
                          sx={{ ml: 1, height: 20 }} 
                        />
                      )}
                    </Box>
                  } 
                />
              ))}
            </Tabs>
          </Box>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Typography color="error">{error}</Typography>
          ) : (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Paper sx={{ maxHeight: 400, overflow: 'auto', p: 0 }}>
                  <List dense>
                    {columns.map((column) => {
                      const isSelected = selectedColumns[currentTable]?.includes(column.name) || false;
                      const hasAggregation = aggregations[currentTable]?.[column.name];

                      return (
                        <ListItem 
                          key={column.name} 
                          divider
                        >
                          <Grid container alignItems="center">
                            <Grid item xs={1}>
                              <Checkbox
                                edge="start"
                                checked={isSelected}
                                onChange={() => handleColumnToggle(column.name)}
                              />
                            </Grid>
                            <Grid item xs={4}>
                              <ListItemText
                                primary={
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    {column.name}
                                    {column.is_primary_key && <KeyIcon fontSize="small" sx={{ ml: 1, opacity: 0.7 }} />}
                                  </Box>
                                }
                                secondary={column.type}
                              />
                            </Grid>
                            <Grid item xs={5}>
                              <Typography variant="body2" color="text.secondary">
                                {column.description || 'No description'}
                              </Typography>
                            </Grid>
                            <Grid item xs={2}>
                              {isSelected && (
                                <FormControl size="small" fullWidth>
                                  <InputLabel id={`agg-select-${column.name}`}>
                                    <FunctionsIcon fontSize="small" />
                                  </InputLabel>
                                  <Select
                                    labelId={`agg-select-${column.name}`}
                                    value={hasAggregation || ''}
                                    label={<FunctionsIcon fontSize="small" />}
                                    onChange={(e) => handleAggregationChange(column.name, e.target.value)}
                                  >
                                    <MenuItem value="">None</MenuItem>
                                    <MenuItem value="SUM">SUM</MenuItem>
                                    <MenuItem value="AVG">AVG</MenuItem>
                                    <MenuItem value="MIN">MIN</MenuItem>
                                    <MenuItem value="MAX">MAX</MenuItem>
                                    <MenuItem value="COUNT">COUNT</MenuItem>
                                  </Select>
                                </FormControl>
                              )}
                            </Grid>
                          </Grid>
                        </ListItem>
                      );
                    })}
                  </List>
                </Paper>
              </Grid>
            </Grid>
          )}
          
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              {currentTableSelectedCount} column(s) selected for {currentTable}
            </Typography>
            <Typography variant="body2" color="primary">
              {totalColumnsSelected} total column(s) selected across all tables
            </Typography>
          </Box>
        </>
      ) : (
        <Typography>Please select at least one table first</Typography>
      )}
    </Box>
  );
};

export default ColumnSelector;
