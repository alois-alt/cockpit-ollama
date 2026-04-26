import React, { useState } from 'react';
import {
  Page, PageSection, PageSectionVariants,
  Title, Flex, FlexItem,
  Grid, GridItem,
  Alert
} from '@patternfly/react-core';
import ServerStatus from './components/ServerStatus.jsx';
import ModelsList from './components/ModelsList.jsx';
import PullModel from './components/PullModel.jsx';
import RunningModels from './components/RunningModels.jsx';

export default function App() {
  const [serverRunning, setServerRunning] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  function handlePullComplete() {
    // Trigger refresh of models list
    setRefreshKey(k => k + 1);
  }

  return (
    <Page>
      <PageSection variant={PageSectionVariants.light}>
        <Flex alignItems={{ default: 'alignItemsCenter' }}>
          <FlexItem>
            <Title headingLevel="h1" size="xl">
              🦙 Ollama Manager
            </Title>
          </FlexItem>
          <FlexItem>
            <span style={{ color: '#6a6e73', fontSize: '0.9em' }}>
              Manage your local AI models
            </span>
          </FlexItem>
        </Flex>
      </PageSection>

      <PageSection>
        <Grid hasGutter>
          {/* Left column */}
          <GridItem span={4}>
            <ServerStatus onStatusChange={setServerRunning} />
          </GridItem>

          <GridItem span={8}>
            <RunningModels serverRunning={serverRunning} />
          </GridItem>

          {/* Pull */}
          <GridItem span={12}>
            <PullModel serverRunning={serverRunning} onPullComplete={handlePullComplete} />
          </GridItem>

          {/* Models list */}
          <GridItem span={12}>
            <ModelsList
              key={refreshKey}
              serverRunning={serverRunning}
            />
          </GridItem>
        </Grid>
      </PageSection>
    </Page>
  );
}
