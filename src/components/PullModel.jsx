import React, { useState, useRef } from 'react';
import {
  Card, CardTitle, CardBody,
  Button, Alert,
  TextInput,
  Progress, ProgressVariant,
  Flex, FlexItem,
  HelperText, HelperTextItem,
  List, ListItem
} from '@patternfly/react-core';
import { DownloadIcon, TimesIcon } from '@patternfly/react-icons';
import { pullModel } from '../ollama.js';

const POPULAR_MODELS = [
  'llama3.2:3b',
  'llama3.2:1b',
  'llama3.1:8b',
  'mistral:7b',
  'gemma2:2b',
  'gemma2:9b',
  'phi3:mini',
  'qwen2.5:7b',
  'deepseek-r1:7b',
  'nomic-embed-text'
];

export default function PullModel({ serverRunning, onPullComplete }) {
  const [modelName, setModelName] = useState('');
  const [pulling, setPulling] = useState(false);
  const [progress, setProgress] = useState(null);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const procRef = useRef(null);

  function handleProgress(data) {
    // data: { status, digest, total, completed }
    if (data.status) {
      setLogs(prev => {
        // Update last line if same status, else append
        const last = prev[prev.length - 1];
        if (last && last.status === data.status && data.digest === last.digest) {
          return [...prev.slice(0, -1), data];
        }
        return [...prev.slice(-20), data]; // keep last 20 lines
      });
    }
    if (data.total && data.completed) {
      setProgress(Math.round((data.completed / data.total) * 100));
    } else if (data.status === 'success') {
      setProgress(100);
    }
  }

  async function handlePull() {
    const name = modelName.trim();
    if (!name) return;
    setPulling(true);
    setError(null);
    setSuccess(null);
    setLogs([]);
    setProgress(0);

    try {
      const proc = pullModel(name, handleProgress);
      procRef.current = proc;

      await proc;

      setSuccess(`Model "${name}" pulled successfully!`);
      setProgress(100);
      if (onPullComplete) onPullComplete();
    } catch (err) {
      if (err.message !== 'cancelled') {
        setError('Pull failed: ' + (err.message || 'Unknown error'));
      }
    } finally {
      setPulling(false);
      procRef.current = null;
    }
  }

  function handleCancel() {
    if (procRef.current) {
      procRef.current.close('cancelled');
      procRef.current = null;
    }
    setPulling(false);
    setProgress(null);
    setLogs([]);
  }

  const lastStatus = logs[logs.length - 1];
  const progressVariant = error ? ProgressVariant.danger
    : progress === 100 ? ProgressVariant.success
    : ProgressVariant.info;

  return (
    <Card>
      <CardTitle>Pull a Model</CardTitle>
      <CardBody>
        {!serverRunning && (
          <Alert variant="warning" isInline title="Ollama server is not running. Start it first." style={{ marginBottom: '1rem' }} />
        )}

        {error && (
          <Alert variant="danger" isInline title={error} style={{ marginBottom: '1rem' }}
            actionClose={<Button variant="plain" onClick={() => setError(null)}>✕</Button>}
          />
        )}
        {success && (
          <Alert variant="success" isInline title={success} style={{ marginBottom: '1rem' }}
            actionClose={<Button variant="plain" onClick={() => setSuccess(null)}>✕</Button>}
          />
        )}

        <Flex alignItems={{ default: 'alignItemsFlexEnd' }}>
          <FlexItem grow={{ default: 'grow' }}>
            <TextInput
              value={modelName}
              onChange={(_, val) => setModelName(val)}
              placeholder="e.g. llama3.2:3b or mistral:7b"
              isDisabled={pulling || !serverRunning}
              onKeyDown={(e) => { if (e.key === 'Enter' && !pulling) handlePull(); }}
              aria-label="Model name"
            />
            <HelperText>
              <HelperTextItem>
                Browse all models at{' '}
                <a href="https://ollama.com/library" target="_blank" rel="noopener noreferrer">
                  ollama.com/library
                </a>
              </HelperTextItem>
            </HelperText>
          </FlexItem>
          <FlexItem>
            {pulling ? (
              <Button variant="danger" onClick={handleCancel} icon={<TimesIcon />}>
                Cancel
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handlePull}
                isDisabled={!modelName.trim() || !serverRunning}
                icon={<DownloadIcon />}
              >
                Pull
              </Button>
            )}
          </FlexItem>
        </Flex>

        {/* Popular models quick-select */}
        {!pulling && (
          <div style={{ marginTop: '1rem' }}>
            <HelperText><HelperTextItem>Popular models:</HelperTextItem></HelperText>
            <Flex flexWrap={{ default: 'wrap' }} style={{ marginTop: '0.5rem', gap: '0.4rem' }}>
              {POPULAR_MODELS.map(m => (
                <FlexItem key={m}>
                  <Button
                    variant="secondary"
                    size="sm"
                    isDisabled={!serverRunning}
                    onClick={() => setModelName(m)}
                  >
                    {m}
                  </Button>
                </FlexItem>
              ))}
            </Flex>
          </div>
        )}

        {/* Progress */}
        {pulling && progress !== null && (
          <div style={{ marginTop: '1.5rem' }}>
            <Progress
              value={progress}
              title={lastStatus?.status || 'Pulling...'}
              variant={progressVariant}
              measureLocation="outside"
            />
            {logs.length > 0 && (
              <div style={{
                marginTop: '0.5rem',
                background: '#1e1e1e', color: '#9cdcfe',
                padding: '0.75rem', borderRadius: '4px',
                fontFamily: 'monospace', fontSize: '0.8em',
                maxHeight: '200px', overflowY: 'auto'
              }}>
                {logs.slice(-15).map((log, i) => (
                  <div key={i}>
                    {log.status}
                    {log.total ? ` — ${Math.round((log.completed || 0) / log.total * 100)}%` : ''}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
