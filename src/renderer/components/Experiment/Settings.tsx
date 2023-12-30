/* eslint-disable jsx-a11y/anchor-is-valid */

import Sheet from '@mui/joy/Sheet';
import { Button, Chip, Divider, Switch, Typography } from '@mui/joy';

import * as chatAPI from 'renderer/lib/transformerlab-api-sdk';
import { useState } from 'react';

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function ExperimentSettings({
  experimentInfo,
  setExperimentId,
  experimentInfoMutate,
}) {
  const [showJSON, setShowJSON] = useState(false);

  let plugins = experimentInfo?.config?.plugins;

  if (!experimentInfo) {
    return null;
  }
  return (
    <>
      <Typography level="h1">Experiment Settings</Typography>
      <Sheet>
        <Divider sx={{ mt: 2, mb: 2 }} />
        Show Experiment Details (JSON):&nbsp;
        <Switch checked={showJSON} onChange={() => setShowJSON(!showJSON)} />
        <pre
          style={{
            display: showJSON ? 'block' : 'none',
          }}
        >
          {JSON.stringify(experimentInfo, null, 2)}
        </pre>
        <Divider sx={{ mt: 2, mb: 2 }} />
        <Typography level="title-lg" mb={2}>
          Scripts&nbsp;
        </Typography>
        {plugins &&
          plugins.map((plugin) => (
            <>
              <Chip color="success" size="lg">
                {plugin}
              </Chip>
              &nbsp;
            </>
          ))}
        <Divider sx={{ mt: 2, mb: 2 }} />
        <Button
          color="danger"
          variant="outlined"
          onClick={() => {
            if (
              confirm(
                'Are you sure you want to delete this project? If you click on "OK" There is no way to recover it.'
              )
            ) {
              fetch(chatAPI.DELETE_EXPERIMENT_URL(experimentInfo?.id));
              setExperimentId(null);
            }
          }}
        >
          Delete Project {experimentInfo?.name}
        </Button>
      </Sheet>
    </>
  );
}
