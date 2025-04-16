import React from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  CardActions, 
  Button, 
  Grid,
  Chip,
  Collapse,
  IconButton,
  Tooltip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import AssessmentIcon from '@mui/icons-material/Assessment';
import InfoIcon from '@mui/icons-material/Info';
import styled from '@emotion/styled';

// Expand animation for the cards
const ExpandMore = styled(({ expand, ...other }) => (
  <IconButton {...other} />
))(({ theme, expand }) => ({
  transform: !expand ? 'rotate(0deg)' : 'rotate(180deg)',
  marginLeft: 'auto',
  transition: 'transform 0.3s'
}));

const QueryPatterns = ({ patterns, onApplyPattern }) => {
  const [expanded, setExpanded] = React.useState({});

  const handleExpandClick = (patternName) => {
    setExpanded({
      ...expanded,
      [patternName]: !expanded[patternName]
    });
  };

  if (!patterns || patterns.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <LightbulbIcon sx={{ mr: 1, color: 'warning.main' }} />
        Common Query Patterns
        <Tooltip title="These are pre-configured query patterns for common analysis tasks. Click 'Use Pattern' to quickly set up tables, columns, and aggregations.">
          <IconButton size="small">
            <InfoIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Typography>
      
      <Grid container spacing={2}>
        {patterns.map((pattern, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card 
              variant="outlined" 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                '&:hover': {
                  boxShadow: 1
                }
              }}
            >
              <CardContent sx={{ pb: 0, flexGrow: 1 }}>
                <Typography variant="h6" component="div" sx={{ display: 'flex', alignItems: 'center' }}>
                  <AssessmentIcon sx={{ mr: 1, color: 'primary.main' }} />
                  {pattern.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {pattern.description}
                </Typography>
                
                <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {pattern.default_tables && pattern.default_tables.slice(0, 3).map((table, i) => (
                    <Chip 
                      key={i} 
                      label={table} 
                      size="small" 
                      variant="outlined" 
                      color="primary"
                    />
                  ))}
                  {pattern.default_tables && pattern.default_tables.length > 3 && (
                    <Chip 
                      label={`+${pattern.default_tables.length - 3} more`} 
                      size="small" 
                      variant="outlined"
                    />
                  )}
                </Box>
              </CardContent>
              
              <CardActions disableSpacing>
                <Button 
                  size="small" 
                  color="primary"
                  onClick={() => onApplyPattern(pattern)}
                >
                  Use Pattern
                </Button>
                <ExpandMore
                  expand={expanded[pattern.name]}
                  onClick={() => handleExpandClick(pattern.name)}
                  aria-expanded={expanded[pattern.name]}
                  aria-label="show more"
                  size="small"
                >
                  <ExpandMoreIcon />
                </ExpandMore>
              </CardActions>
              
              <Collapse in={expanded[pattern.name]} timeout="auto" unmountOnExit>
                <CardContent sx={{ pt: 0 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Tables Included:
                  </Typography>
                  <Box sx={{ mb: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {pattern.default_tables && pattern.default_tables.map((table, i) => (
                      <Chip 
                        key={i} 
                        label={table} 
                        size="small" 
                        variant="outlined"
                      />
                    ))}
                  </Box>
                  
                  {pattern.aggregations && (
                    <>
                      <Typography variant="subtitle2" gutterBottom>
                        Aggregations:
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {Object.entries(pattern.aggregations).slice(0, 3).map(([table, columns], i) => (
                          <Typography variant="caption" key={i}>
                            {table}: {Object.entries(columns).map(([col, agg]) => `${agg}(${col})`).join(', ')}
                          </Typography>
                        ))}
                        {Object.keys(pattern.aggregations).length > 3 && (
                          <Typography variant="caption">
                            ...and {Object.keys(pattern.aggregations).length - 3} more tables
                          </Typography>
                        )}
                      </Box>
                    </>
                  )}
                  
                  {pattern.formula && (
                    <>
                      <Typography variant="subtitle2" gutterBottom>
                        Formula:
                      </Typography>
                      <Typography variant="caption" component="div" sx={{ 
                        bgcolor: 'background.paper', 
                        p: 1, 
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'divider'
                      }}>
                        {pattern.formula}
                      </Typography>
                    </>
                  )}
                </CardContent>
              </Collapse>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default QueryPatterns;
