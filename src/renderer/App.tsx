import { useState, useEffect } from 'react';
import { CssVarsProvider } from '@mui/joy/styles';
import CssBaseline from '@mui/joy/CssBaseline';
import Box from '@mui/joy/Box';

import Sidebar from './components/Nav/Sidebar';
import MainAppPanel from './components/MainAppPanel';
import Header from './components/Header';

import customTheme from './lib/theme';

import './styles.css';
import LoginModal from './components/Connect/LoginModal';
import * as chatAPI from 'renderer/lib/transformerlab-api-sdk';

import useSWR from 'swr';
import XtermJSDrawer from './components/Connect/XtermJS';
// import OutputTerminal from './components/OutputTerminal';
// import AutoUpdateModal from './components/AutoUpdateModal';

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function App() {
  const [experimentId, setExperimentId] = useState('');

  const [connection, setConnection] = useState('');

  const [sshConnection, setSSHConnection] = useState(null);

  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    async function getSavedExperimentId() {
      const connectionWithoutDots = connection.replace(/\./g, '-');
      const experimentId = await window.storage.get(
        `experimentId.${connectionWithoutDots}`
      );
      if (experimentId) {
        setExperimentId(experimentId);
      } else if (connection !== '') {
        // If there's no stored experiment and we are connected
        // then default to to the first experiment
        setExperimentId(1);
      }
    }

    if (!window.TransformerLab) {
      window.TransformerLab = {};
    }

    window.TransformerLab.API_URL = connection;

    if (connection == '') {
      setExperimentId('');
      return;
    }

    getSavedExperimentId();
  }, [connection]);

  useEffect(() => {
    if (experimentId == '') return;
    const connectionWithoutDots = connection.replace(/\./g, '-');
    window.storage.set(`experimentId.${connectionWithoutDots}`, experimentId);
  }, [experimentId]);

  // Fetch the experiment info, if the experimentId changes
  const {
    data: experimentInfo,
    error: experimentInfoError,
    isLoading: experimentInfoIsLoading,
    mutate: experimentInfoMutate,
  } = useSWR(chatAPI.GET_EXPERIMENT_URL(experimentId), fetcher);

  return (
    <CssVarsProvider disableTransitionOnChange theme={customTheme}>
      <CssBaseline />
      <Box
        component="main"
        className="MainContent"
        sx={() => ({
          display: 'grid',
          height: '100dvh',
          width: '100dvw',
          overflow: 'hidden',
          gridTemplateColumns: '220px 1fr',
          gridTemplateRows: '60px 5fr 0fr',
          gridTemplateAreas: `
              "sidebar header"
              "sidebar main"
              "sidebar footer"
              `,

          // backgroundColor: (theme) => theme.vars.palette.background.surface,
        })}
      >
        {/* <AutoUpdateModal /> */}
        <Header
          connection={connection}
          setConnection={setConnection}
          experimentInfo={experimentInfo}
        />
        {/* <FirstSidebar setDrawerOpen={setDrawerOpen} /> */}

        <Sidebar
          experimentInfo={experimentInfo}
          setExperimentId={setExperimentId}
          setDrawerOpen={setDrawerOpen}
        />
        <Box
          sx={{
            px: {
              md: 3,
              lg: 4,
            },
            pt: 2,
            pb: 0,
            height: '100%',
            gridArea: 'main',
            overflow: 'hidden',
            backgroundColor: 'var(--joy-palette-background-surface)',
            display: 'flex',
            flexDirection: 'column',
          }}
          id="main-app-panel"
        >
          <MainAppPanel
            experimentInfo={experimentInfo}
            setExperimentId={setExperimentId}
            experimentInfoMutate={experimentInfoMutate}
          />
        </Box>
        {/* <OutputTerminal /> */}
        <LoginModal
          setServer={setConnection}
          connection={connection}
          setTerminalDrawerOpen={setDrawerOpen}
          setSSHConnection={setSSHConnection}
        />
      </Box>
      <XtermJSDrawer
        sshConnection={sshConnection}
        drawerOpen={drawerOpen}
        setDrawerOpen={setDrawerOpen}
      />
    </CssVarsProvider>
  );
}
