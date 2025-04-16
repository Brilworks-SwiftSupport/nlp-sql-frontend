import { Box } from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';

// Node styling
export const StyledNode = styled(Box)(({ theme }) => ({
  width: '250px',
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[2],
  overflow: 'hidden'
}));

export const NodeHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1.5),
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  borderBottom: `1px solid ${theme.palette.divider}`,
  cursor: 'move',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  userSelect: 'none',
}));

export const ColumnList = styled(Box)(({ theme }) => ({
  maxHeight: '400px',
  overflowY: 'auto',
  padding: 0,
  '&::-webkit-scrollbar': {
    width: '8px',
  },
  '&::-webkit-scrollbar-track': {
    background: '#f1f1f1',
    borderRadius: '4px',
  },
  '&::-webkit-scrollbar-thumb': {
    background: '#888',
    borderRadius: '4px',
  },
  '&::-webkit-scrollbar-thumb:hover': {
    background: '#555',
  }
}));

export const KeyIconWrapper = styled('span')({
  marginRight: '4px',
  color: '#ffc107',
  display: 'inline-flex',
  alignItems: 'center',
  fontSize: '16px'
});

export const StyledSearchBox = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1),
  backgroundColor: theme.palette.background.default
}));

export const DeleteButton = styled(Box)(({ theme }) => ({
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: theme.palette.error.main,
  backgroundColor: theme.palette.error.light,
  borderRadius: '50%',
  width: 24,
  height: 24,
  ':hover': {
    backgroundColor: theme.palette.error.main,
    color: theme.palette.error.contrastText
  }
}));

// Column item styling
export const ColumnItem = styled(Box)(({ 
  theme, 
  isSelected, 
  isHighlighted, 
  isSource, 
  isCompatible, 
  isIncompatible, 
  isPrimary,
  isForeignKey 
}) => ({
  padding: theme.spacing(0.5, 1),
  borderBottom: `1px solid ${theme.palette.divider}`,
  backgroundColor: isSource 
    ? '#fff9c4' 
    : isSelected 
      ? '#e3f2fd' 
      : isCompatible
        ? '#e8f5e9'
        : isIncompatible
          ? '#ffebee'
          : 'transparent',
  position: 'relative',
  ':hover': {
    backgroundColor: isSource 
      ? '#fff9c4' 
      : isSelected 
        ? '#bbdefb' 
        : isCompatible
          ? '#c8e6c9'
          : isIncompatible
            ? '#ffcdd2'
            : '#f5f5f5',
  },
  boxShadow: isHighlighted ? 'inset 0 0 0 2px #2196f3' : 'none',
  border: isHighlighted ? '1px solid #2196f3' : 'none',
  height: '56px', // Fixed height for better alignment of handles
  display: 'flex',
  alignItems: 'center',
  // Add left border for primary keys
  borderLeft: isPrimary ? '4px solid #ffc107' : isForeignKey ? '4px solid #1976d2' : 'none'
}));

export const ColumnContent = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%'
}));

export const ColumnName = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  flexGrow: 1,
  marginLeft: theme.spacing(1)
}));

export const ColumnType = styled(Box)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontSize: '12px'
}));

// Edge styling
export const pulseBg = keyframes`
  0% {
    transform: translateY(-50%) scale(1);
    opacity: 0.5;
  }
  50% {
    transform: translateY(-50%) scale(1.08);
    opacity: 0.65;
  }
  100% {
    transform: translateY(-50%) scale(1);
    opacity: 0.5;
  }
`;

export const ForeignKeyLabel = styled(Box)(({ theme, type }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  backgroundColor: type === 'one-to-many' 
    ? theme.palette.info.light 
    : type === 'many-to-many' 
      ? theme.palette.warning.light 
      : theme.palette.primary.light,
  color: type === 'one-to-many' 
    ? theme.palette.info.contrastText 
    : type === 'many-to-many' 
      ? theme.palette.warning.contrastText 
      : theme.palette.primary.contrastText,
  padding: theme.spacing(0.5, 1),
  borderRadius: theme.shape.borderRadius,
  fontWeight: 'bold',
  fontSize: '11px',
  zIndex: 10,
  pointerEvents: 'none',
  boxShadow: theme.shadows[1],
}));

export const EdgeLabelBackground = styled(Box)(({ type }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '100%',
  height: '120%',
  zIndex: 5,
  borderRadius: '8px',
  animation: `${pulseBg} 2s infinite ease-in-out`,
  backgroundColor: type === 'one-to-many' 
    ? 'rgba(33, 150, 243, 0.18)' 
    : type === 'many-to-many' 
      ? 'rgba(255, 152, 0, 0.18)' 
      : 'rgba(76, 175, 80, 0.18)',
}));

export const DeleteEdgeButton = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  right: '-12px',
  transform: 'translateY(-50%)',
  backgroundColor: theme.palette.error.main,
  color: 'white',
  borderRadius: '50%',
  width: '22px',
  height: '22px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  zIndex: 20,
  boxShadow: theme.shadows[2],
  opacity: 0,
  transition: 'opacity 0.2s',
  fontSize: '14px',
  '.react-flow__edge:hover &': {
    opacity: 1
  }
}));
