import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button,
  CircularProgress,
  IconButton,
  Tooltip,
  Snackbar,
  Alert
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CodeIcon from '@mui/icons-material/Code';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import InfoIcon from '@mui/icons-material/Info';

// Code highlighting
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const QueryPreview = ({ sql, loading, onRunQuery }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyClick = () => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunQuery = () => {
    if (onRunQuery) {
      onRunQuery(sql);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Preview SQL Query
        <Tooltip title="This is the SQL query that will be executed based on your selections. You can copy it or run it directly.">
          <IconButton size="small">
            <InfoIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Typography>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : sql ? (
        <>
          <Paper sx={{ p: 0, mb: 2, position: 'relative' }}>
            <Box sx={{ position: 'absolute', top: 10, right: 10, zIndex: 1 }}>
              <Tooltip title="Copy SQL">
                <IconButton onClick={handleCopyClick} size="small" color="primary">
                  <ContentCopyIcon />
                </IconButton>
              </Tooltip>
            </Box>
            <SyntaxHighlighter 
              language="sql" 
              style={materialDark}
              customStyle={{
                borderRadius: '4px',
                fontSize: '14px',
                padding: '16px',
                maxHeight: '400px',
                overflow: 'auto'
              }}
              showLineNumbers
            >
              {sql}
            </SyntaxHighlighter>
          </Paper>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<CodeIcon />}
              onClick={handleCopyClick}
            >
              Copy SQL
            </Button>
            {onRunQuery && (
              <Button
                variant="contained"
                startIcon={<PlayArrowIcon />}
                onClick={handleRunQuery}
                color="primary"
              >
                Run Query
              </Button>
            )}
          </Box>
          
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2">
              Query Summary
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {sql.includes('UNION ALL') 
                ? `This query combines data from multiple tables using UNION ALL.` 
                : `This is a simple query from a single table.`}
            </Typography>
            
            {sql.includes('SUM(') || sql.includes('AVG(') || sql.includes('COUNT(') ? (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Includes aggregation functions to calculate totals or averages.
              </Typography>
            ) : null}
            
            {sql.toLowerCase().includes('where') ? (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Includes filters to narrow down the results.
              </Typography>
            ) : null}
            
            {sql.includes('CONVERT(DATETIME') ? (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Includes date filtering to limit results to a specific time period.
              </Typography>
            ) : null}
          </Box>
        </>
      ) : (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <CodeIcon sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.5 }} />
            <Typography variant="body1" color="text.secondary">
              Click "Generate SQL" to create your query based on your selections.
            </Typography>
          </Box>
        </Paper>
      )}
      
      <Snackbar
        open={copied}
        autoHideDuration={2000}
        onClose={() => setCopied(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setCopied(false)} severity="success" variant="filled">
          SQL copied to clipboard!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default QueryPreview;
