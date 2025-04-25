import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText,
  Checkbox,
  TextField,
  InputAdornment,
  Paper,
  Grid,
  Chip,
  Divider,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Tooltip,
  TreeView,
  TreeItem,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Collapse,
  Button
} from '@mui/material';
import TableViewIcon from '@mui/icons-material/TableView';
import SearchIcon from '@mui/icons-material/Search';
import InfoIcon from '@mui/icons-material/Info';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import StorageIcon from '@mui/icons-material/Storage';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import KeyIcon from '@mui/icons-material/Key';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';


const TableSelector = ({ schema, selectedTables, onTablesChange, schema_type }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTablesState, setSelectedTablesState] = useState(selectedTables || []);
  const [expandedTables, setExpandedTables] = useState({});
  
  // Update local state when props change
  useEffect(() => {
    if (selectedTables) {
      setSelectedTablesState(selectedTables);
    }
  }, [selectedTables]);
  
  // Toggle table selection
  const handleToggleTable = (tableName) => {
    let newSelectedTables;
    
    if (selectedTablesState.includes(tableName)) {
      newSelectedTables = selectedTablesState.filter(name => name !== tableName);
    } else {
      newSelectedTables = [...selectedTablesState, tableName];
    }
    
    setSelectedTablesState(newSelectedTables);
    
    // Call the parent component's handler
    if (onTablesChange) {
      onTablesChange(newSelectedTables);
    }
  };
  
  // Select all tables
  const handleSelectAll = () => {
    if (!schema) return;
    
    const allTables = Object.keys(schema);
    setSelectedTablesState(allTables);
    
    // Call the parent component's handler
    if (onTablesChange) {
      onTablesChange(allTables);
    }
  };
  
  // Deselect all tables
  const handleDeselectAll = () => {
    setSelectedTablesState([]);
    
    // Call the parent component's handler
    if (onTablesChange) {
      onTablesChange([]);
    }
  };
  
  // Toggle table expand/collapse
  const toggleTableExpand = (tableName) => {
    setExpandedTables(prev => ({
      ...prev,
      [tableName]: !prev[tableName]
    }));
  };
  
  // Filter tables by search term
  const filteredTables = schema ? 
    Object.keys(schema).filter(tableName => 
      tableName.toLowerCase().includes(searchTerm.toLowerCase())
    )
    : [];
    
  // Debug - log schema and filtered tables
  useEffect(() => {
    console.log('TableSelector received schema:', schema);
    console.log('TableSelector filtered tables:', filteredTables);
    console.log('TableSelector has schema keys:', schema ? Object.keys(schema).length : 0);
  }, [schema, filteredTables]);
  
  
  // Count columns in table
  const getColumnCount = (tableName) => {
    return schema[tableName]?.columns?.length || 0;
  };
  
  return (
    <div style={{ width: '100%' }}>
      <Card sx={{ 
        maxHeight: 400, 
        overflow: 'auto',
        width: '100% !important',
        '& .MuiTable-root': {
          width: '100% !important',
          tableLayout: 'auto',
        }


      }}>
        <CardContent>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            mb: 2, 
            width: '100%'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <StorageIcon sx={{ mr: 1 }} />
              <Typography variant="h6">Database Tables</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                variant="outlined" 
                size="small" 
                onClick={handleSelectAll}
              >
                Select All
              </Button>
              <Button 
                variant="outlined" 
                size="small" 
                onClick={handleDeselectAll}
              >
                Deselect All
              </Button>
            </Box>
          </Box>
          
          <TextField
            fullWidth
            placeholder="Search tables..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          
          <Box sx={{ mb: 2, width: '100%' }}>
            <Typography variant="body2" color="text.secondary">
              {selectedTablesState.length} of {filteredTables.length} tables selected
            </Typography>
          </Box>
          
          <Divider sx={{ mb: 2 }} />
          
          <TableContainer 
            component={Paper} 
            variant="outlined" 
            sx={{ 
              maxHeight: 400, 
              overflow: 'auto',
              width: '100%',
              '& .MuiTable-root': {
                minWidth: '100%'
              }
            }}
          >
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox" sx={{ width: '100%' }}>Select</TableCell>
                  <TableCell>Table Name</TableCell>
                  <TableCell align="right">Columns</TableCell>
                  <TableCell align="center">Details</TableCell>

                </TableRow>
              </TableHead>
              <TableBody sx={{ width: '100%' }}>
                {filteredTables.map((tableName) => {
                  const isSelected = selectedTablesState.includes(tableName);
                  const isExpanded = expandedTables[tableName];
                  const tableColumns = schema[tableName]?.columns || [];
                  
                  return (
                    <React.Fragment key={tableName}>
                      <TableRow 
                        hover
                        sx={{
                          backgroundColor: 'inherit',
                          cursor: 'pointer'
                        }}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            edge="start"
                            checked={isSelected}
                            onChange={() => handleToggleTable(tableName)}
                            inputProps={{ 'aria-labelledby': `checkbox-${tableName}` }}
                          />
                        </TableCell>
                        <TableCell 
                          component="th" 
                          scope="row"
                          onClick={() => toggleTableExpand(tableName)}
                          sx={{ fontWeight: isSelected ? 'bold' : 'normal' }}
                        >
                          <Box display="flex" alignItems="center">
                            <IconButton 
                              size="small" 
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleTableExpand(tableName);
                              }}
                              sx={{ mr: 1 }}
                            >
                              {isExpanded ? <RemoveIcon fontSize="small" /> : <AddIcon fontSize="small" />}
                            </IconButton>
                            {tableName}
            
                          </Box>
                        </TableCell>
                        <TableCell align="right">{getColumnCount(tableName)}</TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={() => toggleTableExpand(tableName)}
                          >
                            <ViewColumnIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                      
                      {/* Collapsible section for columns */}
                      <TableRow>
                        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={4}>
                          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                            <Box sx={{ margin: 1 ,width: '100%'}}>
                              <Typography variant="subtitle2" gutterBottom component="div">
                                Columns
                              </Typography>
                              <Table size="small" aria-label="column details" sx={{ width: '100%' }}>
                              <TableHead>
                                  <TableRow>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Type</TableCell>
                                    <TableCell align="center">Primary Key</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {tableColumns.map((column) => (
                                    <TableRow key={column.name}>
                                      <TableCell component="th" scope="row">
                                        {column.name}
                                      </TableCell>
                                      <TableCell>{column.type || column.data_type}</TableCell>
                                      <TableCell align="center">
                                        {(column.is_primary_key || column.key === 'PRI') && 
                                          <KeyIcon color="primary" fontSize="small" />
                                        }
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  );
                })}
                
                {filteredTables.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <Typography variant="body2" color="textSecondary">
                        No tables found
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
         
        </CardContent>
   
      </Card>
      {selectedTablesState.length > 0 && (
            <Box sx={{ 
              mt: 2, 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 0.5, 
              width: '100%' 
            }}>
              {selectedTablesState.map(table => (
                <Chip
                  key={table}
                  label={table}
                  size="small"
                  onDelete={() => handleToggleTable(table)}
                  color="primary"
                />
              ))}
            </Box>
          )}
    </div>
  );
};

export default TableSelector;
