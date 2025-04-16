import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  TextField,
  IconButton,
  Tooltip,
  Button
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import TodayIcon from '@mui/icons-material/Today';
import DateRangeIcon from '@mui/icons-material/DateRange';

const DateRangePicker = ({ dateRange, setDateRange }) => {
  const today = new Date().toISOString().split('T')[0];
  
  // Calculate last 7 days, 30 days, 90 days, etc.
  const getDateDaysAgo = (days) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  };

  const handleStartDateChange = (e) => {
    setDateRange({
      ...dateRange,
      start_date: e.target.value
    });
  };

  const handleEndDateChange = (e) => {
    setDateRange({
      ...dateRange,
      end_date: e.target.value
    });
  };

  const setPresetRange = (startDate, endDate) => {
    setDateRange({
      start_date: startDate,
      end_date: endDate
    });
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Set Date Range
        <Tooltip title="Set a date range for your query. This will be used to filter results by date.">
          <IconButton size="small">
            <InfoIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Choose a date range for your query
        </Typography>
        
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Start Date"
              type="date"
              value={dateRange.start_date}
              onChange={handleStartDateChange}
              InputLabelProps={{
                shrink: true,
              }}
              InputProps={{
                startAdornment: <TodayIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              helperText="Results will include this date"
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="End Date"
              type="date"
              value={dateRange.end_date}
              onChange={handleEndDateChange}
              InputLabelProps={{
                shrink: true,
              }}
              InputProps={{
                startAdornment: <TodayIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              helperText="Results will exclude this date"
            />
          </Grid>
        </Grid>
        
        <Typography variant="subtitle2" gutterBottom>
          Quick Select
          <DateRangeIcon sx={{ ml: 1, verticalAlign: 'middle' }} />
        </Typography>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Button 
            variant="outlined" 
            size="small"
            onClick={() => setPresetRange(getDateDaysAgo(7), today)}
          >
            Last 7 Days
          </Button>
          <Button 
            variant="outlined" 
            size="small"
            onClick={() => setPresetRange(getDateDaysAgo(30), today)}
          >
            Last 30 Days
          </Button>
          <Button 
            variant="outlined" 
            size="small"
            onClick={() => setPresetRange(getDateDaysAgo(90), today)}
          >
            Last 90 Days
          </Button>
          <Button 
            variant="outlined" 
            size="small"
            onClick={() => setPresetRange(getDateDaysAgo(365), today)}
          >
            Last Year
          </Button>
          <Button 
            variant="outlined" 
            size="small"
            onClick={() => setPresetRange('', '')}
            color="error"
          >
            Clear
          </Button>
        </Box>
        
        <Box sx={{ mt: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Date range is optional. If you don't specify a date range, all dates will be included.
          </Typography>
          {dateRange.start_date && dateRange.end_date && (
            <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
              Selected range: {dateRange.start_date} to {dateRange.end_date}
            </Typography>
          )}
        </Box>
      </Paper>
      
      <Typography variant="subtitle2" color="text.secondary">
        Note: The query will use the format CONVERT(DATETIME, 'YYYY-MM-DD 00:00:00.000', 120) for date filtering.
      </Typography>
    </Box>
  );
};

export default DateRangePicker;
