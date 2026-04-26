import React, { useState, useEffect } from 'react';
import {
  Card, CardTitle, CardBody,
  Flex, FlexItem,
  Label,
  Button,
  Spinner,
  Alert,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Divider
} from '@patternfly/react-core';
import { CheckCircleIcon, TimesCircleIcon, SyncAltIcon } from '@patternfly/react-icons';
import { checkStatus, getOllamaVersion, getServiceStatus, startService, stopService } from '../ollama.js';

export default function ServerStatus({ onStatusChange }) {
  const [status, setStatus] = useState(null);
  const [version, setVersion] = useState('');
  const [serviceState, setServiceState] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const [apiStatus, ver, svcState] = await Promise.all([
        checkStatus(),
        getOllamaVersion(),
        getServiceStatus()
      ]);
      setStatus(apiStatus);
      setVersion(ver);
      setServiceState(svcState);
      if (onStatusChange) onStatusChange(apiStatus.running);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 15000);
    return () => clearInterval(interval);
  }, []);

  async function handleStart() {
    setActionLoading(true);
    setError(null);
    try {
      await startService();
      await new Promise(r => setTimeout(r, 2000));
      await refresh();
    } catch (err) {
      setError('Failed to start Ollama: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleStop() {
    setActionLoading(true);
    setError(null);
    try {
      await stopService();
      await new Promise(r => setTimeout(r, 1000));
      await refresh();
    } catch (err) {
      setError('Failed to stop Ollama: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  }

  const isRunning = status?.running;
  const isActive = serviceState === 'active';

  return (
    <Card>
      <CardTitle>
        <Flex alignItems={{ default: 'alignItemsCenter' }}>
          <FlexItem>Ollama Server</FlexItem>
          <FlexItem>
            {loading
              ? <Spinner size="sm" />
              : isRunning
                ? <Label color="green" icon={<CheckCircleIcon />}>Running</Label>
                : <Label color="red" icon={<TimesCircleIcon />}>Stopped</Label>
            }
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
          <Alert variant="warning" isInline title={error} style={{ marginBottom: '1rem' }} />
        )}
        <DescriptionList isCompact isHorizontal>
          <DescriptionListGroup>
            <DescriptionListTerm>API (port 11434)</DescriptionListTerm>
            <DescriptionListDescription>
              {loading ? '—' : isRunning ? 'Reachable' : 'Unreachable'}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>systemd service</DescriptionListTerm>
            <DescriptionListDescription>
              <Label color={isActive ? 'green' : 'grey'} isCompact>
                {serviceState || '—'}
              </Label>
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Version</DescriptionListTerm>
            <DescriptionListDescription>{version || '—'}</DescriptionListDescription>
          </DescriptionListGroup>
          {isRunning && (
            <DescriptionListGroup>
              <DescriptionListTerm>Models installed</DescriptionListTerm>
              <DescriptionListDescription>{status.modelCount}</DescriptionListDescription>
            </DescriptionListGroup>
          )}
        </DescriptionList>

        <Divider style={{ margin: '1rem 0' }} />

        <Flex>
          <FlexItem>
            <Button
              variant="primary"
              onClick={handleStart}
              isDisabled={isActive || actionLoading || loading}
              isLoading={actionLoading && !isActive}
            >
              Start
            </Button>
          </FlexItem>
          <FlexItem>
            <Button
              variant="danger"
              onClick={handleStop}
              isDisabled={!isActive || actionLoading || loading}
              isLoading={actionLoading && isActive}
            >
              Stop
            </Button>
          </FlexItem>
        </Flex>
      </CardBody>
    </Card>
  );
}
