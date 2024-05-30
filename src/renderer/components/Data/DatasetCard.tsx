import { useEffect, useState } from 'react';

import {
  Button,
  Card,
  CardContent,
  CircularProgress,
  Modal,
  ModalClose,
  ModalDialog,
  Typography,
  DialogTitle,
  Box,
  Autocomplete,
  Input,
} from '@mui/joy';
import {
  DownloadIcon,
  FileTextIcon,
  Trash2Icon,
  CheckIcon,
} from 'lucide-react';

import { formatBytes } from 'renderer/lib/utils';
import * as chatAPI from '../../lib/transformerlab-api-sdk';
import PreviewDatasetModal from './PreviewDatasetModal';
import DatasetInfoModal from './DatasetInfoModal';

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function DatasetCard({
  name,
  size,
  description,
  repo,
  downloaded,
  location,
  parentMutate,
  local,
  config_names,
  selectedConfig,
}) {
  const [installing, setInstalling] = useState(null);
  const [previewDatasetModalOpen, setPreviewDatasetModalOpen] = useState(false);
  const [datasetInfoModalOpen, setDatasetInfoModalOpen] = useState(false);
  const [openConfigModal, setOpenConfigModal] = useState(false);
  const [configSelection, setConfigSelection] = useState(null);
  const [isError, setIsError] = useState(false);
  let fetchPromise = null;
  // Datasets can be very large so do this asynchronously
  async function downloadDataset(fetchPromise) {
    try {
      const response = await fetchPromise;

      if (!response.ok) {
        console.log(response);
        throw new Error(`HTTP Status: ${response.status}`);
      }

      const response_json = await response.json();

      if (response_json?.status == 'error') {
        throw new Error(response_json.message);
      }

      setInstalling(null);
    } catch (error) {
      setInstalling(null);
      alert('Download failed:\n' + error);
    }
  }
  useEffect(() => {
    if (installing === true && configSelection != null) {
      fetchPromise = fetch(
        chatAPI.Endpoints.Dataset.Download(repo, configSelection)
      );
      downloadDataset(fetchPromise);
    }
  }, [installing, configSelection]);
  return (
    <>
      {previewDatasetModalOpen && (
        <PreviewDatasetModal
          open={previewDatasetModalOpen}
          setOpen={setPreviewDatasetModalOpen}
          dataset_id={name}
        />
      )}
      <DatasetInfoModal
        open={datasetInfoModalOpen}
        dataset_id={name}
        setOpen={setDatasetInfoModalOpen}
      />
      <Card variant="outlined" sx={{}}>
        <div>
          <Typography
            level="h4"
            sx={{ mb: 0.5, height: '40px', overflow: 'clip' }}
            startDecorator={<FileTextIcon />}
          >
            <b>{name}</b>&nbsp;
            {location === 'huggingfacehub' && ' 🤗'}
            {location === 'local' && ' (local)'}
          </Typography>
          <div style={{ height: '100px', overflow: 'clip' }}>
            <Typography
              level="body-sm"
              sx={{
                overflow: 'auto',
                mt: 2,
                mb: 2,
              }}
            >
              {description}
            </Typography>
          </div>
        </div>
        <CardContent orientation="horizontal">
          <div>
            <Typography level="body3">Total size:</Typography>
            <Typography fontSize="lg" fontWeight="lg">
              {size === -1 ? 'Unknown' : formatBytes(size)}
            </Typography>
          </div>
        </CardContent>
        <CardContent orientation="horizontal">
          {downloaded && local && (
            <>
              <Button
                color="neutral"
                variant="outlined"
                onClick={async () => {
                  await fetch(chatAPI.Endpoints.Dataset.Delete(name));
                  parentMutate();
                }}
              >
                <Trash2Icon />
              </Button>
              <Button
                variant="solid"
                color="primary"
                sx={{ ml: 'auto' }}
                onClick={() => setPreviewDatasetModalOpen(true)}
              >
                Preview
              </Button>
              <Button
                variant="soft"
                onClick={async () => {
                  setDatasetInfoModalOpen(true);
                }}
              >
                Info
              </Button>
            </>
          )}
          {!local && (
            <Button
              variant="solid"
              size="sm"
              color="primary"
              aria-label="Download"
              sx={{ ml: 'auto' }}
              disabled={downloaded || installing}
              endDecorator={
                downloaded ? (
                  <CheckIcon />
                ) : installing ? (
                  <CircularProgress />
                ) : (
                  <DownloadIcon size="18px" />
                )
              }
              onClick={() => {
                if (config_names.length > 1) {
                  setOpenConfigModal(true);
                  if (installing === true && configSelection != null) {
                    fetchPromise = fetch(
                      chatAPI.Endpoints.Dataset.Download(repo, configSelection)
                    );
                    console.log(configSelection);
                    downloadDataset(fetchPromise);
                  }
                } else {
                  setInstalling(true);
                  fetchPromise = fetch(
                    chatAPI.Endpoints.Dataset.Download(repo)
                  );
                  downloadDataset(fetchPromise);
                }
              }}
            >
              {downloaded
                ? 'Downloaded'
                : installing
                ? 'Downloading'
                : 'Download'}{' '}
            </Button>
          )}
          <Modal
            open={openConfigModal}
            onClose={() => {
              setOpenConfigModal(false);
              setInstalling(null);
            }}
          >
            <ModalDialog
              sx={{
                width: '50vw',
                transform: 'translate(-50%, -50%)',
                top: '50%',
                overflow: 'auto',
                maxHeight: '20vh',
                minHeight: '20vh',
                height: '100%',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px',
                }}
              >
                Please select the config name you would like to use:
                <Autocomplete
                  placeholder="Select here"
                  options={config_names}
                  selectOnFocus
                  onChange={(event, newValue) => {
                    setConfigSelection(newValue);
                    setIsError(false);
                  }}
                ></Autocomplete>
                <Button
                  onClick={() => {
                    if (configSelection != null) {
                      setOpenConfigModal(false);
                      setIsError(false);
                      setInstalling(true);
                    } else {
                      setIsError(true);
                    }
                  }}
                >
                  Submit
                </Button>
                {isError && (
                  <Typography>
                    Please select a config name before submitting.
                  </Typography>
                )}
              </Box>
            </ModalDialog>
          </Modal>
        </CardContent>
      </Card>
    </>
  );
}
