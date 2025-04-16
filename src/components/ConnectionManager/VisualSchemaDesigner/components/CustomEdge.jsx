import React from 'react';
import { BaseEdge, getStraightPath, EdgeText } from 'reactflow';

const CustomEdge = ({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, style = {}, markerEnd }) => {
  // Get path for the edge line
  const [edgePath, labelX, labelY] = getStraightPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Relationship type determines color and style
  const getEdgeStyle = () => {
    const relationshipType = data?.relationshipType || 'one-to-one';
    
    const baseStyle = {
      stroke: '#888',
      strokeWidth: 1.5,
      ...style,
    };
    
    // Apply special styles based on relationship type
    switch (relationshipType) {
      case 'one-to-one':
        return { ...baseStyle, stroke: '#4caf50' }; // Green
      case 'one-to-many':
        return { ...baseStyle, stroke: '#2196f3' }; // Blue
      case 'many-to-one':
        return { ...baseStyle, stroke: '#9c27b0' }; // Purple
      case 'many-to-many':
        return { ...baseStyle, stroke: '#ff9800', strokeDasharray: '5,5' }; // Orange dashed
      default:
        return baseStyle;
    }
  };

  // Render cardinality markers based on relationship type
  const renderCardinalityMarkers = () => {
    const type = data?.relationshipType || 'one-to-one';
    const distance = 15; // Distance from the node
    
    // Calculate positions for cardinality markers
    const sourceDistance = distance;
    const targetDistance = distance;
    
    // Calculate direction vectors
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    const length = Math.sqrt(dx * dx + dy * dy);
    const normX = dx / length;
    const normY = dy / length;
    
    // Calculate positions
    const sourceMarkerX = sourceX + normX * sourceDistance;
    const sourceMarkerY = sourceY + normY * sourceDistance;
    const targetMarkerX = targetX - normX * targetDistance;
    const targetMarkerY = targetY - normY * targetDistance;
    
    // Helper function to rotate marker points
    const rotatePoint = (x, y, originX, originY, angle) => {
      const radians = (angle * Math.PI) / 180;
      const cos = Math.cos(radians);
      const sin = Math.sin(radians);
      const nx = cos * (x - originX) - sin * (y - originY) + originX;
      const ny = sin * (x - originX) + cos * (y - originY) + originY;
      return [nx, ny];
    };
    
    // Calculate angle for markers
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    
    // Determine what to render based on relationship type
    const markers = [];
    const color = getEdgeStyle().stroke;
    
    if (type === 'one-to-one' || type === 'one-to-many') {
      // Source side is "one" - render a vertical line
      const lineHeight = 10;
      const [x1, y1] = rotatePoint(sourceMarkerX, sourceMarkerY - lineHeight/2, sourceMarkerX, sourceMarkerY, angle);
      const [x2, y2] = rotatePoint(sourceMarkerX, sourceMarkerY + lineHeight/2, sourceMarkerX, sourceMarkerY, angle);
      
      markers.push(
        <line 
          key="source-one" 
          x1={x1} 
          y1={y1} 
          x2={x2} 
          y2={y2} 
          stroke={color} 
          strokeWidth={2} 
        />
      );
    }
    
    if (type === 'many-to-one' || type === 'many-to-many') {
      // Source side is "many" - render a crow's foot
      const footWidth = 8;
      const footLength = 10;
      
      // Calculate crow's foot points
      const [centerX, centerY] = [sourceMarkerX, sourceMarkerY];
      const [tipX, tipY] = rotatePoint(centerX + footLength, centerY, centerX, centerY, angle);
      const [topX, topY] = rotatePoint(centerX, centerY - footWidth, centerX, centerY, angle);
      const [bottomX, bottomY] = rotatePoint(centerX, centerY + footWidth, centerX, centerY, angle);
      
      markers.push(
        <path
          key="source-many"
          d={`M${topX},${topY} L${tipX},${tipY} L${bottomX},${bottomY}`}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
        />
      );
    }
    
    if (type === 'one-to-one' || type === 'many-to-one') {
      // Target side is "one" - render a vertical line
      const lineHeight = 10;
      const [x1, y1] = rotatePoint(targetMarkerX, targetMarkerY - lineHeight/2, targetMarkerX, targetMarkerY, angle);
      const [x2, y2] = rotatePoint(targetMarkerX, targetMarkerY + lineHeight/2, targetMarkerX, targetMarkerY, angle);
      
      markers.push(
        <line 
          key="target-one" 
          x1={x1} 
          y1={y1} 
          x2={x2} 
          y2={y2} 
          stroke={color} 
          strokeWidth={2} 
        />
      );
    }
    
    if (type === 'one-to-many' || type === 'many-to-many') {
      // Target side is "many" - render a crow's foot
      const footWidth = 8;
      const footLength = 10;
      
      // Calculate crow's foot points
      const [centerX, centerY] = [targetMarkerX, targetMarkerY];
      const [tipX, tipY] = rotatePoint(centerX - footLength, centerY, centerX, centerY, angle);
      const [topX, topY] = rotatePoint(centerX, centerY - footWidth, centerX, centerY, angle);
      const [bottomX, bottomY] = rotatePoint(centerX, centerY + footWidth, centerX, centerY, angle);
      
      markers.push(
        <path
          key="target-many"
          d={`M${topX},${topY} L${tipX},${tipY} L${bottomX},${bottomY}`}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
        />
      );
    }
    
    return markers;
  };

  // Get relationship abbreviation for the label
  const getRelationshipLabel = () => {
    const type = data?.relationshipType || 'one-to-one';
    
    switch (type) {
      case 'one-to-one': return '1:1';
      case 'one-to-many': return '1:N';
      case 'many-to-one': return 'N:1';
      case 'many-to-many': return 'N:M';
      default: return type;
    }
  };

  const edgeStyle = getEdgeStyle();
  const relationshipLabel = getRelationshipLabel();

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={edgeStyle}
      />
      <EdgeText
        x={labelX}
        y={labelY}
        label={relationshipLabel}
        labelStyle={{ fill: edgeStyle.stroke, fontWeight: 600 }}
        labelBgStyle={{ fill: 'white' }}
        labelBgPadding={[2, 4]}
        labelBgBorderRadius={4}
      />
      {renderCardinalityMarkers()}
    </>
  );
};

export default CustomEdge;
