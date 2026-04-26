import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, CardTitle, CardBody,
  Button, Spinner, Alert,
  Toolbar, ToolbarContent, ToolbarItem,
  SearchInput,
  EmptyState, EmptyStateBody,
  Modal, ModalVariant,
  Badge,
  Flex, FlexItem,
  Label,
  EmptyStateHeader, 
  EmptyStateIcon, 
  EmptyStateFooter 
} from '@patternfly/react-core';
import { TrashIcon, InfoCircleIcon, SyncAltIcon, SearchIcon } from '@patternfly/react-icons';
import { Table, Thead, Tbody, Tr, Th, Td } from '@patternfly/react-table';
import { listModels, listRunning, deleteModel, showModel } from '../ollama.js';
function formatSize(bytes) {
  if (!bytes) return '—';
  const gb = bytes / 1024 / 1024 / 1024;
  if (gb >= 1) return gb.toFixed(1) + ' GB';
  const mb = bytes / 1024 / 1024;
  return mb.toFixed(0) + ' MB';
}

function formatDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('fr-FR', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
}

export default function ModelsList({ serverRunning, onModelsChange }) {
  const [models, setModels] = useState([]);
  const [running, setRunning] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [infoModel, setInfoModel] = useState(null);
  const [infoData, setInfoData] = useState(null);
  const [infoLoading, setInfoLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!serverRunning) return;
    setLoading(true);
    setError(null);
    try {
      const [m, r] = await Promise.all([listModels(), listRunning()]);
      setModels(m);
      setRunning(r);
      if (onModelsChange) onModelsChange(m.length);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [serverRunning]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const runningNames = new Set(running.map(r => r.name));
  const filtered = models.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteModel(deleteTarget);
      setDeleteTarget(null);
      await refresh();
    } catch (err) {
      setError('Delete failed: ' + err.message);
      setDeleteTarget(null);
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleInfo(modelName) {
    setInfoModel(modelName);
    setInfoData(null);
    setInfoLoading(true);
    try {
      const data = await showModel(modelName);
      setInfoData(data);
    } catch (err) {
      setInfoData({ error: err.message });
    } finally {
      setInfoLoading(false);
    }
  }

  if (!serverRunning) {
    return (
      <Card>
        <CardTitle>Installed Models</CardTitle>
        <CardBody>
          <EmptyState>
            <EmptyStateBody>
              Start the Ollama server to view installed models.
            </EmptyStateBody>
          </EmptyState>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardTitle>
        <Flex alignItems={{ default: 'alignItemsCenter' }}>
          <FlexItem>
            Installed Models
            {models.length > 0 && (
              <Badge style={{ marginLeft: '0.5rem' }}>{models.length}</Badge>
            )}
          </FlexItem>
          <FlexItem align={{ default: 'alignRight' }}>
            <Button variant="plain" onClick={refresh} isDisabled={loading} aria-label="Refresh">
              <SyncAltIcon />
            </Button>
          </FlexItem>
        </Flex>
      </CardTitle>
      <CardBody>
        {error && (
          <Alert variant="danger" isInline title={error} style={{ marginBottom: '1rem' }}
            actionClose={<Button variant="plain" onClick={() => setError(null)}>✕</Button>}
          />
        )}

	<Toolbar id="models-toolbar">
  <ToolbarContent>
    <ToolbarItem variant="search-filter">
      <SearchInput
        placeholder="Filter models..."
        value={search}
        onChange={(_, val) => setSearch(val)}
        onClear={() => setSearch('')}
        aria-label="Filter models input"
      />
    </ToolbarItem>
    <ToolbarItem>
      <span style={{ color: '#6a6e73' }}>
        {filtered.length} model{filtered.length !== 1 ? 's' : ''} found
      </span>
    </ToolbarItem>
  </ToolbarContent>
</Toolbar>
        {loading ? (
          <Flex justifyContent={{ default: 'justifyContentCenter' }} style={{ padding: '2rem' }}>
            <FlexItem><Spinner /></FlexItem>
          </Flex>
        ) : filtered.length === 0 ? (
  <EmptyState>
    <EmptyStateHeader 
      titleText="No results found" 
      icon={<EmptyStateIcon icon={SearchIcon} />} 
      headingLevel="h4" 
    />
    <EmptyStateBody>
      No models match the filter <b>"{search}"</b>.
    </EmptyStateBody>
    <EmptyStateFooter>
      <Button variant="link" onClick={() => setSearch('')}>
        Clear all filters
      </Button>
    </EmptyStateFooter>
  </EmptyState>
) : (
          <Table aria-label="Ollama Models" variant="compact">
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Size</Th>
                <Th>Modified</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filtered.map(model => (
                <Tr key={model.name}>
                  <Td dataLabel="Name">
                    <code style={{ fontSize: '0.9em' }}>{model.name}</code>
                  </Td>
                  <Td dataLabel="Size">{formatSize(model.size)}</Td>
                  <Td dataLabel="Modified">{formatDate(model.modified_at)}</Td>
                  <Td dataLabel="Status">
                    {runningNames.has(model.name)
                      ? <Label color="green" isCompact>Running</Label>
                      : <Label color="grey" isCompact>Idle</Label>
                    }
                  </Td>
                  <Td dataLabel="Actions">
                    <Flex>
                      <FlexItem>
                        <Button
                          variant="plain"
                          aria-label="Info"
                          onClick={() => handleInfo(model.name)}
                        >
                          <InfoCircleIcon />
                        </Button>
                      </FlexItem>
                      <FlexItem>
                        <Button
                          variant="plain"
                          aria-label="Delete"
                          isDanger
                          onClick={() => setDeleteTarget(model.name)}
                        >
                          <TrashIcon />
                        </Button>
                      </FlexItem>
                    </Flex>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}

        {/* Delete confirmation modal */}
        <Modal
          variant={ModalVariant.small}
          title="Delete Model"
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          actions={[
            <Button
              key="confirm"
              variant="danger"
              onClick={handleDelete}
              isLoading={deleteLoading}
              isDisabled={deleteLoading}
            >
              Delete
            </Button>,
            <Button key="cancel" variant="link" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
          ]}
        >
          Are you sure you want to delete <strong>{deleteTarget}</strong>?
          This will remove the model files from disk.
        </Modal>

        {/* Model info modal */}
        <Modal
          variant={ModalVariant.medium}
          title={`Model info: ${infoModel}`}
          isOpen={!!infoModel}
          onClose={() => { setInfoModel(null); setInfoData(null); }}
          actions={[
            <Button key="close" variant="primary" onClick={() => { setInfoModel(null); setInfoData(null); }}>
              Close
            </Button>
          ]}
        >
          {infoLoading ? <Spinner /> : infoData ? (
            infoData.error
              ? <Alert variant="danger" isInline title={infoData.error} />
              : (
                <pre style={{
                  background: '#1e1e1e', color: '#d4d4d4',
                  padding: '1rem', borderRadius: '4px',
                  overflowX: 'auto', fontSize: '0.85em',
                  maxHeight: '400px', overflowY: 'auto'
                }}>
                  {JSON.stringify(infoData, null, 2)}
                </pre>
              )
          ) : null}
        </Modal>
      </CardBody>
    </Card>
  );
}
