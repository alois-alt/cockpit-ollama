import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, CardTitle, CardBody,
  Flex, FlexItem,
  Button, Spinner, Alert,
  EmptyState, EmptyStateBody,
  Label,
  DescriptionList, DescriptionListGroup, DescriptionListTerm, DescriptionListDescription
} from '@patternfly/react-core';
import { SyncAltIcon } from '@patternfly/react-icons';
import { listRunning } from '../ollama.js';

function formatSize(bytes) {
  if (!bytes) return '—';
  const gb = bytes / 1024 / 1024 / 1024;
  return gb >= 1 ? gb.toFixed(1) + ' GB' : (bytes / 1024 / 1024).toFixed(0) + ' MB';
}

function ExpiryCountdown({ until }) {
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    function update() {
      const diff = new Date(until) - new Date();
      if (diff <= 0) { setRemaining('Unloading...'); return; }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setRemaining(`${mins}m ${secs}s`);
    }
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [until]);

  return <span>{remaining}</span>;
}

export default function RunningModels({ serverRunning }) {
  const [running, setRunning] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!serverRunning) return;
    setLoading(true);
    try {
      const r = await listRunning();
      setRunning(r);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [serverRunning]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  if (!serverRunning) return null;

  return (
    <Card>
      <CardTitle>
        <Flex alignItems={{ default: 'alignItemsCenter' }}>
          <FlexItem>
            Active Models
            {running.length > 0 && (
              <Label color="green" isCompact style={{ marginLeft: '0.5rem' }}>
                {running.length} loaded
              </Label>
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
        {error && <Alert variant="warning" isInline title={error} />}

        {loading && running.length === 0 ? (
          <Spinner size="md" />
        ) : running.length === 0 ? (
          <EmptyState>
            <EmptyStateBody>No models currently loaded in memory.</EmptyStateBody>
          </EmptyState>
        ) : (
          running.map(model => (
            <Card key={model.name} isCompact style={{ marginBottom: '0.75rem', background: '#f0fdf4' }}>
              <CardBody>
                <DescriptionList isCompact isHorizontal>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Model</DescriptionListTerm>
                    <DescriptionListDescription>
                      <code>{model.name}</code>
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  {model.size && (
                    <DescriptionListGroup>
                      <DescriptionListTerm>VRAM/RAM</DescriptionListTerm>
                      <DescriptionListDescription>{formatSize(model.size)}</DescriptionListDescription>
                    </DescriptionListGroup>
                  )}
                  {model.expires_at && (
                    <DescriptionListGroup>
                      <DescriptionListTerm>Unloads in</DescriptionListTerm>
                      <DescriptionListDescription>
                        <ExpiryCountdown until={model.expires_at} />
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                  )}
                  {model.details?.parameter_size && (
                    <DescriptionListGroup>
                      <DescriptionListTerm>Parameters</DescriptionListTerm>
                      <DescriptionListDescription>{model.details.parameter_size}</DescriptionListDescription>
                    </DescriptionListGroup>
                  )}
                </DescriptionList>
              </CardBody>
            </Card>
          ))
        )}
      </CardBody>
    </Card>
  );
}
