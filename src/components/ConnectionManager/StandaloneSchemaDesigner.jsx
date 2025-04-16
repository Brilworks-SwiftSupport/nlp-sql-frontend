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
import VisualSchemaDesigner from './VisualSchemaDesigner';

// Array of ad spend tables for special handling
const AD_SPEND_TABLES = [
  'Community', 
  'ChallengeFree', 
  'ChallengePaid', 
  'ChallengeHybrid',
  'LowTicketAcquisition', 
  'HighTicketVSL', 
  'InstagramDM', 
  'WebinarBase', 
  'WebinarAdvance'
];

// Check if a table is an ad spend table
const isAdSpendTable = (tableName) => {
  return AD_SPEND_TABLES.includes(tableName);
};

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
  
  // Check if we have ad spend tables selected
  const hasAdSpendTables = selectedTables && selectedTables.some(table => isAdSpendTable(table));
  
  // Count how many ad spend tables are selected
  const adSpendTableCount = selectedTables ? selectedTables.filter(table => isAdSpendTable(table)).length : 0;
  
  // Function to suggest ad spend relationships
  const suggestAdSpendRelationships = () => {
    if (!schema) return [];
    
    const suggestions = [];
    
    // Get all selected ad spend tables
    const selectedAdSpendTables = selectedTables.filter(table => 
      AD_SPEND_TABLES.includes(table)
    );
    
    if (selectedAdSpendTables.length > 1) {
      // For each pair of ad spend tables, suggest ClientID and ClientCompanyID relationships
      for (let i = 0; i < selectedAdSpendTables.length; i++) {
        const sourceTable = selectedAdSpendTables[i];
        
        for (let j = i + 1; j < selectedAdSpendTables.length; j++) {
          const targetTable = selectedAdSpendTables[j];
          
          // Check if both tables have ClientID
          if (schema[sourceTable]?.columns?.some(col => col.name === 'ClientID') &&
              schema[targetTable]?.columns?.some(col => col.name === 'ClientID')) {
            
            suggestions.push({
              source_table: sourceTable,
              source_column: 'ClientID',
              target_table: targetTable,
              target_column: 'ClientID',
              relationship_type: 'union',
              is_ad_spend: true
            });
          }
          
          // Check if both tables have ClientCompanyID
          if (schema[sourceTable]?.columns?.some(col => col.name === 'ClientCompanyID') &&
              schema[targetTable]?.columns?.some(col => col.name === 'ClientCompanyID')) {
            
            suggestions.push({
              source_table: sourceTable,
              source_column: 'ClientCompanyID',
              target_table: targetTable,
              target_column: 'ClientCompanyID',
              relationship_type: 'union',
              is_ad_spend: true
            });
          }
          
          // Check for date columns for filtering
          const dateColumns = ['DateCreated', 'DateModified', 'Date'];
          for (const dateCol of dateColumns) {
            if (schema[sourceTable]?.columns?.some(col => col.name === dateCol) &&
                schema[targetTable]?.columns?.some(col => col.name === dateCol)) {
              
              suggestions.push({
                source_table: sourceTable,
                source_column: dateCol,
                target_table: targetTable,
                target_column: dateCol,
                relationship_type: 'union',
                is_ad_spend: true
              });
            }
          }
        }
      }
    }
    
    return suggestions;
  };
  
  // Handle auto-configure ad spend tables
  const handleAutoConfigureAdSpend = () => {
    const adSpendSuggestions = suggestAdSpendRelationships();
    
    // Filter out suggestions that are already in the relationships
    const newSuggestions = adSpendSuggestions.filter(suggestion => 
      !relationships.some(rel => {
        // Check for relationships in either format (camelCase or snake_case)
        if ('sourceTable' in rel) {
          return (
            rel.sourceTable === suggestion.source_table &&
            rel.sourceColumn === suggestion.source_column &&
            rel.targetTable === suggestion.target_table &&
            rel.targetColumn === suggestion.target_column
          );
        } else {
          return (
            rel.source_table === suggestion.source_table &&
            rel.source_column === suggestion.source_column &&
            rel.target_table === suggestion.target_table &&
            rel.target_column === suggestion.target_column
          );
        }
      })
    );
    
    // Add all new suggested relationships at once
    if (newSuggestions.length > 0) {
      onRelationshipsChange([...relationships, ...newSuggestions]);
    }
  };
  
  // Handle column selection changes from the visual designer
  const handleSelectedColumnsChange = (newSelectedColumns) => {
    setSelectedColumns(newSelectedColumns);
    if (onSelectedColumnsChange) {
      onSelectedColumnsChange(newSelectedColumns);
    }
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
                  {selectedTables ? selectedTables.length : 0} tables selected ({adSpendTableCount} ad spend tables) | 
                  {relationships.length} relationships defined
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  {hasAdSpendTables && (
                    <Chip 
                      color="primary" 
                      variant="outlined" 
                      size="small" 
                      label="Ad Spend Tables"
                      icon={<InfoIcon />}
                    />
                  )}
                </Stack>
              </Box>
            </Stack>
          </Paper>
          
          {/* Ad Spend Special Setup */}
          {hasAdSpendTables && (
            <Alert 
              severity="info" 
              icon={<AutoFixHighIcon />}
              sx={{ mb: 2 }}
              action={
                <Button 
                  color="inherit" 
                  size="small" 
                  onClick={handleAutoConfigureAdSpend}
                >
                  Auto-Configure
                </Button>
              }
            >
              <Typography variant="subtitle2">Ad Spend Tables Detected</Typography>
              <Typography variant="body2">
                Set up relationships for UNION ALL queries across your ad spend tables. This will connect tables on ClientID, ClientCompanyID and date columns.
              </Typography>
            </Alert>
          )}
          
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
          • Use the "Auto-Configure" button for ad spend tables<br />
          • Tables with common join columns like ClientID will be suggested automatically<br />
          • Choose "UNION" relationship type for UNION ALL queries across ad spend tables
        </Typography>
      </Paper>
    </Box>
  );
};

export default StandaloneSchemaDesigner;
