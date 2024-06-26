import { useState, FormEvent, useEffect } from 'react';
import useSWR from 'swr';

import * as chatAPI from 'renderer/lib/transformerlab-api-sdk';

import {
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
  Modal,
  ModalDialog,
  Stack,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Sheet,
} from '@mui/joy';
import DynamicPluginForm from '../DynamicPluginForm';
import TrainingModalDataTab from './TraningModalDataTab';

const DefaultLoraConfig = {
  model_max_length: 2048,
  num_train_epochs: 3,
  learning_rate: 1e-3,
  lora_r: 8,
  lora_alpha: 16,
  lora_dropout: 0.05,
  adaptor_name: '',
};

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function TrainingModalLoRA({
  open,
  onClose,
  experimentInfo,
  template_id,
  pluginId,
}: {
  open: boolean;
  onClose: () => void;
  experimentInfo: any;
  template_id?: string;
  pluginId: string;
}) {
  // Store the current selected Dataset in this modal
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [config, setConfig] = useState(DefaultLoraConfig);
  const [nameInput, setNameInput] = useState('');

  // Fetch available datasets from the API
  const {
    data: datasets,
    error: datasetsError,
    isLoading: datasetsIsLoading,
  } = useSWR(chatAPI.Endpoints.Dataset.LocalList(), fetcher);

  const {
    data: templateData,
    error: templateError,
    isLoading: templateIsLoading,
    mutate: templateMutate,
  } = useSWR(
    template_id
      ? chatAPI.Endpoints.Jobs.GetTrainingTemplate(template_id)
      : null,
    fetcher
  );
  async function updateTrainingTemplate(
    template_id: string,
    name: string,
    description: string,
    type: string,
    config: string
  ) {
    const configBody = {
      config: config,
    };
    const response = await fetch(
      chatAPI.Endpoints.Jobs.UpdateTrainingTemplate(
        template_id,
        name,
        description,
        type
      ),
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          accept: 'application/json',
        },
        body: JSON.stringify(configBody),
      }
    );
    const result = await response.json();
    return result;
  }
  //Whenever template data updates, we need to update state variables used in the form.
  useEffect(() => {
    if (templateData && typeof templateData.config === 'string') {
      //Should only parse data once after initial load
      templateData.config = JSON.parse(templateData.config);
    }
    if (templateData && templateData.config) {
      setSelectedDataset(templateData.config.dataset_name);
      setConfig(templateData.config);
      setNameInput(templateData.name);
    } else {
      //This case is for when we are creating a new template
      setSelectedDataset(null);
      setConfig(DefaultLoraConfig);
      setNameInput('');
    }
  }, [templateData]);
  // Once you have a dataset selected, we use SWR's dependency mode to fetch the
  // Dataset's info. Note how useSWR is declared as a function -- this is is how
  // the dependency works. If selectedDataset errors, the fetcher knows to not run.
  const { data: currentDatasetInfo, isLoading: currentDatasetInfoIsLoading } =
    useSWR(() => {
      if (selectedDataset === null) {
        return null;
      }
      return chatAPI.Endpoints.Dataset.Info(selectedDataset);
    }, fetcher);
  const currentModel = experimentInfo?.config?.foundation_filename
    ? experimentInfo?.config?.foundation_filename
    : experimentInfo?.config?.foundation;

  function injectIntoTemplate(key) {
    // Add the key to the textbox with id "template"
    const template =
      document.getElementById('training-form')?.elements['template'];

    if (template === undefined) return;

    const cursorPosition = template.selectionStart;
    const templateText = template.value;
    const newText =
      templateText.slice(0, cursorPosition) +
      `{{${key}}}` +
      templateText.slice(cursorPosition);
    template.value = newText;
  }

  if (!experimentInfo?.id) {
    return 'Select an Experiment';
  }

  function TrainingModalFirstTab() {
    return (
      <Stack spacing={2}>
        <FormControl>
          <FormLabel>Training Template Name</FormLabel>
          <Input
            required
            autoFocus
            placeholder={
              templateData ? templateData.name : 'Alpaca Training Job'
            }
            value={nameInput} //Value needs to be stored in a state variable otherwise it will not update on change/update
            onChange={(e) => setNameInput(e.target.value)}
            name="template_name"
            size="lg"
          />
          <FormHelperText>
            Give this specific training recipe a unique name
          </FormHelperText>
        </FormControl>
        <FormLabel>Info</FormLabel>
        <Sheet color="neutral" variant="soft">
          <Stack direction="column" justifyContent="space-evenly" gap={2} p={2}>
            <FormControl sx={{ flex: 1 }}>
              <FormLabel>Base Model:</FormLabel>
              <Input readOnly value={currentModel} variant="soft" />
            </FormControl>
            <FormControl sx={{ flex: 1 }}>
              <FormLabel>Architecture:</FormLabel>
              <Input
                readOnly
                value={experimentInfo?.config?.foundation_model_architecture}
                variant="soft"
              />
            </FormControl>
            <FormControl sx={{ flex: 1 }}>
              <FormLabel>Plugin:</FormLabel>
              <Input
                readOnly
                value={pluginId}
                variant="soft"
                name="plugin_name"
              />
            </FormControl>
            <input hidden value={currentModel} name="model_name" readOnly />
            <input
              hidden
              value={experimentInfo?.config?.foundation_model_architecture}
              name="model_architecture"
              readOnly
            />
          </Stack>
        </Sheet>
      </Stack>
    );
  }

  return (
    <Modal open={open}>
      <ModalDialog
        sx={{
          width: '70vw',
          transform: 'translateX(-50%)', // This undoes the default translateY that centers vertically
          top: '10vh',
          overflow: 'auto',
          maxHeight: '80vh',
          minHeight: '70vh',
          height: '100%',
        }}
      >
        <form
          id="training-form"
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            justifyContent: 'space-between',
          }}
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            const formJson = Object.fromEntries((formData as any).entries());
            if (templateData && template_id) {
              //Only update if we are currently editing a template
              updateTrainingTemplate(
                template_id,
                event.currentTarget.elements['template_name'].value,
                'Description',
                'LoRA',
                JSON.stringify(formJson)
              );
              templateMutate(); //Need to mutate template data after updating
            } else {
              chatAPI.saveTrainingTemplate(
                event.currentTarget.elements['template_name'].value,
                'Description',
                'LoRA',
                JSON.stringify(formJson)
              );
            }
            onClose();
          }}
        >
          <Tabs
            aria-label="Training Template Tabs"
            defaultValue={0}
            sx={{ borderRadius: 'lg', display: 'flex', overflow: 'hidden' }}
          >
            <TabList>
              <Tab>1. Name</Tab>
              <Tab>2. Data</Tab>
              <Tab>3. Plugin Config</Tab>
            </TabList>
            <TabPanel value={0} sx={{ p: 2, overflow: 'auto' }} keepMounted>
              <TrainingModalFirstTab />
            </TabPanel>

            <TabPanel value={1} sx={{ p: 2, overflow: 'auto' }} keepMounted>
              <TrainingModalDataTab
                datasetsIsLoading={datasetsIsLoading}
                datasets={datasets}
                selectedDataset={selectedDataset}
                setSelectedDataset={setSelectedDataset}
                currentDatasetInfoIsLoading={currentDatasetInfoIsLoading}
                currentDatasetInfo={currentDatasetInfo}
                templateData={templateData}
                injectIntoTemplate={injectIntoTemplate}
                experimentInfo={experimentInfo}
                pluginId={pluginId}
              />
            </TabPanel>
            <TabPanel value={2} sx={{ p: 2, overflow: 'auto' }} keepMounted>
              <DynamicPluginForm
                experimentInfo={experimentInfo}
                plugin={pluginId}
                config={config}
              />
            </TabPanel>
          </Tabs>
          <Stack spacing={2} direction="row" justifyContent="flex-end">
            <Button color="danger" variant="soft" onClick={() => onClose()}>
              Cancel
            </Button>
            <Button variant="soft" type="submit">
              Save Training Template
            </Button>
          </Stack>
        </form>
        {/* {JSON.stringify(config, null, 2)} */}
      </ModalDialog>
    </Modal>
  );
}
