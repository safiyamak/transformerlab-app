import { useState } from 'react';

import useSWR from 'swr';

import {
  Box,
  Button,
  FormControl,
  Grid,
  Input,
  LinearProgress,
  Sheet,
  CircularProgress,
  FormLabel,
} from '@mui/joy';
import { PlusIcon } from 'lucide-react';
import DatasetCard from './DatasetCard';
import { SearchIcon } from 'lucide-react';

import * as chatAPI from '../../lib/transformerlab-api-sdk';
import NewDatasetModal from './NewDatasetModal';

const fetcher = (url) => fetch(url).then((res) => res.json());

export function filterByFiltersDatasetID(data, searchText = '', filters = {}) {
  return data.filter((row) => {
    if (row.dataset_id.toLowerCase().includes(searchText.toLowerCase())) {
      for (const filterKey in filters) {
        console.log(filterKey, filters[filterKey]);
        if (filters[filterKey] !== 'All') {
          if (row[filterKey] !== filters[filterKey]) {
            return false;
          }
        }
      }
      return true;
    }
    return false;
  });
}
export default function LocalDatasets() {
  const [searchText, setSearchText] = useState('');
  const [newDatasetModalOpen, setNewDatasetModalOpen] = useState(false);
  const [downloadingDataset, setDownloadingDataset] = useState(null);

  const { data, error, isLoading, mutate } = useSWR(
    chatAPI.Endpoints.Dataset.LocalList(),
    fetcher
  );

  if (error) return 'An error has occurred.';
  if (isLoading) return <LinearProgress />;

  console.log(data);

  return (
    <Sheet
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
      }}
    >
      <NewDatasetModal
        open={newDatasetModalOpen}
        setOpen={setNewDatasetModalOpen}
      />
      <Box
        className="SearchAndFilters-tabletUp"
        sx={{
          borderRadius: 'sm',
          pb: 2,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1.5,
          '& > *': {
            minWidth: {
              xs: '120px',
              md: '160px',
            },
          },
        }}
      >
        <FormControl sx={{ flex: 2 }} size="sm">
          <FormLabel>&nbsp;</FormLabel>
          <Input
            placeholder="Search"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            startDecorator={<SearchIcon />}
          />
        </FormControl>
      </Box>
      <Sheet
        className="OrderTableContainer"
        variant="outlined"
        sx={{
          width: '100%',
          height: '100%',
          borderRadius: 'md',
          flex: 1,
          overflow: 'auto',
          minHeight: 0,
          padding: 2,
        }}
      >
        {data && console.log(data)}
        <Grid container spacing={2} sx={{ flexGrow: 1 }}>
          {data &&
            filterByFiltersDatasetID(data, searchText).map((row) => (
              <Grid xs={4}>
                <DatasetCard
                  name={row?.dataset_id}
                  size={row?.size}
                  description={row?.description}
                  repo={row.huggingfacerepo}
                  location={row?.location}
                  downloaded={true}
                  local={true}
                  config_names
                  parentMutate={mutate}
                  selectedConfig={row.config_name}
                />
              </Grid>
            ))}
        </Grid>
      </Sheet>

      <Box
        sx={{
          justifyContent: 'space-between',
          display: 'flex',
          width: '100%',
          paddingTop: '12px',
        }}
      >
        <>
          <FormControl>
            <Input
              placeholder="Open-Orca/OpenOrca"
              name="download-dataset-name"
              endDecorator={
                <Button
                  onClick={async (e) => {
                    const dataset = document.getElementsByName(
                      'download-dataset-name'
                    )[0].value;
                    // only download if valid model is entered
                    if (dataset) {
                      // this triggers UI changes while download is in progress
                      setDownloadingDataset(dataset);

                      // Datasets can be very large so do this asynchronously
                      fetch(chatAPI.Endpoints.Dataset.Download(dataset))
                        .then((response) => {
                          if (!response.ok) {
                            console.log(response);
                            throw new Error(`HTTP Status: ${response.status}`);
                          }
                          return response.json();
                        })
                        .then((response_json) => {
                          if (response_json?.status == 'error') {
                            throw new Error(response_json.message);
                          }
                          setDownloadingDataset(null);
                        })
                        .catch((error) => {
                          setDownloadingDataset(null);
                          alert('Download failed:\n' + error);
                        });
                    }
                  }}
                  startDecorator={
                    downloadingDataset ? (
                      <CircularProgress size="sm" thickness={2} />
                    ) : (
                      ''
                    )
                  }
                >
                  {downloadingDataset ? 'Downloading' : 'Download 🤗 Dataset'}
                </Button>
              }
              sx={{ width: '500px' }}
            />
          </FormControl>
          <>
            <Button
              size="sm"
              sx={{ height: '30px' }}
              endDecorator={<PlusIcon />}
              onClick={() => {
                setNewDatasetModalOpen(true);
              }}
            >
              New
            </Button>
          </>
        </>
      </Box>
    </Sheet>
  );
}
