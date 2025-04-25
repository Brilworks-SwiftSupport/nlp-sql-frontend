import React, { useMemo, memo, useEffect } from 'react';
import { Typography, Box, Checkbox, TextField, FormControlLabel } from '@mui/material';
import { Handle, Position } from 'reactflow';
import KeyIcon from '@mui/icons-material/VpnKey';
import ForeignKeyIcon from '@mui/icons-material/Link';
import SearchIcon from '@mui/icons-material/Search';

import {
  StyledNode,
  NodeHeader,
  ColumnList,
  KeyIconWrapper,
  StyledSearchBox,
  ColumnItem,
  ColumnContent,
  ColumnName,
  ColumnType
} from '../styles/StyledComponents';

/**
 * TableNode Component - Represents a database table in the VisualSchemaDesigner
 */
const TableNode = memo(({ data, id }) => {
  const { 
    label, 
    columns = [], 
    tableSelectedColumns = [], 
    onColumnSelect,
    activeSourceInfo,
    highlightedColumns,
    filterText = ''
  } = data;

  // Function to handle checkbox changes
  const handleChange = (event, columnName) => {
    const isForeignKey = columns.find(col => col.name === columnName).isForeignKey || 
                         (columnName.toLowerCase().includes('_id') && columnName.toLowerCase() !== 'id');
    const isChecked = event.target.checked;
    
    // If it's a foreign key and trying to uncheck, prevent the action
    if (isForeignKey && !isChecked) {
      return; // Don't allow unchecking foreign keys
    }
    
    onColumnSelect(id, columnName, isChecked);
  };

  // Helper: Determine if a column is a "key"
  const isKeyColumn = (col) => (
    col.isPrimaryKey || 
    col.isForeignKey || 
    (col.name.toLowerCase().includes('_id') && col.name.toLowerCase() !== 'id')
  );

  // Select/Deselect all non-key columns
  const handleBulkColumnSelect = (selectAll) => {
    const nonKeyColumns = columns.filter(col => !isKeyColumn(col));
    nonKeyColumns.forEach(col => {
      const alreadySelected = tableSelectedColumns.includes(col.name);
      if (selectAll && !alreadySelected) {
        onColumnSelect(id, col.name, true);
      } else if (!selectAll && alreadySelected) {
        onColumnSelect(id, col.name, false);
      }
    });
  };

  // Auto-select foreign keys (keeping this for consistency with existing behavior)
  useEffect(() => {
    const foreignKeys = columns.filter(
      col => (col.isForeignKey || col.name.toLowerCase().includes('_id') && col.name.toLowerCase() !== 'id') && 
              !tableSelectedColumns.includes(col.name)
    );
    
    foreignKeys.forEach(col => {
      onColumnSelect(id, col.name, true);
    });
  }, [columns, tableSelectedColumns, id, onColumnSelect]);

  // Compute "Select All" checkbox state
  const {
    allSelected,
    noneSelected,
    indeterminate
  } = useMemo(() => {
    const nonKeyColumns = columns.filter(col => !isKeyColumn(col));
    const selectedCount = nonKeyColumns.filter(col => tableSelectedColumns.includes(col.name)).length;

    return {
      allSelected: selectedCount === nonKeyColumns.length && selectedCount > 0,
      noneSelected: selectedCount === 0,
      indeterminate: selectedCount > 0 && selectedCount < nonKeyColumns.length,
    };
  }, [columns, tableSelectedColumns]);

  // Handle "Select All" checkbox toggle
  const handleSelectAllToggle = (event) => {
    handleBulkColumnSelect(event.target.checked);
  };

  // Sort columns: Primary Keys at top, then Foreign Keys, then selected, 
  // then the rest alphabetically
  const sortedColumns = useMemo(() => {
    return [...columns].sort((a, b) => {
      // Primary keys at the top
      if (a.isPrimaryKey && !b.isPrimaryKey) return -1;
      if (!a.isPrimaryKey && b.isPrimaryKey) return 1;

      // Foreign keys next
      const aIsForeignKey = a.isForeignKey || 
                           (a.name.toLowerCase().includes('_id') && a.name.toLowerCase() !== 'id');
      const bIsForeignKey = b.isForeignKey || 
                           (b.name.toLowerCase().includes('_id') && b.name.toLowerCase() !== 'id');
      if (aIsForeignKey && !bIsForeignKey) return -1;
      if (!aIsForeignKey && bIsForeignKey) return 1;

      // Selected columns next
      const aIsSelected = tableSelectedColumns.includes(a.name);
      const bIsSelected = tableSelectedColumns.includes(b.name);
      if (aIsSelected && !bIsSelected) return -1;
      if (!aIsSelected && bIsSelected) return 1;

      // Finally sort by column name
      return a.name.localeCompare(b.name);
    });
  }, [columns, tableSelectedColumns]);

  // Filter columns by the search text (if provided)
  const filteredColumns = useMemo(() => {
    if (!filterText) return sortedColumns;
    const lowercaseFilter = filterText.toLowerCase();
    return sortedColumns.filter(col => 
      col.name.toLowerCase().includes(lowercaseFilter) || 
      (col.type && col.type.toLowerCase().includes(lowercaseFilter))
    );
  }, [sortedColumns, filterText]);

  // Check if column is active source
  const isColumnActiveSource = (columnName) => {
    return activeSourceInfo &&
      activeSourceInfo.sourceNodeId === id &&
      activeSourceInfo.sourceColumnName === columnName;
  };

  // Check if handle is highlighted
  const isHandleHighlighted = (columnName) => {
    return highlightedColumns && 
      highlightedColumns[id] && 
      highlightedColumns[id].includes(columnName);
  };

  return (
    <StyledNode>
      <NodeHeader className="draggable-handle">
        <Typography variant="h6" fontSize={14} fontWeight="bold">
          {label}
        </Typography>
      </NodeHeader>
      
      {/* Search box for filtering columns */}
      <StyledSearchBox>
        <TextField
          placeholder="Search columns..."
          variant="outlined"
          size="small"
          fullWidth
          value={data.filterText || ''}
          onChange={(e) => data.onFilterChange(id, e.target.value)}
          InputProps={{
            startAdornment: (
              <SearchIcon sx={{ color: 'action.active', mr: 1 }} />
            ),
          }}
        />
      </StyledSearchBox>

      {/* Select All checkbox */}
      <Box sx={{ px: 1, py: 0.5 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={allSelected}
              indeterminate={indeterminate}
              onChange={handleSelectAllToggle}
              size="small"
            />
          }
          label="Select All"
        />
      </Box>
      
      <ColumnList>
        {filteredColumns.map((column) => {
          const isSelected = tableSelectedColumns.includes(column.name) || column.isPrimaryKey || column.isForeignKey;
          const isSource = isColumnActiveSource(column.name);
          const isHighlighted = isHandleHighlighted(column.name);
          
          return (
            <ColumnItem
              key={column.name}
              isSelected={isSelected}
              isHighlighted={isHighlighted}
              isSource={isSource}
              isPrimary={column.isPrimaryKey}
              isforeignkey={column.isForeignKey ? "true" : "false"}
            >
              {/* Source handle (right side) */}
              {isSelected && (
                <Handle
                  type="source"
                  position={Position.Right}
                  id={`${id}__${column.name}`}
                  style={{
                    width: isSource ? 16 : 12,
                    height: isSource ? 16 : 12,
                    backgroundColor: isSource ? '#f44336' : '#555',
                    border: isSource ? '2px solid #fff' : '1px solid #fff',
                    right: -6,
                    cursor: 'pointer',
                    zIndex: 100
                  }}
                  data-testid={`source-handle-${id}-${column.name}`}
                />
              )}
              
              {/* Target handle (left side) */}
              {isSelected && (
                <Handle
                  type="target"
                  position={Position.Left}
                  id={`${id}__${column.name}`}
                  style={{
                    width: isHighlighted ? 16 : 12,
                    height: isHighlighted ? 16 : 12,
                    backgroundColor: isHighlighted ? '#2196f3' : '#555',
                    border: isHighlighted ? '2px solid #fff' : '1px solid #fff',
                    left: -6,
                    cursor: 'pointer',
                    zIndex: 100
                  }}
                  data-testid={`target-handle-${id}-${column.name}`}
                />
              )}
              
              <ColumnContent>
                <Checkbox
                  checked={isSelected || column.isPrimaryKey || column.isForeignKey || (column.name.toLowerCase().includes('_id') && column.name.toLowerCase() !== 'id')}
                  onChange={(e) => handleChange(e, column.name)}
                  size="small"
                  // Disable checkbox for primary keys and foreign keys
                  disabled={column.isPrimaryKey || column.isForeignKey || (column.name.toLowerCase().includes('_id') && column.name.toLowerCase() !== 'id')}
                />
                
                <ColumnName>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {column.isPrimaryKey && (
                      <KeyIconWrapper>
                        <KeyIcon fontSize="inherit" />
                      </KeyIconWrapper>
                    )}
                    {column.isForeignKey && (
                      <KeyIconWrapper sx={{ color: '#1976d2' }}>
                        <ForeignKeyIcon fontSize="inherit" />
                      </KeyIconWrapper>
                    )}
                    <Typography variant="body2" component="span">
                      {column.name}
                    </Typography>
                  </Box>
                  <ColumnType>
                    {column.type}
                  </ColumnType>
                </ColumnName>
              </ColumnContent>
            </ColumnItem>
          );
        })}
      </ColumnList>
    </StyledNode>
  );
});

export default TableNode;
