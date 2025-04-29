import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Paper,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Collapse,
  Tabs,
  Tab,
  Divider,
  Grid,
  FormHelperText,
  Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SchemaIcon from '@mui/icons-material/Schema';
import ListAltIcon from '@mui/icons-material/ListAlt';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import EditIcon from '@mui/icons-material/Edit';
import LinkIcon from '@mui/icons-material/Link';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import VisualSchemaDesigner from './VisualSchemaDesigner';

// Special columns that we know are typically used for relations in the database
const COMMON_JOIN_COLUMNS = ['ClientID', 'ClientCompanyID', 'ID', 'DateCreated', 'DateModified'];



export default function RelationshipManager({ 
  schema = {}, 
  selectedTables = [], 
  selectedColumns = {}, 
  relationships = [], 
  onRelationshipsChange, 
  connectionId,
  error = ''
}) {
  const [missingRelationships, setMissingRelationships] = useState([]);
  const [open, setOpen] = useState(false);
  const [currentRelationship, setCurrentRelationship] = useState(null);
  const [viewMode, setViewMode] = useState('visual'); // 'visual' or 'list'
  const [editMode, setEditMode] = useState(false);
  const [errors, setErrors] = useState({});
  const [suggestedRelationships, setSuggestedRelationships] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [duplicateRelationships, setDuplicateRelationships] = useState([]);

  // Detect missing relationships on component mount and when selected tables change
  useEffect(() => {
    if (schema && selectedTables && selectedTables.length > 0) {
      detectMissingRelationships();
    }
  }, [selectedTables, relationships, schema]);
  
  // Detect missing relationships between tables
  const detectMissingRelationships = () => {
    if (!schema) return;
    
    const suggestions = [];
    
    // Check each pair of selected tables
    for (let i = 0; i < selectedTables.length; i++) {
      const sourceTable = selectedTables[i];
      
      for (let j = i + 1; j < selectedTables.length; j++) {
        const targetTable = selectedTables[j];
        
        // Skip if relationship already exists
        const existingRelationship = relationships.find(
          rel => 
            (rel.source_table === sourceTable && 
             rel.source_column === sourceColumn &&
             rel.target_table === targetTable &&
             rel.target_column === targetColumn) ||
            (rel.source_table === targetTable && 
             rel.source_column === targetColumn &&
             rel.target_table === sourceTable &&
             rel.target_column === sourceColumn)
        );
        
        if (!existingRelationship) {
          // Look for common columns between tables
          const sourceColumns = schema[sourceTable]?.columns || [];
          const targetColumns = schema[targetTable]?.columns || [];
          
          // First check for common join columns we know about
          const commonJoinColumns = COMMON_JOIN_COLUMNS.filter(colName => 
            sourceColumns.some(col => col.name === colName) && 
            targetColumns.some(col => col.name === colName)
          );
          
          if (commonJoinColumns.length > 0) {
            suggestions.push({
              source_table: sourceTable,
              target_table: targetTable,
              common_columns: commonJoinColumns
            });
          } else {
            // Look for other potentially matching columns (based on name)
            const potentialMatches = [];
            
            sourceColumns.forEach(sourceCol => {
              targetColumns.forEach(targetCol => {
                if (sourceCol.name === targetCol.name) {
                  potentialMatches.push(sourceCol.name);
                } else if (
                  (sourceCol.name.endsWith('ID') && targetCol.name.endsWith('ID')) &&
                  (sourceCol.name.includes(targetTable) || targetCol.name.includes(sourceTable))
                ) {
                  potentialMatches.push({
                    source: sourceCol.name,
                    target: targetCol.name
                  });
                }
              });
            });
            
            if (potentialMatches.length > 0) {
              suggestions.push({
                source_table: sourceTable,
                target_table: targetTable,
                potential_matches: potentialMatches
              });
            }
          }
        }
      }
    }
    

    
    setMissingRelationships(suggestions);
    setSuggestedRelationships([...suggestions, ...adSpendSuggestions]);
  };
  
  
  
  // Get available columns for a table, filtered to only include selected columns if provided
  const getAvailableColumns = (tableName) => {
    if (!schema || !schema[tableName] || !schema[tableName].columns) {
      return [];
    }
    
    const allTableColumns = schema[tableName].columns;
    
    // If we have selected columns for this table, only show those
    if (selectedColumns && selectedColumns[tableName] && selectedColumns[tableName].length > 0) {
      return allTableColumns.filter(col => selectedColumns[tableName].includes(col.name));
    }
    
    return allTableColumns;
  };
  
  const handleOpenDialog = (relationship = null, isEdit = false) => {
    setCurrentRelationship(relationship || {
      source_table: '',
      source_column: '',
      target_table: '',
      target_column: '',
      relationship_type: 'many-to-one', // Default type
    });
    setEditMode(isEdit);
    setErrors({});
    setOpen(true);
  };
  
  const handleCloseDialog = () => {
    setOpen(false);
    setCurrentRelationship(null);
    setEditMode(false);
    setErrors({});
  };
  
  const validateRelationship = (relationship) => {
    const newErrors = {};
    
    if (!relationship.source_table) {
      newErrors.source_table = 'Source table is required';
    }
    
    if (!relationship.source_column) {
      newErrors.source_column = 'Source column is required';
    }
    
    if (!relationship.target_table) {
      newErrors.target_table = 'Target table is required';
    }
    
    if (!relationship.target_column) {
      newErrors.target_column = 'Target column is required';
    }
    
    if (!relationship.relationship_type) {
      newErrors.relationship_type = 'Relationship type is required';
    }
    
    // Check for duplicate relationship
    if (!editMode) {
      const duplicate = relationships.find(
        rel => 
          (rel.source_table === relationship.source_table && 
           rel.source_column === relationship.source_column &&
           rel.target_table === relationship.target_table &&
           rel.target_column === relationship.target_column) ||
          (rel.source_table === relationship.target_table && 
           rel.source_column === relationship.target_column &&
           rel.target_table === relationship.source_table &&
           rel.target_column === relationship.source_column)
      );
      
      if (duplicate) {
        newErrors.general = 'This relationship already exists';
      }
    }
    
    return newErrors;
  };
  
  const handleSaveRelationship = () => {
    const validationErrors = validateRelationship(currentRelationship);
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    let updatedRelationships = [...relationships];
    
    if (editMode) {
      // Find the index of the relationship being edited
      const index = relationships.findIndex(rel => 
        rel.source_table === currentRelationship.originalSourceTable &&
        rel.source_column === currentRelationship.originalSourceColumn &&
        rel.target_table === currentRelationship.originalTargetTable &&
        rel.target_column === currentRelationship.originalTargetColumn
      );
      
      if (index !== -1) {
        // Replace with updated relationship
        updatedRelationships[index] = {
          source_table: currentRelationship.source_table,
          source_column: currentRelationship.source_column,
          target_table: currentRelationship.target_table,
          target_column: currentRelationship.target_column,
          relationship_type: currentRelationship.relationship_type
        };
      }
    } else {
      // Add new relationship
      updatedRelationships.push({
        source_table: currentRelationship.source_table,
        source_column: currentRelationship.source_column,
        target_table: currentRelationship.target_table,
        target_column: currentRelationship.target_column,
        relationship_type: currentRelationship.relationship_type
      });
    }
    
    onRelationshipsChange(updatedRelationships);
    handleCloseDialog();
  };
  
  const handleDeleteRelationship = (relationship) => {
    const updatedRelationships = relationships.filter(rel => 
      !(rel.source_table === relationship.source_table &&
        rel.source_column === relationship.source_column &&
        rel.target_table === relationship.target_table &&
        rel.target_column === relationship.target_column)
    );
    
    onRelationshipsChange(updatedRelationships);
  };
  
  const handleEditRelationship = (relationship) => {
    // Store original values to identify this relationship when saving edits
    const relationshipToEdit = {
      ...relationship,
      originalSourceTable: relationship.source_table,
      originalSourceColumn: relationship.source_column,
      originalTargetTable: relationship.target_table,
      originalTargetColumn: relationship.target_column
    };
    
    handleOpenDialog(relationshipToEdit, true);
  };
  
  const handleAddSuggestedRelationship = (suggestion) => {
    let sourceColumn = '';
    let targetColumn = '';
    
    // If there are common columns, use the first one as default
    if (suggestion.common_columns && suggestion.common_columns.length > 0) {
      sourceColumn = suggestion.common_columns[0];
      targetColumn = suggestion.common_columns[0];
    } 
    // If there are potential matches, use the first one
    else if (suggestion.potential_matches && suggestion.potential_matches.length > 0) {
      const match = suggestion.potential_matches[0];
      if (typeof match === 'string') {
        sourceColumn = match;
        targetColumn = match;
      } else {
        sourceColumn = match.source;
        targetColumn = match.target;
      }
    }
    
    const newRelationship = {
      source_table: suggestion.source_table,
      source_column: sourceColumn,
      target_table: suggestion.target_table,
      target_column: targetColumn,
      relationship_type: 'many-to-one', // Default type
    };
    
    handleOpenDialog(newRelationship, false);
  };
  
  const handleInputChange = (field, value) => {
    setCurrentRelationship({
      ...currentRelationship,
      [field]: value
    });
    
    // Clear error for this field if it exists
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: ''
      });
    }
  };
  
  const areAllTablesConnected = () => {
    if (selectedTables.length <= 1) return true;
    
    // Create an adjacency list to represent the graph
    const graph = {};
    selectedTables.forEach(table => {
      graph[table] = [];
    });
    
    // Add edges for each relationship
    relationships.forEach(rel => {
      if (graph[rel.source_table] && graph[rel.target_table]) {
        graph[rel.source_table].push(rel.target_table);
        graph[rel.target_table].push(rel.source_table);
      }
    });
    
    // Use BFS to check if all tables are connected
    const visited = new Set();
    const queue = [selectedTables[0]];
    visited.add(selectedTables[0]);
    
    while (queue.length > 0) {
      const current = queue.shift();
      const neighbors = graph[current] || [];
      
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }
    
    // If all tables are visited, the graph is connected
    return visited.size === selectedTables.length;
  };
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleViewModeChange = (event, newValue) => {
    setViewMode(newValue);
  };

  // Check for duplicate relationships
  useEffect(() => {
    // Create a set to track unique relationships
    const uniqueRelationshipKeys = new Set();
    const duplicates = [];
    
    // First pass - detect duplicates
    relationships.forEach((rel, index) => {
      const forwardKey = `${rel.source_table}.${rel.source_column}=>${rel.target_table}.${rel.target_column}`;
      const reverseKey = `${rel.target_table}.${rel.target_column}=>${rel.source_table}.${rel.source_column}`;
      
      if (uniqueRelationshipKeys.has(forwardKey) || uniqueRelationshipKeys.has(reverseKey)) {
        // This is a duplicate
        duplicates.push({
          index,
          relationship: rel,
          key: forwardKey
        });
      } else {
        uniqueRelationshipKeys.add(forwardKey);
      }
    });
    
    setDuplicateRelationships(duplicates);
    setShowDuplicateWarning(duplicates.length > 0);
  }, [relationships]);

  return (
    <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader 
        title={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <SchemaIcon sx={{ mr: 1 }} />
            <Typography variant="h6">Define Table Relationships</Typography>
          </Box>
        }
        action={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog(null)}
            color="primary"
          >
            Add Relationship
          </Button>
        }
      />
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
        <Tabs 
          value={viewMode} 
          onChange={handleViewModeChange} 
          aria-label="relationship view mode"
          sx={{ mb: 1 }}
        >
          <Tab 
            icon={<SchemaIcon />} 
            label="Visual Designer" 
            value="visual" 
            id="tab-visual"
            aria-controls="tabpanel-visual"
          />
          <Tab 
            icon={<ListAltIcon />} 
            label="List View" 
            value="list" 
            id="tab-list"
            aria-controls="tabpanel-list"
          />
        </Tabs>
      </Box>
   

      {/* Missing Relationships Alert */}
      {missingRelationships.length > 0 && (
        <Box sx={{ mx: 2, mb: 2 }}>
          <Alert 
            severity="warning" 
            action={
              <Button 
                color="inherit" 
                size="small" 
                onClick={() => {
                  const newSuggestions = missingRelationships.filter(suggestion => 
                    !relationships.some(rel => 
                      rel.source_table === suggestion.source_table &&
                      rel.source_column === suggestion.source_column &&
                      rel.target_table === suggestion.target_table &&
                      rel.target_column === suggestion.target_column
                    )
                  );
                  
                  // Add all new suggested relationships at once
                  if (newSuggestions.length > 0) {
                    onRelationshipsChange([...relationships, ...newSuggestions]);
                  }
                }}
              >
                Add All
              </Button>
            }
          >
            <Typography variant="body2">
              {missingRelationships.length} suggested relationship{missingRelationships.length !== 1 ? 's' : ''} found
            </Typography>
          </Alert>
        </Box>
      )}
      
      {/* Duplicate Relationships Alert */}
      {showDuplicateWarning && (
        <Box sx={{ mx: 2, mb: 2 }}>
          <Alert 
            severity="warning" 
            action={
              <Button 
                color="inherit" 
                size="small" 
                onClick={() => {
                  const updatedRelationships = relationships.filter((rel, index) => 
                    !duplicateRelationships.some(dup => dup.index === index)
                  );
                  onRelationshipsChange(updatedRelationships);
                }}
              >
                Remove Duplicates
              </Button>
            }
          >
            <Typography variant="body2">
              {duplicateRelationships.length} duplicate relationship{duplicateRelationships.length !== 1 ? 's' : ''} found
            </Typography>
          </Alert>
        </Box>
      )}
      
      <CardContent sx={{ flex: '1 0 auto', p: 0, overflow: 'hidden' }}>
        {/* Visual Designer Tab Panel */}
        <Box
          role="tabpanel"
          id="tabpanel-visual"
          aria-labelledby="tab-visual"
          hidden={viewMode !== 'visual'}
          sx={{ height: '100%', display: viewMode === 'visual' ? 'block' : 'none' }}
        >
          <VisualSchemaDesigner
            schema={schema}
            selectedTables={selectedTables}
            selectedColumns={selectedColumns}
            relationships={relationships}
            onRelationshipsChange={onRelationshipsChange}
          />
        </Box>
        
        {/* List View Tab Panel */}
        <Box
          role="tabpanel"
          id="tabpanel-list"
          aria-labelledby="tab-list"
          hidden={viewMode !== 'list'}
          sx={{ height: '100%', px: 2, py: 1, overflow: 'auto', display: viewMode === 'list' ? 'block' : 'none' }}
        >
          {relationships.length > 0 ? (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Source Table</TableCell>
                    <TableCell>Source Column</TableCell>
                    <TableCell>Relationship</TableCell>
                    <TableCell>Target Table</TableCell>
                    <TableCell>Target Column</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {relationships.map((relationship, index) => {
                    // Check if this relationship is a duplicate
                    const isDuplicate = duplicateRelationships.some(dup => dup.index === index);
                    
                    return (
                    <TableRow 
                      key={index}
                      sx={{
                        backgroundColor: isDuplicate ? 'rgba(255, 0, 0, 0.05)' : 'inherit',
                        '&:hover': {
                          backgroundColor: isDuplicate ? 'rgba(255, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.04)'
                        }
                      }}
                    >
                      <TableCell>{relationship.source_table}</TableCell>
                      <TableCell>{relationship.source_column}</TableCell>
                      <TableCell>
                        {relationship.relationship_type === 'one-to-one' && '1:1'}
                        {relationship.relationship_type === 'one-to-many' && '1:N'}
                        {relationship.relationship_type === 'many-to-one' && 'N:1'}
                        {relationship.relationship_type === 'many-to-many' && 'N:N'}
                        {relationship.relationship_type === 'union' && 'UNION'}
                      </TableCell>
                      <TableCell>{relationship.target_table}</TableCell>
                      <TableCell>{relationship.target_column}</TableCell>
                      <TableCell>
                        {isDuplicate && (
                          <Tooltip title="This is a duplicate relationship">
                            <IconButton size="small" color="warning" sx={{ mr: 1 }}>
                              <WarningAmberIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(relationship)}
                          aria-label="edit relationship"
                          sx={{ mr: 1 }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDeleteRelationship(index);
                          }}
                          aria-label="delete relationship"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="textSecondary">No relationships defined yet.</Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog(null)}
                sx={{ mt: 2 }}
              >
                Add Relationship
              </Button>
            </Box>
          )}
        </Box>
      </CardContent>

      <Dialog open={open} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editMode ? 'Edit Relationship' : 'Add New Relationship'}
        </DialogTitle>
        <DialogContent>
          {errors.general && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errors.general}
            </Alert>
          )}
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={5}>
              <FormControl fullWidth error={!!errors.source_table}>
                <InputLabel>Source Table</InputLabel>
                <Select
                  value={currentRelationship?.source_table || ''}
                  label="Source Table"
                  onChange={(e) => handleInputChange('source_table', e.target.value)}
                >
                  {selectedTables.map(table => (
                    <MenuItem key={table} value={table}>{table}</MenuItem>
                  ))}
                </Select>
                {errors.source_table && <FormHelperText>{errors.source_table}</FormHelperText>}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={2} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FormControl fullWidth error={!!errors.relationship_type}>
                <InputLabel>Type</InputLabel>
                <Select
                  value={currentRelationship?.relationship_type || 'many-to-one'}
                  label="Type"
                  onChange={(e) => handleInputChange('relationship_type', e.target.value)}
                >
                  <MenuItem value="one-to-one">1:1</MenuItem>
                  <MenuItem value="one-to-many">1:N</MenuItem>
                  <MenuItem value="many-to-one">N:1</MenuItem>
                  <MenuItem value="many-to-many">N:N</MenuItem>
                  <MenuItem value="union">UNION</MenuItem>
                </Select>
                {errors.relationship_type && <FormHelperText>{errors.relationship_type}</FormHelperText>}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={5}>
              <FormControl fullWidth error={!!errors.target_table}>
                <InputLabel>Target Table</InputLabel>
                <Select
                  value={currentRelationship?.target_table || ''}
                  label="Target Table"
                  onChange={(e) => handleInputChange('target_table', e.target.value)}
                >
                  {selectedTables.map(table => (
                    <MenuItem key={table} value={table}>{table}</MenuItem>
                  ))}
                </Select>
                {errors.target_table && <FormHelperText>{errors.target_table}</FormHelperText>}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={5}>
              <FormControl fullWidth error={!!errors.source_column}>
                <InputLabel>Source Column</InputLabel>
                <Select
                  value={currentRelationship?.source_column || ''}
                  label="Source Column"
                  onChange={(e) => handleInputChange('source_column', e.target.value)}
                  disabled={!currentRelationship?.source_table}
                >
                  {getAvailableColumns(currentRelationship?.source_table).map(column => (
                    <MenuItem key={column.name} value={column.name}>
                      {column.name}
                      {COMMON_JOIN_COLUMNS.includes(column.name) && ' (Key)'}
                    </MenuItem>
                  ))}
                </Select>
                {errors.source_column && <FormHelperText>{errors.source_column}</FormHelperText>}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={2} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box sx={{ textAlign: 'center' }}>
                <LinkIcon color="primary" sx={{ fontSize: 32 }} />
              </Box>
            </Grid>
            
            <Grid item xs={12} md={5}>
              <FormControl fullWidth error={!!errors.target_column}>
                <InputLabel>Target Column</InputLabel>
                <Select
                  value={currentRelationship?.target_column || ''}
                  label="Target Column"
                  onChange={(e) => handleInputChange('target_column', e.target.value)}
                  disabled={!currentRelationship?.target_table}
                >
                  {getAvailableColumns(currentRelationship?.target_table).map(column => (
                    <MenuItem key={column.name} value={column.name}>
                      {column.name}
                      {COMMON_JOIN_COLUMNS.includes(column.name) && ' (Key)'}
                    </MenuItem>
                  ))}
                </Select>
                {errors.target_column && <FormHelperText>{errors.target_column}</FormHelperText>}
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSaveRelationship} 
            variant="contained"
            color="primary"
            startIcon={editMode ? <EditIcon /> : <AddIcon />}
          >
            {editMode ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};
