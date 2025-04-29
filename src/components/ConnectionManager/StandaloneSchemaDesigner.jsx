import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Alert,
  Paper,
  Divider,
  Chip,
  Stack
} from '@mui/material';
import SchemaIcon from '@mui/icons-material/Schema';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import SaveIcon from '@mui/icons-material/Save';
import SettingsIcon from '@mui/icons-material/Settings';
import InfoIcon from '@mui/icons-material/Info';
import SelectAllIcon from '@mui/icons-material/SelectAll';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import VisualSchemaDesigner from './VisualSchemaDesigner';


// Check if a table is an ad spend table

const StandaloneSchemaDesigner = ({ 
  schema, 
  selectedTables, 
  selectedColumns: initialSelectedColumns, 
  relationships, 
  onRelationshipsChange,
  onSelectedColumnsChange
}) => {
  // State for showing configuration options
  const [showConfig, setShowConfig] = useState(false);
  
  // Local state for selected columns - initialize with provided prop
  const [selectedColumns, setSelectedColumns] = useState(initialSelectedColumns || {});
  
  // Modified function to handle selecting all columns
  const handleSelectAllColumns = () => {
    const newSelectedColumns = { ...selectedColumns };
    
    // Iterate through all selected tables
    selectedTables.forEach(tableName => {
      if (schema[tableName]) {
        // Get all columns including primary and foreign keys
        const allColumns = schema[tableName].columns.map(col => col.name);
        
        // Add all columns to the selection
        newSelectedColumns[tableName] = allColumns;
      }
    });
    
    // Update local state
    setSelectedColumns(newSelectedColumns);
    
    // Notify parent component
    if (onSelectedColumnsChange) {
      onSelectedColumnsChange(newSelectedColumns);
    }
    
    // Force update the VisualSchemaDesigner by triggering a re-render
    const event = new CustomEvent('forceUpdateColumns', { 
      detail: { selectedColumns: newSelectedColumns } 
    });
    window.dispatchEvent(event);
  };

  const handleSelectedColumnsChange = (newSelectedColumns) => {
    setSelectedColumns(newSelectedColumns);
    if (onSelectedColumnsChange) {
      onSelectedColumnsChange(newSelectedColumns);
    }
  };

  // Add reset function
  const handleResetColumns = () => {
    const newSelectedColumns = {};
    
    // Initialize empty arrays for all selected tables
    selectedTables.forEach(tableName => {
      newSelectedColumns[tableName] = [];
    });
    
    // Update local state
    setSelectedColumns(newSelectedColumns);
    
    // Notify parent component
    if (onSelectedColumnsChange) {
      onSelectedColumnsChange(newSelectedColumns);
    }
    
    // Force update the VisualSchemaDesigner
    const event = new CustomEvent('forceUpdateColumns', { 
      detail: { selectedColumns: newSelectedColumns } 
    });
    window.dispatchEvent(event);
  };
  
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Card sx={{ mb: 2 }}>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <SchemaIcon sx={{ mr: 1 }} />
              <Typography variant="h5">Visual Schema Designer</Typography>
            </Box>
          }
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<SelectAllIcon />}
                onClick={handleSelectAllColumns}
              >
                Select All Columns
              </Button>
              <Button
                variant="outlined"
                color="warning"
                startIcon={<RestartAltIcon />}
                onClick={handleResetColumns}
              >
                Reset Columns
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={() => {
                  // This is handled by the parent component
                }}
              >
                Save Relationships
              </Button>
            </Box>
          }
        />
        <CardContent>
          <Typography variant="body1" gutterBottom>
            Design your database relationships visually, just like in MySQL Workbench. Drag between tables to create relationships, 
            or use auto-suggestions for common patterns.
          </Typography>
          
          {/* MySQL Workbench-style info box */}
          <Paper 
            elevation={0}
            variant="outlined"
            sx={{ 
              p: 2, 
              mt: 2, 
              mb: 2, 
              bgcolor: '#f3f9ff', 
              borderRadius: 1 
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <InfoIcon color="info" />
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">Schema Information</Typography>
                <Typography variant="body2">
                  {selectedTables ? selectedTables.length : 0} tables selected | 
                  {relationships.length} relationships defined
                </Typography>
                
              </Box>
            </Stack>
          </Paper>
          
          
          {/* Column Selection Info */}
          <Alert severity="success" sx={{ mb: 2 }}>
            <Typography variant="subtitle2">Column Selection</Typography>
            <Typography variant="body2">
              Use the checkboxes within each table to select which columns you want to include in your connection.
            </Typography>
          </Alert>
        </CardContent>
      </Card>
      
      {/* Main Designer Area */}
      <Box sx={{ flex: 1, minHeight: '500px' }}>
        <VisualSchemaDesigner
          schema={schema}
          selectedTables={selectedTables}
          selectedColumns={selectedColumns}
          relationships={relationships}
          onRelationshipsChange={onRelationshipsChange}
          onSelectedColumnsChange={handleSelectedColumnsChange}
        />
      </Box>
      
      {/* Help Text */}
      <Paper variant="outlined" sx={{ p: 2, mt: 2, bgcolor: '#fafafa' }}>
        <Typography variant="subtitle2" gutterBottom color="text.secondary">
          Visual Designer Tips:
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • Use checkboxes to select columns directly within each table<br />
          • Use the search box to quickly find columns<br />
          • Drag between tables to create a relationship<br />
          • Tables with common join columns like ClientID will be suggested automatically<br />
        </Typography>
      </Paper>
    </Box>
  );
};

export default StandaloneSchemaDesigner;
