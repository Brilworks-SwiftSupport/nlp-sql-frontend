import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  ReactFlow, 
  ReactFlowProvider, 
  Background, 
  Controls, 
  ConnectionLineType, 
  useNodesState, 
  useEdgesState, 
  MarkerType 
} from 'reactflow';
import 'reactflow/dist/style.css';
import { 
  Typography, 
  Box, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  DialogContentText,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  Paper
} from '@mui/material';

// Import our custom components
import TableNode from './components/TableNode';
import CustomEdge from './components/CustomEdge';

// Import utility functions
import {
  isAdSpendTable,
  getTableColumnsData,
  identifyPotentialForeignKeys,
  checkColumnCompatibility
} from './utils/schemaUtils';

// Define node types for ReactFlow
const nodeTypes = {
  tableNode: TableNode,
};

// Define edge types for ReactFlow
const edgeTypes = {
  custom: CustomEdge,
};

/**
 * Main Visual Schema Designer Component
 */
const VisualSchemaDesigner = ({ 
  schema = {}, 
  selectedTables = [], 
  selectedColumns = {}, 
  relationships = [], 
  onSelectedColumnsChange, 
  onRelationshipsChange,
  connectionId,
  initialRelationships = []
}) => {
  // Add this useEffect near the top of the component
  useEffect(() => {
    const handleForceUpdate = (event) => {
      const { selectedColumns } = event.detail;
      
      // Update the internal state
      setTableSelectedColumns(selectedColumns);
      
      // Update the nodes to reflect the new selections
      setNodes(nodes => 
        nodes.map(node => ({
          ...node,
          data: {
            ...node.data,
            tableSelectedColumns: selectedColumns[node.id] || []
          }
        }))
      );
    };

    // Add event listener
    window.addEventListener('forceUpdateColumns', handleForceUpdate);

    // Cleanup
    return () => {
      window.removeEventListener('forceUpdateColumns', handleForceUpdate);
    };
  }, []);

  // Make sure this useEffect is also present to handle prop changes
  useEffect(() => {
    if (selectedColumns) {
      setTableSelectedColumns(selectedColumns);
    }
  }, [selectedColumns]);

  // Convert relationships to consistent format with the expected property names
  const normalizeRelationships = useCallback((rels) => {
    if (!rels || !Array.isArray(rels)) return [];
    
    // First convert all relationships to a consistent format
    const normalized = rels.map(rel => {
      // If relationship uses snake_case properties, convert them to camelCase
      if ('source_table' in rel) {
        return {
          sourceTable: rel.source_table,
          sourceColumn: rel.source_column,
          targetTable: rel.target_table,
          targetColumn: rel.target_column,
          type: rel.relationship_type || 'one-to-one'
        };
      } 
      // Already in the right format
      return rel;
    });
    
    // Validate relationships against selected tables
    const validRelationships = normalized.filter(rel => {
      const sourceTableExists = selectedTables.includes(rel.sourceTable);
      const targetTableExists = selectedTables.includes(rel.targetTable);
      
      if (!sourceTableExists || !targetTableExists) {
        console.warn(`Invalid relationship: ${rel.sourceTable} -> ${rel.targetTable} (Table(s) not in selected tables)`);
        return false;
      }
      
      return true;
    });
    
    // Create a Map to track relationships with their canonical representation
    const relationshipMap = new Map();
    
    // Process each relationship and add to map if it's new
    validRelationships.forEach(rel => {
      // Create both directional keys to catch duplicates regardless of source/target ordering
      const forwardKey = `${rel.sourceTable}.${rel.sourceColumn}=>${rel.targetTable}.${rel.targetColumn}`;
      const reverseKey = `${rel.targetTable}.${rel.targetColumn}=>${rel.sourceTable}.${rel.sourceColumn}`;
      
      // Check if we've seen this relationship in either direction
      if (!relationshipMap.has(forwardKey) && !relationshipMap.has(reverseKey)) {
        relationshipMap.set(forwardKey, rel);
      }
    });
    
    // Convert map values back to array
    const uniqueRelationships = Array.from(relationshipMap.values());
    
    console.log(`Normalized ${rels.length} relationships to ${uniqueRelationships.length} unique relationships`);
    return uniqueRelationships;
  }, []);

  // Normalize the relationships array for consistent format
  const [normalizedRelationships, setNormalizedRelationships] = useState([]);

  // References and state management
  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [activeSourceInfo, setActiveSourceInfo] = useState(null);
  const [relationshipType, setRelationshipType] = useState('one-to-one');
  const [isSaving, setIsSaving] = useState(false);
  const [relationshipDialogOpen, setRelationshipDialogOpen] = useState(false);
  const [addingRelationship, setAddingRelationship] = useState(false);
  const [tableSelectedColumns, setTableSelectedColumns] = useState(selectedColumns || {});
  const [highlightedColumns, setHighlightedColumns] = useState({});
  const [currentRelationship, setCurrentRelationship] = useState(null);
  const [searchFilters, setSearchFilters] = useState({});
  // Add state for error handling
  const [errorMessage, setErrorMessage] = useState('');
  const [duplicateRelationships, setDuplicateRelationships] = useState([]);

  // Create a unique storage key using connectionId
  const STORAGE_KEY = `visual-schema-positions-${connectionId || 'default'}`;

  // Save node positions to localStorage
  const savePositionsToStorage = useCallback((nodesToSave) => {
    if (!nodesToSave || !nodesToSave.length) return;

    try {
      const positions = {};

      nodesToSave.forEach(node => {
        if (node.position) {
          positions[node.id] = node.position;
        }
      });

      localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
      console.log('Saved positions to localStorage:', positions);
    } catch (error) {
      console.error('Error saving positions:', error);
    }
  }, [STORAGE_KEY]);

  // Load node positions from localStorage
  const loadPositionsFromStorage = useCallback(() => {
    try {
      const savedPositions = localStorage.getItem(STORAGE_KEY);
      if (savedPositions) {
        return JSON.parse(savedPositions);
      }
    } catch (error) {
      console.error('Error loading positions:', error);
    }
    return {};
  }, [STORAGE_KEY]);

  // Save relationships to localStorage
  const saveRelationshipsToStorage = useCallback((rels = relationships) => {
    if (!connectionId || !rels || !rels.length) return;
    
    try {
      console.log('Saving relationships to localStorage:', rels);
      
      // Ensure all relationships are in snake_case format for storage
      const formattedRels = rels.map(rel => {
        if ('sourceTable' in rel) {
          return {
            source_table: rel.sourceTable,
            source_column: rel.sourceColumn,
            target_table: rel.targetTable,
            target_column: rel.targetColumn,
            relationship_type: rel.type || 'one-to-one'
          };
        }
        return rel;
      });
      
      const storageKey = `visual-schema-relationships-${connectionId}`;
      localStorage.setItem(storageKey, JSON.stringify(formattedRels));
      console.log('Successfully saved relationships to localStorage');
    } catch (err) {
      console.error('Error saving relationships to localStorage:', err);
    }
  }, [connectionId, relationships]);

  // Load relationships from localStorage
  const loadRelationshipsFromStorage = useCallback(() => {
    if (!connectionId) return [];
    
    try {
      const storageKey = `visual-schema-relationships-${connectionId}`;
      const storedRelationships = localStorage.getItem(storageKey);
      
      if (storedRelationships) {
        const parsed = JSON.parse(storedRelationships);
        console.log('Loaded relationships from localStorage:', parsed);
        return parsed;
      }
    } catch (err) {
      console.error('Error loading relationships from localStorage:', err);
    }
    
    return [];
  }, [connectionId]);

  // Helper function to create a unique edge ID
  const createEdgeId = useCallback((sourceTable, sourceColumn, targetTable, targetColumn) => {
    return `${sourceTable}__${sourceColumn}->${targetTable}__${targetColumn}`;
  }, []);

  // Helper function to parse an edge ID back into components
  const parseEdgeId = useCallback((edgeId) => {
    try {
      // Split on the -> delimiter
      const [source, target] = edgeId.split('->');
      if (!source || !target) {
        console.error('Invalid edge ID format:', edgeId);
        return [null, null, null, null];
      }
      
      // Split the source and target parts
      const [sourceTable, sourceColumn] = source.split('__');
      const [targetTable, targetColumn] = target.split('__');
      
      return [sourceTable, sourceColumn, targetTable, targetColumn];
    } catch (err) {
      console.error('Error parsing edge ID:', edgeId, err);
      return [null, null, null, null];
    }
  }, []);

  // Function to convert relationship arrays to strings for comparison
  const relationshipToString = useCallback((rel) => {
    if ('sourceTable' in rel) {
      return `${rel.sourceTable}~${rel.sourceColumn}~${rel.targetTable}~${rel.targetColumn}`;
    }
    return `${rel.source_table}~${rel.source_column}~${rel.target_table}~${rel.target_column}`;
  }, []);
  
  // Filter out duplicate relationships from an array
  const filterDuplicateRelationships = useCallback((rels) => {
    if (!rels || !Array.isArray(rels)) return [];
    
    const uniqueRelMap = new Map();
    
    rels.forEach(rel => {
      const key = relationshipToString(rel);
      uniqueRelMap.set(key, rel);
    });
    
    return Array.from(uniqueRelMap.values());
  }, [relationshipToString]);

  // Helper to create edges from relationships
  const createEdgeFromRelationship = useCallback((relationship) => {
    try {
      let sourceTable, sourceColumn, targetTable, targetColumn, type;
      
      // Handle both camelCase and snake_case formats
      if ('sourceTable' in relationship) {
        sourceTable = relationship.sourceTable;
        sourceColumn = relationship.sourceColumn;
        targetTable = relationship.targetTable;
        targetColumn = relationship.targetColumn;
        type = relationship.type || 'one-to-one';
      } else {
        sourceTable = relationship.source_table;
        sourceColumn = relationship.source_column;
        targetTable = relationship.target_table;
        targetColumn = relationship.target_column;
        type = relationship.relationship_type || 'one-to-one';
      }
      
      const sourceHandle = `${sourceTable}__${sourceColumn}`;
      const targetHandle = `${targetTable}__${targetColumn}`;
      const edgeId = createEdgeId(sourceTable, sourceColumn, targetTable, targetColumn);
      
      // Find the source and target nodes to get their positions
      const sourceNode = nodes.find(node => node.id === sourceTable);
      const targetNode = nodes.find(node => node.id === targetTable);
      
      if (!sourceNode || !targetNode) {
        console.warn(`Cannot create edge - missing nodes: ${sourceTable} or ${targetTable}`);
        return null;
      }
      
      console.log(`Creating edge: ${edgeId} with type ${type}`);
      
      return {
        id: edgeId,
        source: sourceTable,
        target: targetTable,
        sourceHandle,
        targetHandle,
        type: 'custom', // Use 'custom' to match our edgeTypes
        data: { 
          relationshipType: type,
          sourceColumn,
          targetColumn
        },
        animated: false,
        style: { strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20
        }
      };
    } catch (error) {
      console.error('Error creating edge from relationship:', error, relationship);
      return null;
    }
  }, [createEdgeId, nodes]);

  // Handle add relationship manually rather than depending on normalized state changes
  const handleAddRelationship = useCallback((newRelationship) => {
    // Check for duplicates before adding
    const isDuplicate = normalizedRelationships.some(rel => {
      // Create keys for comparison in both directions
      const newForwardKey = `${newRelationship.sourceTable}.${newRelationship.sourceColumn}=>${newRelationship.targetTable}.${newRelationship.targetColumn}`;
      const newReverseKey = `${newRelationship.targetTable}.${newRelationship.targetColumn}=>${newRelationship.sourceTable}.${newRelationship.sourceColumn}`;
      
      const existingForwardKey = `${rel.sourceTable}.${rel.sourceColumn}=>${rel.targetTable}.${rel.targetColumn}`;
      const existingReverseKey = `${rel.targetTable}.${rel.targetColumn}=>${rel.sourceTable}.${rel.sourceColumn}`;
      
      return (newForwardKey === existingForwardKey || newForwardKey === existingReverseKey || 
              newReverseKey === existingForwardKey || newReverseKey === existingReverseKey);
    });
    
    if (isDuplicate) {
      // Show error message
      setErrorMessage('Cannot add duplicate relationship');
      setDuplicateRelationships([
        `${newRelationship.sourceTable}.${newRelationship.sourceColumn} => ${newRelationship.targetTable}.${newRelationship.targetColumn}`
      ]);
      return;
    }

    if (!selectedTables.includes(newRelationship.sourceTable) || !selectedTables.includes(newRelationship.targetTable)) {
      console.warn(`Cannot add relationship - tables not in selected tables: ${newRelationship.sourceTable} -> ${newRelationship.targetTable}`);
      return;
    }
    
    // Clear any existing error
    setErrorMessage('');
    setDuplicateRelationships([]);
    
    // Add to normalized state directly, but ensure deduplication
    setNormalizedRelationships(prev => {
      // First add the new relationship
      const updatedRelationships = [...prev, newRelationship];
      // Then normalize to deduplicate (this uses our improved deduplication logic)
      return normalizeRelationships(updatedRelationships);
    });
    
    // Create edge for immediate feedback
    if (reactFlowInstance) {
      const edge = createEdgeFromRelationship(newRelationship);
      if (edge) {
        // Update edges with deduplication check as well
        setEdges(eds => {
          const newEdgeId = edge.id;
          // Filter out any existing edge with the same ID before adding new one
          const filteredEdges = eds.filter(e => e.id !== newEdgeId);
          return [...filteredEdges, edge];
        });
      }
    }
  }, [createEdgeFromRelationship, reactFlowInstance, normalizeRelationships, normalizedRelationships]);

  // Handle completing relationship creation
  const handleCompletedRelationship = useCallback((sourceTable, sourceColumn, targetTable, targetColumn, type = 'one-to-one') => {
    console.log('Creating relationship:', sourceTable, sourceColumn, targetTable, targetColumn, type);
    setAddingRelationship(false);
    setActiveSourceInfo(null);
    setHighlightedColumns({});
    
    // Format the new relationship
    const newRelationship = {
      sourceTable,
      sourceColumn,
      targetTable,
      targetColumn,
      type
    };
    
    // Convert to snake_case format for parent component
    const formattedRelationship = {
      source_table: sourceTable,
      source_column: sourceColumn,
      target_table: targetTable,
      target_column: targetColumn,
      relationship_type: type
    };
    
    // Check if this relationship already exists
    const exists = relationships.some(rel => {
      if ('sourceTable' in rel) {
        return (
          rel.sourceTable === sourceTable &&
          rel.sourceColumn === sourceColumn &&
          rel.targetTable === targetTable &&
          rel.targetColumn === targetColumn
        );
      } else {
        return (
          rel.source_table === sourceTable &&
          rel.source_column === sourceColumn &&
          rel.target_table === targetTable &&
          rel.target_column === targetColumn
        );
      }
    });
    
    if (!exists) {
      // Create the edge for immediate visual feedback
      const edgeId = createEdgeId(sourceTable, sourceColumn, targetTable, targetColumn);
      const newEdge = {
        id: edgeId,
        source: sourceTable,
        target: targetTable,
        sourceHandle: `${sourceTable}__${sourceColumn}`,
        targetHandle: `${targetTable}__${targetColumn}`,
        type: 'custom', // Use 'custom' to match our edgeTypes
        data: { relationshipType: type },
        animated: false,
        style: { strokeWidth: 2 }
      };
      
      // Add edge to the diagram
      setEdges(eds => [...eds, newEdge]);
      
      // Add the new relationship using the parent component's expected format
      const updatedRelationships = [...relationships, formattedRelationship];
      console.log('Updating relationships with new relationship:', updatedRelationships);
      
      // Use our direct relationship handler instead of state updates
      handleAddRelationship(newRelationship);
      
      if (onRelationshipsChange) {
        onRelationshipsChange(updatedRelationships);
      }
      
      // Save to localStorage
      saveRelationshipsToStorage(updatedRelationships);
    }
  }, [relationships, onRelationshipsChange, createEdgeId, setEdges, saveRelationshipsToStorage, handleAddRelationship]);

  // Update column selections when relationships change
  const updateColumnSelectionsForRelationships = useCallback(() => {
    if (!normalizedRelationships.length || !nodes.length) return;
    
    console.log('Updating column selections for relationships');
    
    // First, make sure all necessary columns are selected
    const updatedSelectedColumns = { ...tableSelectedColumns };
    let selectionChanged = false;
    
    normalizedRelationships.forEach(rel => {
      const { sourceTable, sourceColumn, targetTable, targetColumn } = rel;
      
      // Make sure tables exist in nodes
      const sourceNodeExists = nodes.some(node => node.id === sourceTable);
      const targetNodeExists = nodes.some(node => node.id === targetTable);
      
      if (!sourceNodeExists || !targetNodeExists) {
        console.warn(`Tables in relationship not found in nodes: ${sourceTable} -> ${targetTable}`);
        return;
      }
      
      // Make sure source column is selected
      if (!updatedSelectedColumns[sourceTable]) {
        updatedSelectedColumns[sourceTable] = [];
      }
      if (!updatedSelectedColumns[sourceTable].includes(sourceColumn)) {
        updatedSelectedColumns[sourceTable] = [...updatedSelectedColumns[sourceTable], sourceColumn];
        console.log(`Auto-selecting source column: ${sourceTable}.${sourceColumn}`);
        selectionChanged = true;
      }
      
      // Make sure target column is selected
      if (!updatedSelectedColumns[targetTable]) {
        updatedSelectedColumns[targetTable] = [];
      }
      if (!updatedSelectedColumns[targetTable].includes(targetColumn)) {
        updatedSelectedColumns[targetTable] = [...updatedSelectedColumns[targetTable], targetColumn];
        console.log(`Auto-selecting target column: ${targetTable}.${targetColumn}`);
        selectionChanged = true;
      }
    });
    
    // Update column selections if needed
    if (selectionChanged) {
      console.log('Updating column selections:', updatedSelectedColumns);
      setTableSelectedColumns(updatedSelectedColumns);
      
      // Update the nodes to reflect the new column selections
      setNodes(nodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          tableSelectedColumns: updatedSelectedColumns[node.id] || []
        }
      })));
      // Propagate changes to parent
      if (onSelectedColumnsChange) {
        onSelectedColumnsChange(updatedSelectedColumns);
      }
    }
    
    return selectionChanged;
  }, [normalizedRelationships, nodes, tableSelectedColumns, setNodes]);

  // Handle filter change for table column search
  const handleFilterChange = useCallback((nodeId, filterText) => {
    setSearchFilters(prev => ({
      ...prev,
      [nodeId]: filterText
    }));
    
    setNodes(prevNodes => 
      prevNodes.map(node => 
        node.id === nodeId 
          ? {
              ...node,
              data: {
                ...node.data,
                filterText
              }
            }
          : node
      )
    );
  }, [setNodes]);

  // Handle column selection changes
  const handleColumnSelect = useCallback((tableId, columnName, isSelected) => {
    console.log(`Column selection: ${tableId}.${columnName} = ${isSelected}`);
    
    // Update internal state
    setTableSelectedColumns(prev => {
      const tableCols = prev[tableId] || [];
      
      if (isSelected && !tableCols.includes(columnName)) {
        // Add column to selection
        return {
          ...prev,
          [tableId]: [...tableCols, columnName]
        };
      } else if (!isSelected && tableCols.includes(columnName)) {
        // Remove column from selection
        return {
          ...prev,
          [tableId]: tableCols.filter(col => col !== columnName)
        };
      }
      
      return prev;
    });
    
    // Update node data
    setNodes(nodes => 
      nodes.map(node => {
        if (node.id === tableId) {
          const tableSelectedCols = node.data.tableSelectedColumns || [];
          
          const updatedCols = isSelected
            ? [...tableSelectedCols, columnName] // Add column
            : tableSelectedCols.filter(col => col !== columnName); // Remove column
          
          return {
            ...node,
            data: {
              ...node.data,
              tableSelectedColumns: updatedCols
            }
          };
        }
        return node;
      })
    );
    
    // Notify parent if necessary
    if (onSelectedColumnsChange) {
      // Build updated selected columns for all tables
      setTableSelectedColumns(prev => {
        const newSelectedColumns = { ...prev };
        
        if (isSelected) {
          // Add the column
          if (!newSelectedColumns[tableId]) {
            newSelectedColumns[tableId] = [];
          }
          if (!newSelectedColumns[tableId].includes(columnName)) {
            newSelectedColumns[tableId] = [...newSelectedColumns[tableId], columnName];
          }
        } else {
          // Remove the column
          if (newSelectedColumns[tableId]) {
            newSelectedColumns[tableId] = newSelectedColumns[tableId].filter(
              col => col !== columnName
            );
          }
        }
        
        // Notify parent component
        onSelectedColumnsChange(newSelectedColumns);
        
        return newSelectedColumns;
      });
    }
  }, [onSelectedColumnsChange]);

  // Function to create initial nodes (tables) from the schema
  const createNodesFromSchema = useCallback(() => {
    if (!schema || !selectedTables || selectedTables.length === 0) return [];
    
    try {
      // Load saved positions
      const savedPositions = loadPositionsFromStorage();
      
      // Calculate default positions based on grid layout
      const defaultPositions = {};
      const tableCount = selectedTables.length;
      const gridRows = Math.ceil(Math.sqrt(tableCount));
      const gridCols = Math.ceil(tableCount / gridRows);
      const horizontalSpacing = 400;
      const verticalSpacing = 500;
      
      selectedTables.forEach((tableName, index) => {
        if (!tableName) return; // Skip null/undefined table names
        
        const row = Math.floor(index / gridCols);
        const col = index % gridCols;
        defaultPositions[tableName] = {
          x: col * horizontalSpacing + 50,
          y: row * verticalSpacing + 50
        };
      });
      
      // Create nodes with saved or default positions
      const nodes = selectedTables
        .filter(tableName => !!tableName && schema[tableName]) // Only process valid tables that exist in schema
        .map(tableName => {
          const position = savedPositions[tableName] || defaultPositions[tableName] || { x: 0, y: 0 }; // Fallback position
          
          // Get table schema and enhance with foreign key detection
          const tableSchema = schema[tableName];
          if (!tableSchema) {
            console.warn(`Table schema not found for ${tableName}`);
            return null;
          }
          
          const enhancedTableSchema = tableSchema 
            ? identifyPotentialForeignKeys(tableSchema) 
            : null;
          
          // Get columns for the table
          const columns = enhancedTableSchema 
            ? getTableColumnsData(schema, tableName) 
            : [];
          
          // Enhance columns with foreign key info
          const columnsWithForeignKeys = columns.map(col => ({
            ...col,
            isForeignKey: col.isForeignKey || 
                        (col.name && col.name.toLowerCase().includes('_id') && col.name.toLowerCase() !== 'id')
          }));
          
          return {
            id: tableName,
            type: 'tableNode',
            position,
            draggable: true,
            data: {
              label: tableName,
              columns: columnsWithForeignKeys,
              tableSelectedColumns: (tableSelectedColumns[tableName] || []),
              onColumnSelect: handleColumnSelect,
              activeSourceInfo,
              highlightedColumns,
              onFilterChange: handleFilterChange,
              filterText: (searchFilters[tableName] || '')
            },
            className: isAdSpendTable(tableName) ? 'ad-spend-node' : ''
          };
        })
        .filter(Boolean); // Filter out any null nodes
        
      return nodes;
    } catch (error) {
      console.error('Error creating nodes from schema:', error);
      return []; // Return empty nodes array on error
    }
  }, [
    schema, 
    selectedTables, 
    loadPositionsFromStorage, 
    tableSelectedColumns, 
    activeSourceInfo, 
    highlightedColumns, 
    handleFilterChange,
    searchFilters,
    handleColumnSelect
  ]);

  // Effect to update column selections for relationships
  useEffect(() => {
    if (nodes.length > 0 && normalizedRelationships.length > 0) {
      // Update column selections
      updateColumnSelectionsForRelationships();
    }
  }, [nodes, normalizedRelationships.length, updateColumnSelectionsForRelationships]);

  // Effect to initialize nodes and relationships on mount
  useEffect(() => {
    // Initialize the diagram with nodes from schema and selected tables
    if (Object.keys(schema).length > 0 && selectedTables.length > 0) {
      console.log('Schema data received:', schema);
      console.log('Selected tables:', selectedTables);
      const initialNodes = createNodesFromSchema();
      console.log('Created nodes:', initialNodes);
      setNodes(initialNodes);
    }
    
    // Initialize relationships after a short delay to ensure nodes are ready
    if (relationships && relationships.length > 0) {
      setTimeout(() => {
        const normalized = normalizeRelationships(relationships);
        setNormalizedRelationships(normalized);
        console.log('Relationships initialized:', normalized.length);
      }, 500);
    }
  }, [schema, selectedTables, createNodesFromSchema, relationships, normalizeRelationships]);

  // Create edges from relationships once nodes and relationships are ready
  useEffect(() => {
    if (normalizedRelationships.length > 0 && nodes.length > 0 && reactFlowInstance) {
      // Add edges with delay to ensure nodes are fully rendered
      setTimeout(() => {
        try {
          // Create edges from relationships
          const edges = normalizedRelationships
            .map(createEdgeFromRelationship)
            .filter(Boolean);
            
          console.log('Setting edges from relationships:', edges.length);
          setEdges(prev => {
            // Keep non-relationship edges
            const nonRelationshipEdges = prev.filter(e => e.type !== 'custom');
            return [...nonRelationshipEdges, ...edges];
          });
          
          // Also ensure columns in relationships are selected
          updateColumnSelectionsForRelationships();
        } catch (error) {
          console.error('Error setting edges from relationships:', error);
        }
      }, 800);
    }
  }, [normalizedRelationships, nodes.length, reactFlowInstance, createEdgeFromRelationship, updateColumnSelectionsForRelationships]);

  // Handle edge deletion
  const handleEdgeDelete = useCallback((edgeId) => {
    console.log('Deleting edge:', edgeId);
    
    // Parse the edge ID to get relationship details
    const [sourceTable, sourceColumn, targetTable, targetColumn] = parseEdgeId(edgeId);
    
    // Remove the edge from the diagram
    setEdges(edges => edges.filter(edge => edge.id !== edgeId));
    
    // Remove the relationship from relationships state
    if (onRelationshipsChange) {
      // Need to handle both formats (camelCase and snake_case) when filtering
      const updatedRelationships = relationships.filter(rel => {
        if ('sourceTable' in rel) {
          return !(
            rel.sourceTable === sourceTable &&
            rel.sourceColumn === sourceColumn &&
            rel.targetTable === targetTable &&
            rel.targetColumn === targetColumn
          );
        } else {
          return !(
            rel.source_table === sourceTable &&
            rel.source_column === sourceColumn &&
            rel.target_table === targetTable &&
            rel.target_column === targetColumn
          );
        }
      });
      
      console.log('Updated relationships after delete:', updatedRelationships);
      onRelationshipsChange(updatedRelationships);
    }
  }, [setEdges, onRelationshipsChange, relationships]);

  // Handle connection creation
  const handleConnect = useCallback((connectionParams) => {
    const sourceHandleId = connectionParams.sourceHandle;
    const targetHandleId = connectionParams.targetHandle;
    
    if (!sourceHandleId || !targetHandleId) {
      console.error('Invalid connection: missing handle IDs');
      return;
    }
    
    console.log('Creating connection:', connectionParams);
    
    // Extract table and column from handle IDs
    const [sourceTable, sourceColumn] = sourceHandleId.split('__');
    const [targetTable, targetColumn] = targetHandleId.split('__');
    
    if (!sourceTable || !sourceColumn || !targetTable || !targetColumn) {
      console.error('Invalid handle format:', sourceHandleId, targetHandleId);
      return;
    }
    
    // Check if trying to connect to same table
    if (sourceTable === targetTable) {
      console.log('Cannot connect columns in the same table');
      return;
    }
    
    // Set relationship information for dialog or auto-creation
    setCurrentRelationship({
      sourceTable,
      sourceColumn,
      targetTable,
      targetColumn,
      edgeId: createEdgeId(sourceTable, sourceColumn, targetTable, targetColumn),
      connectionParams
    });
    
    // Default relationship type 
    setRelationshipType('one-to-one');
    
    // Open the type selection dialog
    setRelationshipDialogOpen(true);
  }, [createEdgeId]);

  // Add a new relationship from dialog
  const addRelationship = useCallback(() => {
    if (!currentRelationship) {
      console.error('No current relationship set');
      return;
    }
    
    const {
      sourceTable,
      sourceColumn,
      targetTable,
      targetColumn,
    } = currentRelationship;
    
    console.log('Adding relationship with type:', relationshipType);
    console.log('Relationship details:', currentRelationship);
    
    // Set adding flag to prevent double-clicks
    setAddingRelationship(true);
    
    // Close the dialog
    setRelationshipDialogOpen(false);
    
    // Use the handleCompletedRelationship function to ensure proper format conversion
    handleCompletedRelationship(sourceTable, sourceColumn, targetTable, targetColumn, relationshipType);
    
    // Reset states after adding
    setRelationshipType('one-to-one');
    setCurrentRelationship(null);
    setAddingRelationship(false);
  }, [currentRelationship, relationshipType, handleCompletedRelationship]);

  // Function to handle when a node is dragged to a new position
  const onNodeDragStop = useCallback(() => {
    if (reactFlowInstance) {
      const currentNodes = reactFlowInstance.getNodes();
      savePositionsToStorage(currentNodes);
      
      // Re-render edges to ensure they're properly positioned after node movement
      if (normalizedRelationships && normalizedRelationships.length > 0) {
        // Recreate edges from normalized relationships to ensure they're correctly attached
        const updatedEdges = normalizedRelationships
          .map(createEdgeFromRelationship)
          .filter(Boolean);
        
        setEdges(updatedEdges);
      }
    }
  }, [reactFlowInstance, savePositionsToStorage, normalizedRelationships, createEdgeFromRelationship]);

  // Function to handle ReactFlow initialization
  const onInit = useCallback((instance) => {
    setReactFlowInstance(instance);
  }, []);

  return (
    <Box sx={{ 
      height: '800px', 
      width: '100%',
      border: '1px solid #ccc',
      borderRadius: '4px',
      overflow: 'hidden'
    }}>
      {/* Error message display for duplicate relationships */}
      {errorMessage && (
        <Paper 
          elevation={3} 
          sx={{ 
            position: 'absolute', 
            top: 10, 
            left: '50%', 
            transform: 'translateX(-50%)', 
            zIndex: 1000, 
            width: '80%', 
            maxWidth: '800px',
            padding: 2,
            backgroundColor: '#FFF9F9',
            borderLeft: '4px solid #F44336'
          }}
        >
          <Typography variant="h6" color="error" gutterBottom>
            Error: {errorMessage}
          </Typography>
          {duplicateRelationships.length > 0 && (
            <>
              <Typography variant="body1" gutterBottom>
                The following duplicate relationships were detected:
              </Typography>
              <Box component="ul" sx={{ pl: 2 }}>
                {duplicateRelationships.map((rel, idx) => (
                  <Typography component="li" key={idx} sx={{ mb: 0.5 }}>
                    {rel}
                  </Typography>
                ))}
              </Box>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Tips: 
                <ul>
                  <li>Relationships must be unique - you cannot connect the same columns multiple times</li>
                  <li>Relationships are bidirectional - A→B and B→A are considered duplicates</li>
                  <li>Remove one of the duplicate relationships to proceed</li>
                </ul>
              </Typography>
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button 
                  variant="outlined" 
                  color="error" 
                  onClick={() => {
                    setErrorMessage('');
                    setDuplicateRelationships([]);
                  }}
                >
                  Dismiss
                </Button>
              </Box>
            </>
          )}
        </Paper>
      )}
      
      <div ref={reactFlowWrapper} style={{ width: '100%', height: '100%' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={handleConnect}
          onInit={onInit}
          onNodeDragStop={onNodeDragStop}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultZoom={0.8}
          minZoom={0.2}
          maxZoom={1.5}
          fitView
          attributionPosition="bottom-left"
          connectionLineType={ConnectionLineType.Bezier}
          connectionLineStyle={{ stroke: '#aaa', strokeWidth: 2 }}
          deleteKeyCode={['Backspace', 'Delete']}
          snapToGrid
          snapGrid={[15, 15]}
          onNodesDelete={(nodes) => console.log('Nodes deleted:', nodes)}
          onEdgesDelete={(edges) => console.log('Edges deleted:', edges)}
          elevateEdgesOnSelect={true}
        >
          <Background color="#f5f5f5" gap={16} variant="dots" />
          <Controls />
        </ReactFlow>
      </div>
      
      {/* Relationship Type Dialog */}
      <Dialog 
        open={relationshipDialogOpen} 
        onClose={() => {
          setRelationshipDialogOpen(false);
          setCurrentRelationship(null);
        }}
      >
        <DialogTitle>Choose Relationship Type</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Select the type of relationship between the selected columns:
            {currentRelationship && (
              <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
                {currentRelationship.sourceTable}.{currentRelationship.sourceColumn} → {currentRelationship.targetTable}.{currentRelationship.targetColumn}
              </Typography>
            )}
          </DialogContentText>
          
          {/* Visual relationship type selector */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 3 }}>
            <Typography variant="subtitle1">Select Relationship Type:</Typography>
            
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, 1fr)', 
              gap: 2 
            }}>
              {/* One-to-One */}
              <Box 
                onClick={() => setRelationshipType('one-to-one')}
                sx={{ 
                  p: 2, 
                  border: '1px solid',  
                  borderColor: relationshipType === 'one-to-one' ? '#4caf50' : '#e0e0e0',
                  borderRadius: 1,
                  backgroundColor: relationshipType === 'one-to-one' ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: '#4caf50',
                    backgroundColor: 'rgba(76, 175, 80, 0.05)'
                  },
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ width: 5, height: 20, backgroundColor: '#4caf50', mr: 1 }} />
                  <Box sx={{ width: 100, height: 2, backgroundColor: '#4caf50' }} />
                  <Box sx={{ width: 5, height: 20, backgroundColor: '#4caf50', ml: 1 }} />
                </Box>
                <Typography variant="body1" fontWeight="bold">One-to-One (1:1)</Typography>
                <Typography variant="caption" color="text.secondary" align="center">
                  Each record in Table A relates to exactly one record in Table B
                </Typography>
              </Box>
              
              {/* One-to-Many */}
              <Box 
                onClick={() => setRelationshipType('one-to-many')}
                sx={{ 
                  p: 2, 
                  border: '1px solid', 
                  borderColor: relationshipType === 'one-to-many' ? '#2196f3' : '#e0e0e0',
                  borderRadius: 1,
                  backgroundColor: relationshipType === 'one-to-many' ? 'rgba(33, 150, 243, 0.1)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: '#2196f3',
                    backgroundColor: 'rgba(33, 150, 243, 0.05)'
                  },
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ width: 5, height: 20, backgroundColor: '#2196f3', mr: 1 }} />
                  <Box sx={{ width: 100, height: 2, backgroundColor: '#2196f3' }} />
                  <Box sx={{ position: 'relative', ml: 1 }}>
                    <Box sx={{ 
                      width: 0, 
                      height: 0, 
                      borderLeft: '10px solid #2196f3', 
                      borderTop: '10px solid transparent', 
                      borderBottom: '10px solid transparent' 
                    }} />
                    <Box sx={{ 
                      position: 'absolute',
                      left: -15,
                      top: -10,
                      width: 0,
                      height: 0,
                      borderLeft: '10px solid #2196f3', 
                      borderTop: '10px solid transparent', 
                      borderBottom: '10px solid transparent' 
                    }} />
                    <Box sx={{ 
                      position: 'absolute',
                      left: -15,
                      top: 0,
                      width: 0,
                      height: 0,
                      borderLeft: '10px solid #2196f3', 
                      borderTop: '10px solid transparent', 
                      borderBottom: '10px solid transparent' 
                    }} />
                  </Box>
                </Box>
                <Typography variant="body1" fontWeight="bold">One-to-Many (1:N)</Typography>
                <Typography variant="caption" color="text.secondary" align="center">
                  Each record in Table A relates to multiple records in Table B
                </Typography>
              </Box>
              
              {/* Many-to-One */}
              <Box 
                onClick={() => setRelationshipType('many-to-one')}
                sx={{ 
                  p: 2, 
                  border: '1px solid', 
                  borderColor: relationshipType === 'many-to-one' ? '#9c27b0' : '#e0e0e0',
                  borderRadius: 1,
                  backgroundColor: relationshipType === 'many-to-one' ? 'rgba(156, 39, 176, 0.1)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: '#9c27b0',
                    backgroundColor: 'rgba(156, 39, 176, 0.05)'
                  },
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ position: 'relative', mr: 1 }}>
                    <Box sx={{ 
                      width: 0, 
                      height: 0, 
                      borderRight: '10px solid #9c27b0', 
                      borderTop: '10px solid transparent', 
                      borderBottom: '10px solid transparent' 
                    }} />
                    <Box sx={{ 
                      position: 'absolute',
                      right: -15,
                      top: -10,
                      width: 0,
                      height: 0,
                      borderRight: '10px solid #9c27b0', 
                      borderTop: '10px solid transparent', 
                      borderBottom: '10px solid transparent' 
                    }} />
                    <Box sx={{ 
                      position: 'absolute',
                      right: -15,
                      top: 0,
                      width: 0,
                      height: 0,
                      borderRight: '10px solid #9c27b0', 
                      borderTop: '10px solid transparent', 
                      borderBottom: '10px solid transparent' 
                    }} />
                  </Box>
                  <Box sx={{ width: 100, height: 2, backgroundColor: '#9c27b0' }} />
                  <Box sx={{ width: 5, height: 20, backgroundColor: '#9c27b0', ml: 1 }} />
                </Box>
                <Typography variant="body1" fontWeight="bold">Many-to-One (N:1)</Typography>
                <Typography variant="caption" color="text.secondary" align="center">
                  Multiple records in Table A relate to one record in Table B
                </Typography>
              </Box>
              
              {/* Many-to-Many */}
              <Box 
                onClick={() => setRelationshipType('many-to-many')}
                sx={{ 
                  p: 2, 
                  border: '1px solid', 
                  borderColor: relationshipType === 'many-to-many' ? '#ff9800' : '#e0e0e0',
                  borderRadius: 1,
                  backgroundColor: relationshipType === 'many-to-many' ? 'rgba(255, 152, 0, 0.1)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: '#ff9800',
                    backgroundColor: 'rgba(255, 152, 0, 0.05)'
                  },
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ position: 'relative', mr: 1 }}>
                    <Box sx={{ 
                      width: 0, 
                      height: 0, 
                      borderRight: '10px solid #ff9800', 
                      borderTop: '10px solid transparent', 
                      borderBottom: '10px solid transparent' 
                    }} />
                    <Box sx={{ 
                      position: 'absolute',
                      right: -15,
                      top: -10,
                      width: 0,
                      height: 0,
                      borderRight: '10px solid #ff9800', 
                      borderTop: '10px solid transparent', 
                      borderBottom: '10px solid transparent' 
                    }} />
                    <Box sx={{ 
                      position: 'absolute',
                      right: -15,
                      top: 0,
                      width: 0,
                      height: 0,
                      borderRight: '10px solid #ff9800', 
                      borderTop: '10px solid transparent', 
                      borderBottom: '10px solid transparent' 
                    }} />
                  </Box>
                  <Box sx={{ width: 100, height: 2, backgroundColor: '#ff9800', borderStyle: 'dashed' }} />
                  <Box sx={{ position: 'relative', ml: 1 }}>
                    <Box sx={{ 
                      width: 0, 
                      height: 0, 
                      borderLeft: '10px solid #ff9800', 
                      borderTop: '10px solid transparent', 
                      borderBottom: '10px solid transparent' 
                    }} />
                    <Box sx={{ 
                      position: 'absolute',
                      left: -15,
                      top: -10,
                      width: 0,
                      height: 0,
                      borderLeft: '10px solid #ff9800', 
                      borderTop: '10px solid transparent', 
                      borderBottom: '10px solid transparent' 
                    }} />
                    <Box sx={{ 
                      position: 'absolute',
                      left: -15,
                      top: 0,
                      width: 0,
                      height: 0,
                      borderLeft: '10px solid #ff9800', 
                      borderTop: '10px solid transparent', 
                      borderBottom: '10px solid transparent' 
                    }} />
                  </Box>
                </Box>
                <Typography variant="body1" fontWeight="bold">Many-to-Many (N:M)</Typography>
                <Typography variant="caption" color="text.secondary" align="center">
                  Multiple records in Table A relate to multiple records in Table B
                </Typography>
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setRelationshipDialogOpen(false);
              setCurrentRelationship(null);
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={addRelationship}
            disabled={!relationshipType}
            variant="contained"
            color="primary"
          >
            Add Relationship
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

/**
 * Wrapper component to provide ReactFlow context
 */
const VisualSchemaDesignerWithProvider = ({ 
  schema = {}, 
  selectedTables = [], 
  selectedColumns = {}, 
  relationships = [], 
  onSelectedColumnsChange, 
  onRelationshipsChange,
  connectionId,
  initialRelationships = []
}) => {
  // Display error when not properly configured
  if (!schema) {
    return <Box sx={{ p: 2 }}>No database schema available.</Box>;
  }
  
  if (!selectedTables || selectedTables.length === 0) {
    return <Box sx={{ p: 2 }}>No tables selected. Please select tables to visualize.</Box>;
  }
  
  return (
    <ReactFlowProvider>
      <VisualSchemaDesigner 
        schema={schema} 
        selectedTables={selectedTables} 
        selectedColumns={selectedColumns} 
        relationships={relationships} 
        onSelectedColumnsChange={onSelectedColumnsChange} 
        onRelationshipsChange={onRelationshipsChange}
        connectionId={connectionId}
        initialRelationships={initialRelationships}
      />
    </ReactFlowProvider>
  );
};

export default VisualSchemaDesignerWithProvider;
