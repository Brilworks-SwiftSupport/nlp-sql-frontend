import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  List, 
  ListItem, 
  ListItemText, 
  Switch, 
  Chip,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';
import InfoIcon from '@mui/icons-material/Info';

const RelationshipManager = ({ relationships, setRelationships }) => {
  // Add 'selected' property to relationships if it doesn't exist
  React.useEffect(() => {
    if (relationships.length > 0 && relationships[0].selected === undefined) {
      // Initialize relationships with selection state
      const initializedRelationships = relationships.map(rel => ({
        ...rel,
        selected: rel.relationship_type === 'defined' // Auto-select defined relationships
      }));
      setRelationships(initializedRelationships);
    }
  }, [relationships]);

  const handleToggleRelationship = (index) => {
    const updatedRelationships = [...relationships];
    updatedRelationships[index].selected = !updatedRelationships[index].selected;
    setRelationships(updatedRelationships);
  };

  // Count selected relationships
  const selectedCount = relationships.filter(rel => rel.selected).length;
  
  // Group relationships into defined and suggested
  const definedRelationships = relationships.filter(rel => rel.relationship_type === 'defined');
  const suggestedRelationships = relationships.filter(rel => rel.relationship_type === 'suggested');

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Define Relationships
        <Tooltip title="Relationships define how tables are connected to each other. Defined relationships are detected from your schema's foreign keys. Suggested relationships are based on common column names like ClientID.">
          <IconButton size="small">
            <InfoIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Typography>
      
      {relationships.length === 0 ? (
        <Typography variant="body1">
          No relationships found between the selected tables. You can still continue to build your query.
        </Typography>
      ) : (
        <>
          {definedRelationships.length > 0 && (
            <>
              <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>
                Defined Relationships
                <Tooltip title="These relationships are detected from your schema's foreign keys">
                  <CheckCircleIcon color="success" fontSize="small" sx={{ ml: 1, verticalAlign: 'middle' }} />
                </Tooltip>
              </Typography>
              <Paper sx={{ mb: 3 }}>
                <List dense>
                  {definedRelationships.map((relationship, index) => {
                    const actualIndex = relationships.findIndex(r => 
                      r.source_table === relationship.source_table &&
                      r.source_column === relationship.source_column &&
                      r.target_table === relationship.target_table &&
                      r.target_column === relationship.target_column
                    );
                    
                    return (
                      <ListItem 
                        key={`defined-${index}`}
                        divider={index < definedRelationships.length - 1}
                        secondaryAction={
                          <Switch
                            edge="end"
                            checked={relationship.selected || false}
                            onChange={() => handleToggleRelationship(actualIndex)}
                            color="primary"
                          />
                        }
                      >
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Chip label={relationship.source_table} color="primary" size="small" />
                              <Box sx={{ mx: 1, display: 'flex', alignItems: 'center' }}>
                                <Typography variant="body2" color="text.secondary">
                                  {relationship.source_column}
                                </Typography>
                                <ArrowRightAltIcon sx={{ mx: 0.5 }} />
                                <Typography variant="body2" color="text.secondary">
                                  {relationship.target_column}
                                </Typography>
                              </Box>
                              <Chip label={relationship.target_table} color="primary" size="small" />
                            </Box>
                          }
                          secondary={
                            <Typography variant="caption" color="text.secondary">
                              Foreign Key Relationship
                            </Typography>
                          }
                        />
                      </ListItem>
                    );
                  })}
                </List>
              </Paper>
            </>
          )}
          
          {suggestedRelationships.length > 0 && (
            <>
              <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>
                Suggested Relationships
                <Tooltip title="These relationships are suggested based on common column names like ClientID">
                  <LinkIcon color="info" fontSize="small" sx={{ ml: 1, verticalAlign: 'middle' }} />
                </Tooltip>
              </Typography>
              <Paper>
                <List dense>
                  {suggestedRelationships.map((relationship, index) => {
                    const actualIndex = relationships.findIndex(r => 
                      r.source_table === relationship.source_table &&
                      r.source_column === relationship.source_column &&
                      r.target_table === relationship.target_table &&
                      r.target_column === relationship.target_column
                    );
                    
                    return (
                      <ListItem 
                        key={`suggested-${index}`}
                        divider={index < suggestedRelationships.length - 1}
                        secondaryAction={
                          <Switch
                            edge="end"
                            checked={relationship.selected || false}
                            onChange={() => handleToggleRelationship(actualIndex)}
                            color="primary"
                          />
                        }
                      >
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Chip label={relationship.source_table} color="info" size="small" variant="outlined" />
                              <Box sx={{ mx: 1, display: 'flex', alignItems: 'center' }}>
                                <Typography variant="body2" color="text.secondary">
                                  {relationship.source_column}
                                </Typography>
                                <ArrowRightAltIcon sx={{ mx: 0.5 }} />
                                <Typography variant="body2" color="text.secondary">
                                  {relationship.target_column}
                                </Typography>
                              </Box>
                              <Chip label={relationship.target_table} color="info" size="small" variant="outlined" />
                            </Box>
                          }
                          secondary={
                            <Typography variant="caption" color="text.secondary">
                              Common key suggestion
                            </Typography>
                          }
                        />
                      </ListItem>
                    );
                  })}
                </List>
              </Paper>
            </>
          )}
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="primary">
              {selectedCount} relationship(s) selected
            </Typography>
            {selectedCount === 0 && (
              <Typography variant="body2" color="warning.main" sx={{ mt: 1 }}>
                No relationships selected. Your query will use the selected tables independently (no joins).
              </Typography>
            )}
          </Box>
        </>
      )}
    </Box>
  );
};

export default RelationshipManager;
