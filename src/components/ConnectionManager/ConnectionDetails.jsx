import React, { useState } from 'react';
import { 
  Box, 
  TextField, 
  MenuItem, 
  Grid, 
  Typography,
  InputAdornment,
  Tooltip,
  IconButton,
  Button,
  FormControlLabel,
  Switch,
  Collapse
} from '@mui/material';
import StorageIcon from '@mui/icons-material/Storage';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import VpnKeyIcon from '@mui/icons-material/VpnKey';

const ConnectionDetails = ({ connectionData, onChange, isEdit = false, onTestConnection, onConnect, connectionTested }) => {
  const [useSSH, setUseSSH] = useState(connectionData.ssh_enabled || false);

  const handleChange = (field) => (event) => {
    onChange({ ...connectionData, [field]: event.target.value });
  };

  const handleSSHToggle = (event) => {
    const enabled = event.target.checked;
    setUseSSH(enabled);
    onChange({
      ...connectionData,
      ssh_enabled: enabled,
      // Reset SSH fields when disabled
      ssh_host: enabled ? connectionData.ssh_host : '',
      ssh_port: enabled ? connectionData.ssh_port : '',
      ssh_username: enabled ? connectionData.ssh_username : '',
      ssh_password: enabled ? connectionData.ssh_password : '',
      ssh_private_key: enabled ? connectionData.ssh_private_key : '',
    });
  };

  // Render SSH configuration fields
  const renderSSHFields = () => (
    <Collapse in={useSSH}>
      <Typography variant="subtitle1" sx={{ mt: 3, mb: 2 }}>
        SSH Tunnel Configuration
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField
            label="SSH Host"
            fullWidth
            margin="normal"
            value={connectionData.ssh_host || ''}
            onChange={handleChange('ssh_host')}
            required={useSSH}
            placeholder="ssh.example.com"
            InputProps={{
              endAdornment: (
                <Tooltip title="The hostname or IP address of your SSH server">
                  <InputAdornment position="end">
                    <IconButton edge="end" size="small" tabIndex={-1}>
                      <HelpOutlineIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                </Tooltip>
              ),
            }}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            label="SSH Port"
            fullWidth
            margin="normal"
            value={connectionData.ssh_port || '22'}
            onChange={handleChange('ssh_port')}
            required={useSSH}
            type="number"
            placeholder="22"
            InputProps={{
              endAdornment: (
                <Tooltip title="The SSH port (default is 22)">
                  <InputAdornment position="end">
                    <IconButton edge="end" size="small" tabIndex={-1}>
                      <HelpOutlineIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                </Tooltip>
              ),
            }}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            label="SSH Username"
            fullWidth
            margin="normal"
            value={connectionData.ssh_username || ''}
            onChange={handleChange('ssh_username')}
            required={useSSH}
            placeholder="ssh_user"
            InputProps={{
              endAdornment: (
                <Tooltip title="Your SSH username">
                  <InputAdornment position="end">
                    <IconButton edge="end" size="small" tabIndex={-1}>
                      <HelpOutlineIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                </Tooltip>
              ),
            }}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            select
            label="Authentication Method"
            fullWidth
            margin="normal"
            value={connectionData.ssh_auth_method || 'password'}
            onChange={handleChange('ssh_auth_method')}
            required={useSSH}
          >
            <MenuItem value="password">Password</MenuItem>
            <MenuItem value="private_key">Private Key</MenuItem>
          </TextField>
        </Grid>

        {connectionData.ssh_auth_method === 'password' ? (
          <Grid item xs={12} md={6}>
            <TextField
              label="SSH Password"
              fullWidth
              margin="normal"
              value={connectionData.ssh_password || ''}
              onChange={handleChange('ssh_password')}
              required={useSSH}
              type="password"
              InputProps={{
                endAdornment: (
                  <Tooltip title="Your SSH password">
                    <InputAdornment position="end">
                      <IconButton edge="end" size="small" tabIndex={-1}>
                        <HelpOutlineIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  </Tooltip>
                ),
              }}
            />
          </Grid>
        ) : (
          <Grid item xs={12}>
            <TextField
              label="SSH Private Key"
              fullWidth
              margin="normal"
              value={connectionData.ssh_private_key || ''}
              onChange={handleChange('ssh_private_key')}
              required={useSSH}
              multiline
              rows={4}
              placeholder="-----BEGIN RSA PRIVATE KEY-----"
              InputProps={{
                endAdornment: (
                  <Tooltip title="Your SSH private key in PEM format">
                    <InputAdornment position="end">
                      <IconButton edge="end" size="small" tabIndex={-1}>
                        <HelpOutlineIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  </Tooltip>
                ),
              }}
            />
          </Grid>
        )}
      </Grid>
    </Collapse>
  );

  return (
    <Box>
      <Typography variant="h6" gutterBottom display="flex" alignItems="center">
        <StorageIcon sx={{ mr: 1 }} />
        Database Connection
      </Typography>
      
      <Typography variant="body2" paragraph sx={{ mb: 3 }}>
        Enter the details for your database connection. You'll be able to query this database using natural language.
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField
            label="Connection Name"
            fullWidth
            margin="normal"
            value={connectionData.name}
            onChange={handleChange('name')}
            required
            placeholder="My SQL Server Database"
            InputProps={{
              endAdornment: (
                <Tooltip title="A descriptive name for your connection">
                  <InputAdornment position="end">
                    <IconButton edge="end" size="small" tabIndex={-1}>
                      <HelpOutlineIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                </Tooltip>
              ),
            }}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            select
            label="Database Type"
            fullWidth
            margin="normal"
            value={connectionData.db_type}
            onChange={handleChange('db_type')}
            required
            InputProps={{
              endAdornment: (
                <Tooltip title="The type of database you're connecting to">
                  <InputAdornment position="end">
                    <IconButton edge="end" size="small" tabIndex={-1}>
                      <HelpOutlineIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                </Tooltip>
              ),
            }}
          >
            <MenuItem value="sqlserver">Microsoft SQL Server</MenuItem>
            <MenuItem value="mysql">MySQL</MenuItem>
            <MenuItem value="postgresql">PostgreSQL</MenuItem>
            <MenuItem value="sqlite">SQLite</MenuItem>
            <MenuItem value="mongodb">MongoDB</MenuItem>
          </TextField>
        </Grid>
        
        {/* Add SSH toggle after database type selection */}
        {connectionData.db_type === 'mysql' && (
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={useSSH}
                  onChange={handleSSHToggle}
                  color="primary"
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <VpnKeyIcon sx={{ mr: 1 }} />
                  <Typography>Use SSH Tunnel</Typography>
                </Box>
              }
            />
          </Grid>
        )}

        {/* Render SSH fields if MySQL is selected and SSH is enabled */}
        {connectionData.db_type === 'mysql' && renderSSHFields()}

        <Grid item xs={12} md={6}>
          <TextField
            label="Host / Server"
            fullWidth
            margin="normal"
            value={connectionData.host}
            onChange={handleChange('host')}
            required
            placeholder="localhost or server address"
            InputProps={{
              endAdornment: (
                <Tooltip title="The hostname or IP address of your database server">
                  <InputAdornment position="end">
                    <IconButton edge="end" size="small" tabIndex={-1}>
                      <HelpOutlineIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                </Tooltip>
              ),
            }}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            label="Port"
            fullWidth
            margin="normal"
            value={connectionData.port}
            onChange={handleChange('port')}
            required
            placeholder="1433"
            type="number"
            InputProps={{
              endAdornment: (
                <Tooltip title="The port number for your database connection">
                  <InputAdornment position="end">
                    <IconButton edge="end" size="small" tabIndex={-1}>
                      <HelpOutlineIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                </Tooltip>
              ),
            }}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            label="Username"
            fullWidth
            margin="normal"
            value={connectionData.username}
            onChange={handleChange('username')}
            placeholder="Database username"
            InputProps={{
              endAdornment: (
                <Tooltip title="The username for authenticating to your database">
                  <InputAdornment position="end">
                    <IconButton edge="end" size="small" tabIndex={-1}>
                      <HelpOutlineIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                </Tooltip>
              ),
            }}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            label="Password"
            fullWidth
            margin="normal"
            value={connectionData.password}
            onChange={handleChange('password')}
            // required={!isEdit}
            type="password"
            placeholder={isEdit ? "Leave blank to keep current password" : "Database password"}
            InputProps={{
              endAdornment: (
                <Tooltip title="The password for authenticating to your database">
                  <InputAdornment position="end">
                    <IconButton edge="end" size="small" tabIndex={-1}>
                      <HelpOutlineIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                </Tooltip>
              ),
            }}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            label="Database Name"
            fullWidth
            margin="normal"
            value={connectionData.database}
            onChange={handleChange('database')}
            required
            placeholder="mydatabase"
            InputProps={{
              endAdornment: (
                <Tooltip title="The name of the specific database to connect to">
                  <InputAdornment position="end">
                    <IconButton edge="end" size="small" tabIndex={-1}>
                      <HelpOutlineIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                </Tooltip>
              ),
            }}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            label="Database Schema"
            fullWidth
            margin="normal"
            value={connectionData.db_schema}
            onChange={handleChange('db_schema')}
            placeholder="dbo (SQL Server), public (PostgreSQL)"
            helperText="Optional for most databases, required for SQL Server (usually 'dbo')"
            InputProps={{
              endAdornment: (
                <Tooltip title="The schema within the database (e.g., 'dbo' for SQL Server, 'public' for PostgreSQL)">
                  <InputAdornment position="end">
                    <IconButton edge="end" size="small" tabIndex={-1}>
                      <HelpOutlineIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                </Tooltip>
              ),
            }}
          />
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            label="Description"
            fullWidth
            margin="normal"
            value={connectionData.description}
            onChange={handleChange('description')}
            placeholder="Optional description of this connection"
            multiline
            rows={2}
          />
        </Grid>
      </Grid>
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4, gap: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={onTestConnection}
          sx={{ minWidth: '150px' }}
          startIcon={<PlayArrowIcon />}
        >
          Test Connection
        </Button>
        
        {connectionTested && (
          <Button
            variant="contained"
            color="success"
            onClick={onConnect}
            sx={{ minWidth: '150px' }}
            startIcon={<CheckCircleOutlineIcon />}
          >
            Connect & Configure
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default ConnectionDetails;
