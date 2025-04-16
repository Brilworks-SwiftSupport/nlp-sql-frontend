import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Tooltip,
  IconButton
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import StorageIcon from '@mui/icons-material/Storage';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import LinkIcon from '@mui/icons-material/Link';
import SummarizeIcon from '@mui/icons-material/Summarize';
import InfoIcon from '@mui/icons-material/Info';

const ConnectionSummary = ({ 
  connectionData, 
  schema, 
  selectedTables, 
  selectedColumns, 
  relationships,
  validationErrors 
}) => {
  // Calculate metrics for the summary
  const getTotalSelectedColumns = () => {
    return Object.values(selectedColumns).reduce((total, columns) => total + columns.length, 0);
  };
  
  const getTotalAvailableColumns = () => {
    return selectedTables.reduce((total, table) => {
      return total + (schema[table]?.columns?.length || 0);
    }, 0);
  };
  
  // Check if all required steps are completed
  const isConnectionValid = () => {
    return (
      connectionData.name &&
      connectionData.db_type &&
      connectionData.host &&
      connectionData.port &&
      connectionData.username &&
      connectionData.database
    );
  };
  
  const areTablesSelected = () => {
    return selectedTables.length > 0;
  };
  
  const areColumnsSelected = () => {
    return getTotalSelectedColumns() > 0;
  };
  
  const areRelationshipsDefined = () => {
    // If only one table is selected, relationships are not required
    if (selectedTables.length <= 1) return true;
    
    // Check if all tables have at least one relationship
    const tablesWithRelationships = new Set();
    
    relationships.forEach(rel => {
      tablesWithRelationships.add(rel.source_table);
      tablesWithRelationships.add(rel.target_table);
    });
    
    return selectedTables.every(table => tablesWithRelationships.has(table));
  };
  
  // Generate report of missing requirements
  const getMissingRequirements = () => {
    const missing = [];
    
    if (!isConnectionValid()) {
      missing.push('Connection details are incomplete');
    }
    
    if (!areTablesSelected()) {
      missing.push('No tables selected');
    }
    
    if (!areColumnsSelected()) {
      missing.push('No columns selected');
    }
    
    if (!areRelationshipsDefined()) {
      missing.push('Not all tables have defined relationships');
    }
    
    return missing;
  };
  
  const missingRequirements = getMissingRequirements();
  const isReadyToSave = missingRequirements.length === 0;

  return (
    <Box>
      <Typography variant="h6" gutterBottom display="flex" alignItems="center">
        <SummarizeIcon sx={{ mr: 1 }} />
        Connection Summary
      </Typography>
      
      <Typography variant="body2" color="text.secondary" paragraph>
        Review your connection setup before saving.
      </Typography>
      
      {/* Status overview */}
      <Paper elevation={0} variant="outlined" sx={{ p: 2, mb: 3, bgcolor: isReadyToSave ? 'success.light' : 'warning.light' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {isReadyToSave ? (
            <CheckCircleIcon sx={{ mr: 1, color: 'success.dark' }} />
          ) : (
            <ErrorIcon sx={{ mr: 1, color: 'warning.dark' }} />
          )}
          
          <Typography variant="body1" fontWeight="medium" color={isReadyToSave ? 'success.dark' : 'warning.dark'}>
            {isReadyToSave 
              ? 'Connection is ready to save!' 
              : 'Connection setup is incomplete. Please complete all required steps.'}
          </Typography>
        </Box>
        
        {!isReadyToSave && (
          <List dense sx={{ pl: 4, mt: 1 }}>
            {missingRequirements.map((item, index) => (
              <ListItem key={index} sx={{ py: 0 }}>
                <ListItemIcon sx={{ minWidth: 28 }}>
                  <ErrorIcon color="warning" fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={item} />
              </ListItem>
            ))}
          </List>
        )}
      </Paper>
      
      {/* Connection validation errors */}
      {validationErrors && Object.keys(validationErrors).length > 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Validation Errors:
          </Typography>
          <List dense disablePadding>
            {Object.entries(validationErrors).map(([key, error]) => (
              <ListItem key={key} sx={{ py: 0 }}>
                <ListItemText 
                  primary={`${key}: ${error}`}
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
            ))}
          </List>
        </Alert>
      )}
      
      <Grid container spacing={3}>
        {/* Connection Details */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" gutterBottom display="flex" alignItems="center">
                <StorageIcon sx={{ mr: 1, fontSize: 'small' }} />
                Connection Details
                {isConnectionValid() ? (
                  <Chip size="small" label="Complete" color="success" sx={{ ml: 1 }} />
                ) : (
                  <Chip size="small" label="Incomplete" color="warning" sx={{ ml: 1 }} />
                )}
              </Typography>
              
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell component="th" width="140">Name</TableCell>
                      <TableCell>{connectionData.name || '—'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th">Database Type</TableCell>
                      <TableCell>{connectionData.db_type || '—'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th">Host / Server</TableCell>
                      <TableCell>{connectionData.host || '—'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th">Port</TableCell>
                      <TableCell>{connectionData.port || '—'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th">Username</TableCell>
                      <TableCell>{connectionData.username || '—'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th">Password</TableCell>
                      <TableCell>{connectionData.password ? '••••••••' : '—'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th">Database</TableCell>
                      <TableCell>{connectionData.database || '—'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th">Schema</TableCell>
                      <TableCell>{connectionData.db_schema || '—'}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Tables and Columns */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" gutterBottom display="flex" alignItems="center">
                <ViewColumnIcon sx={{ mr: 1, fontSize: 'small' }} />
                Tables & Columns
                {areTablesSelected() && areColumnsSelected() ? (
                  <Chip size="small" label="Complete" color="success" sx={{ ml: 1 }} />
                ) : (
                  <Chip size="small" label="Incomplete" color="warning" sx={{ ml: 1 }} />
                )}
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Chip
                  label={`${selectedTables.length} Tables Selected`}
                  size="small"
                  color={selectedTables.length > 0 ? "primary" : "default"}
                />
                
                <Chip
                  label={`${getTotalSelectedColumns()}/${getTotalAvailableColumns()} Columns Selected`}
                  size="small"
                  color={getTotalSelectedColumns() > 0 ? "primary" : "default"}
                />
              </Box>
              
              {selectedTables.length > 0 ? (
                <TableContainer sx={{ maxHeight: 300 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Table</TableCell>
                        <TableCell>Selected Columns</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedTables.map((table) => (
                        <TableRow key={table}>
                          <TableCell>{table}</TableCell>
                          <TableCell>
                            {selectedColumns[table]?.length > 0 ? (
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                <Chip
                                  size="small"
                                  label={`${selectedColumns[table]?.length || 0}/${schema[table]?.columns?.length || 0}`}
                                  color="primary"
                                />
                                {selectedColumns[table]?.length > 3 ? (
                                  <Tooltip title={selectedColumns[table].join(', ')}>
                                    <Chip
                                      size="small"
                                      label={`${selectedColumns[table][0]}, ${selectedColumns[table][1]}...`}
                                      variant="outlined"
                                      onDelete={null}
                                    />
                                  </Tooltip>
                                ) : (
                                  selectedColumns[table]?.map((col, idx) => (
                                    <Chip key={idx} size="small" label={col} variant="outlined" />
                                  ))
                                )}
                              </Box>
                            ) : (
                              <Typography variant="body2" color="error">
                                No columns selected
                              </Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  No tables selected
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Relationships */}
        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" gutterBottom display="flex" alignItems="center">
                <LinkIcon sx={{ mr: 1, fontSize: 'small' }} />
                Relationships
                {areRelationshipsDefined() ? (
                  <Chip size="small" label="Complete" color="success" sx={{ ml: 1 }} />
                ) : (
                  <Chip size="small" label="Incomplete" color="warning" sx={{ ml: 1 }} />
                )}
              </Typography>
              
              {selectedTables.length <= 1 ? (
                <Typography color="text.secondary" sx={{ py: 1 }}>
                  Relationships are not required when only one table is selected.
                </Typography>
              ) : relationships.length > 0 ? (
                <TableContainer sx={{ maxHeight: 200 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Source Table</TableCell>
                        <TableCell>Source Column</TableCell>
                        <TableCell>Target Table</TableCell>
                        <TableCell>Target Column</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {relationships.map((rel, index) => (
                        <TableRow key={index}>
                          <TableCell>{rel.source_table}</TableCell>
                          <TableCell>{rel.source_column}</TableCell>
                          <TableCell>{rel.target_table}</TableCell>
                          <TableCell>{rel.target_column}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="error" sx={{ py: 1 }}>
                  No relationships defined. Define at least one relationship between each of your selected tables.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Info Card */}
      <Box sx={{ mt: 3 }}>
        <Divider sx={{ mb: 2 }} />
        <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
          <InfoIcon sx={{ mr: 1, fontSize: 'small' }} />
          All steps must be completed before you can save this connection.
        </Typography>
      </Box>
    </Box>
  );
};

export default ConnectionSummary;
