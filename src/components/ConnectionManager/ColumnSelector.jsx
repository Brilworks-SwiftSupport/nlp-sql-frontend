import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Checkbox,
  TextField,
  InputAdornment,
  Paper,
  Chip,
  IconButton,
  Button,
  Tooltip,
  Card,
  CardContent,
  CardActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Divider
} from '@mui/material';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import SearchIcon from '@mui/icons-material/Search';
import StarIcon from '@mui/icons-material/Star';
import KeyIcon from '@mui/icons-material/Key';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SelectAllIcon from '@mui/icons-material/SelectAll';
import TableChartIcon from '@mui/icons-material/TableChart';
import StorageIcon from '@mui/icons-material/Storage';

const ColumnSelector = ({ 
  schema, 
  selectedTables, 
  selectedColumns, 
  onColumnSelectionChange, 
  importantColumns = [], 
  keyColumns = [] 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTable, setActiveTable] = useState(selectedTables[0] || '');
  
  // Update active table when selected tables change
  useEffect(() => {
    if (selectedTables.length > 0 && (!activeTable || !selectedTables.includes(activeTable))) {
      setActiveTable(selectedTables[0]);
    }
  }, [selectedTables, activeTable]);
  
  // Select or deselect all columns in a table
  const handleSelectAllColumns = (tableName) => {
    if (!schema || !tableName || !schema[tableName]) return;
    
    const tableColumns = schema[tableName]?.columns || [];
    const allColumnNames = tableColumns.map(column => column.name);
    
    const newSelectedColumns = { ...selectedColumns };
    
    if (!newSelectedColumns[tableName] || newSelectedColumns[tableName].length < allColumnNames.length) {
      // Select all columns
      newSelectedColumns[tableName] = allColumnNames;
    } else {
      // Deselect all columns
      newSelectedColumns[tableName] = [];
    }
    
    onColumnSelectionChange(newSelectedColumns);
  };
  
  // Toggle a single column selection
  const handleToggleColumn = (tableName, columnName) => {
    if (!schema || !tableName || !schema[tableName]) return;
    
    const newSelectedColumns = { ...selectedColumns };
    
    if (!newSelectedColumns[tableName]) {
      newSelectedColumns[tableName] = [];
    }
    
    const currentIndex = newSelectedColumns[tableName].indexOf(columnName);
    
    if (currentIndex === -1) {
      newSelectedColumns[tableName].push(columnName);
    } else {
      newSelectedColumns[tableName].splice(currentIndex, 1);
    }
    
    onColumnSelectionChange(newSelectedColumns);
  };
  
  // Handle search field change
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };
  
  // Check if a column is selected
  const isColumnSelected = (tableName, columnName) => {
    return selectedColumns[tableName] && selectedColumns[tableName].includes(columnName);
  };
  
  // Filter columns based on search term
  const filterColumns = (columns) => {
    if (!searchTerm) return columns;
    return columns.filter(column => 
      column.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };
  
  // Check if a column is an important one for ad spend or keys
  const isImportantColumn = (columnName) => {
    return importantColumns.includes(columnName) || keyColumns.includes(columnName);
  };
  
  // Calculate how many columns are selected for a table
  const getSelectedColumnCount = (tableName) => {
    if (!selectedColumns[tableName]) return 0;
    return selectedColumns[tableName].length;
  };
  
  // Check if all columns are selected for a table
  const areAllColumnsSelected = (tableName) => {
    if (!schema || !tableName || !schema[tableName]) return false;
    const tableColumns = schema[tableName]?.columns || [];
    if (tableColumns.length === 0) return false;
    return getSelectedColumnCount(tableName) === tableColumns.length;
  };
  
  // Handle table tab change
  const handleTableChange = (event, newValue) => {
    setActiveTable(newValue);
  };

  // Add ad spend columns to the important columns list
  const AD_SPEND_COLUMNS = [
    'ClientID', 
    'ClientCompanyID', 
    'Date', 
    'DateCreated', 
    'DateModified',
    'AdSpendMeta',
    'AdSpendGoogle',
    'AdSpendYouTube', 
    'AdSpendTiktok',
    'TotalAdSpend'
  ];

  // Check if a column is an important ad spend column
  const isAdSpendColumn = (columnName) => {
    return AD_SPEND_COLUMNS.includes(columnName);
  };

  // Add "Select Ad Spend Columns" button to quickly select all ad spend columns
  const selectAdSpendColumns = () => {
    const newSelectedColumns = { ...selectedColumns };
    
    // For each selected table, add ad spend columns to the selection
    selectedTables.forEach(tableName => {
      if (!schema[tableName]) return;
      
      const tableColumns = schema[tableName].columns || [];
      
      // Get all ad spend columns in this table
      const adSpendColumnsInTable = tableColumns
        .filter(column => isAdSpendColumn(column.name))
        .map(column => column.name);
      
      // Add to selected columns
      if (!newSelectedColumns[tableName]) {
        newSelectedColumns[tableName] = [];
      }
      
      // Add each ad spend column to the selection if not already selected
      adSpendColumnsInTable.forEach(columnName => {
        if (!newSelectedColumns[tableName].includes(columnName)) {
          newSelectedColumns[tableName].push(columnName);
        }
      });
    });
    
    onColumnSelectionChange(newSelectedColumns);
  };

  return (
    <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flex: '1 0 auto', pb: 0 }}>
        <Typography variant="h6" gutterBottom display="flex" alignItems="center">
          <ViewColumnIcon sx={{ mr: 1 }} />
          Select Columns
        </Typography>
        
        {selectedTables.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">
              Please select tables first to view columns.
            </Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              <Tabs 
                value={activeTable} 
                onChange={handleTableChange}
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
              >
                {selectedTables.map(table => (
                  <Tab 
                    key={table} 
                    value={table} 
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <TableChartIcon fontSize="small" sx={{ mr: 0.5 }} />
                        {table}
                        <Chip 
                          size="small" 
                          label={getSelectedColumnCount(table)}
                          color={areAllColumnsSelected(table) ? "success" : "primary"}
                          sx={{ ml: 1, height: 20 }}
                        />
                      </Box>
                    } 
                  />
                ))}
              </Tabs>
            </Box>
            
            {activeTable && (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <TextField
                    placeholder="Search columns..."
                    size="small"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    sx={{ width: '60%' }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                  
                  <Button
                    size="small"
                    startIcon={<SelectAllIcon />}
                    onClick={() => handleSelectAllColumns(activeTable)}
                    variant="outlined"
                    sx={{ mr: 1 }}
                  >
                    {areAllColumnsSelected(activeTable) ? 'Deselect All' : 'Select All'}
                  </Button>
                  
                  <Button
                    size="small"
                    startIcon={<StarIcon />}
                    onClick={selectAdSpendColumns}
                    variant="outlined"
                  >
                    Select Ad Spend Columns
                  </Button>
                </Box>
                
                <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox">Select</TableCell>
                        <TableCell>Column Name</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell align="center">Key</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {schema && schema[activeTable] && schema[activeTable].columns && filterColumns(schema[activeTable].columns).map((column) => {
                        const isSelected = isColumnSelected(activeTable, column.name);
                        const isPrimaryKey = column.is_primary_key;
                        const isImportant = isImportantColumn(column.name) || isAdSpendColumn(column.name);
                        
                        return (
                          <TableRow 
                            key={column.name}
                            hover
                            onClick={() => handleToggleColumn(activeTable, column.name)}
                            sx={{
                              backgroundColor: isImportant ? 'rgba(255, 193, 7, 0.08)' : 'inherit',
                              cursor: 'pointer'
                            }}
                          >
                            <TableCell padding="checkbox">
                              <Checkbox
                                checked={isSelected}
                                onChange={() => handleToggleColumn(activeTable, column.name)}
                              />
                            </TableCell>
                            <TableCell 
                              component="th" 
                              scope="row"
                              sx={{ 
                                fontWeight: isPrimaryKey || isSelected ? 'bold' : 'normal',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                            >
                              {column.name}
                              {isImportant && (
                                <Tooltip title="Important column for reporting" arrow>
                                  <StarIcon 
                                    fontSize="small" 
                                    color="warning" 
                                    sx={{ ml: 1 }} 
                                  />
                                </Tooltip>
                              )}
                            </TableCell>
                            <TableCell>{column.type}</TableCell>
                            <TableCell align="center">
                              {isPrimaryKey && (
                                <Tooltip title="Primary Key" arrow>
                                  <KeyIcon color="primary" />
                                </Tooltip>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      
                      {(!schema || !schema[activeTable] || !schema[activeTable].columns || filterColumns(schema[activeTable].columns).length === 0) && (
                        <TableRow>
                          <TableCell colSpan={4} align="center">
                            <Typography variant="body2" color="textSecondary">
                              No columns found matching your search
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </>
        )}
      </CardContent>
      <Divider />
      <CardContent sx={{ pt: 1 }}>
        <Typography variant="body2" color="textSecondary">
          Selected Columns Summary:
        </Typography>
        <Box sx={{ mt: 1, maxHeight: 100, overflow: 'auto' }}>
          {selectedTables.map(table => {
            const count = getSelectedColumnCount(table);
            const totalCount = schema && schema[table] && schema[table].columns ? schema[table].columns.length : 0;
            
            return count > 0 ? (
              <Chip
                key={table}
                label={`${table}: ${count}/${totalCount}`}
                size="small"
                color={count === totalCount ? "success" : "primary"}
                icon={<TableChartIcon />}
                sx={{ m: 0.5 }}
              />
            ) : null;
          })}
        </Box>
      </CardContent>
    </Card>
  );
};

export default ColumnSelector;
