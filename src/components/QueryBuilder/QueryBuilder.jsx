import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Box, Typography, Paper, Stepper, Step, StepLabel, Button } from '@mui/material';
import TableSelector from './TableSelector';
import ColumnSelector from './ColumnSelector';
import RelationshipManager from './RelationshipManager';
import FilterBuilder from './FilterBuilder';
import DateRangePicker from './DateRangePicker';
import QueryPreview from './QueryPreview';
import QueryPatterns from './QueryPatterns';
import { getAuthToken } from '../../utils/auth';

const steps = [
  'Select Tables',
  'Select Columns',
  'Define Relationships',
  'Add Filters',
  'Set Date Range',
  'Preview Query'
];

const QueryBuilder = ({ connectionId, onQueryGenerated }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [tables, setTables] = useState([]);
  const [selectedTables, setSelectedTables] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState({});
  const [relationships, setRelationships] = useState([]);
  const [filters, setFilters] = useState([]);
  const [dateRange, setDateRange] = useState({
    start_date: '',
    end_date: ''
  });
  const [aggregations, setAggregations] = useState({});
  const [generatedQuery, setGeneratedQuery] = useState('');
  const [patterns, setPatterns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch available tables when component mounts
  useEffect(() => {
    fetchTables();
    fetchQueryPatterns();
  }, [connectionId]);

  const fetchTables = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/query-builder/tables?connection_id=${connectionId}`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      
      if (response.data.status === 'success') {
        setTables(response.data.tables);
      } else {
        setError(response.data.message || 'Failed to fetch tables');
      }
    } catch (err) {
      setError('Error fetching tables: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchQueryPatterns = async () => {
    try {
      const response = await axios.get(`/api/query-builder/patterns?connection_id=${connectionId}`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      
      if (response.data.status === 'success') {
        setPatterns(response.data.patterns);
      }
    } catch (err) {
      console.error('Error fetching query patterns:', err);
    }
  };

  const analyzeRelationships = async () => {
    try {
      setLoading(true);
      const response = await axios.post('/api/query-builder/relationships', {
        connection_id: connectionId,
        tables: selectedTables
      }, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      
      if (response.data.status === 'success') {
        // Combine defined and suggested relationships
        const allRelationships = [
          ...response.data.defined_relationships,
          ...response.data.suggested_relationships
        ];
        setRelationships(allRelationships);
      } else {
        setError(response.data.message || 'Failed to analyze relationships');
      }
    } catch (err) {
      setError('Error analyzing relationships: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const generateQuery = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const queryParams = {
        tables: selectedTables,
        columns: selectedColumns,
        relationships: relationships.filter(r => r.selected), // Only use selected relationships
        filters: filters,
        date_range: dateRange,
        aggregations: aggregations
      };
      
      const response = await axios.post('/api/query-builder/build', {
        connection_id: connectionId,
        query_params: queryParams
      }, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      
      if (response.data.status === 'success') {
        setGeneratedQuery(response.data.sql);
        if (onQueryGenerated) {
          onQueryGenerated(response.data.sql);
        }
      } else {
        setError(response.data.message || 'Failed to generate query');
      }
    } catch (err) {
      setError('Error generating query: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const applyQueryPattern = (pattern) => {
    setSelectedTables(pattern.default_tables || []);
    setAggregations(pattern.aggregations || {});
    
    // Set columns based on aggregations
    const newSelectedColumns = {};
    if (pattern.aggregations) {
      Object.keys(pattern.aggregations).forEach(tableName => {
        newSelectedColumns[tableName] = Object.keys(pattern.aggregations[tableName]);
      });
    }
    setSelectedColumns(newSelectedColumns);
    
    // Move to the relationships step
    setActiveStep(2);
    analyzeRelationships();
  };

  const handleNext = () => {
    if (activeStep === 1) {
      // When moving from columns to relationships, analyze relationships
      analyzeRelationships();
    } else if (activeStep === steps.length - 1) {
      // On the last step, generate the query
      generateQuery();
    }
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    setSelectedTables([]);
    setSelectedColumns({});
    setRelationships([]);
    setFilters([]);
    setDateRange({
      start_date: '',
      end_date: ''
    });
    setAggregations({});
    setGeneratedQuery('');
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <>
            <QueryPatterns 
              patterns={patterns} 
              onApplyPattern={applyQueryPattern} 
            />
            <TableSelector 
              tables={tables} 
              selectedTables={selectedTables} 
              setSelectedTables={setSelectedTables} 
              highlightedTables={[]} 
            />
          </>
        );
      case 1:
        return (
          <ColumnSelector 
            connectionId={connectionId}
            selectedTables={selectedTables}
            selectedColumns={selectedColumns}
            setSelectedColumns={setSelectedColumns}
            aggregations={aggregations}
            setAggregations={setAggregations}
            importantColumns={[]} 
            keyColumns={[]} 
          />
        );
      case 2:
        return (
          <RelationshipManager 
            relationships={relationships}
            setRelationships={setRelationships}
          />
        );
      case 3:
        return (
          <FilterBuilder 
            connectionId={connectionId}
            selectedTables={selectedTables}
            filters={filters}
            setFilters={setFilters}
          />
        );
      case 4:
        return (
          <DateRangePicker 
            dateRange={dateRange}
            setDateRange={setDateRange}
          />
        );
      case 5:
        return (
          <QueryPreview 
            sql={generatedQuery}
            loading={loading}
          />
        );
      default:
        return 'Unknown step';
    }
  };

  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Query Builder
        </Typography>
        {error && (
          <Box sx={{ mb: 2, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
            <Typography color="error">{error}</Typography>
          </Box>
        )}
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        <Box sx={{ mt: 4, mb: 4, minHeight: '300px' }}>
          {getStepContent(activeStep)}
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          {activeStep !== 0 && (
            <Button 
              variant="outlined" 
              onClick={handleBack} 
              sx={{ mr: 1 }}
              disabled={loading}
            >
              Back
            </Button>
          )}
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={loading || 
              (activeStep === 0 && selectedTables.length === 0) ||
              (activeStep === 1 && Object.keys(selectedColumns).length === 0) ||
              (activeStep === 5) // Disable on last step after generation
            }
          >
            {activeStep === steps.length - 1 ? 'Generate SQL' : 'Next'}
          </Button>
          {activeStep === steps.length - 1 && (
            <Button 
              variant="outlined" 
              onClick={handleReset} 
              sx={{ ml: 1 }}
              disabled={loading}
            >
              Start New Query
            </Button>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default QueryBuilder;
