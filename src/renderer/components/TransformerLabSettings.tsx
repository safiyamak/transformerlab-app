/* eslint-disable jsx-a11y/anchor-is-valid */
import * as React from 'react';

import Sheet from '@mui/joy/Sheet';
import {
  Button,
  CircularProgress,
  FormControl,
  FormHelperText,
  FormLabel,
  IconButton,
  Input,
  Typography,
} from '@mui/joy';

import * as chatAPI from 'renderer/lib/transformerlab-api-sdk';
import useSWR from 'swr';
import { EyeIcon, EyeOffIcon } from 'lucide-react';

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function TransformerLabSettings({}) {
  const [showPassword, setShowPassword] = React.useState(false);
  const {
    data: hftoken,
    error: hftokenerror,
    isLoading: hftokenisloading,
    mutate: hftokenmutate,
  } = useSWR(
    chatAPI.Endpoints.Config.Get('HuggingfaceUserAccessToken'),
    fetcher
  );

  return (
    <>
      <Typography level="h1" marginBottom={3}>
        Application Settings
      </Typography>
      <Sheet sx={{ maxWidth: '500px' }}>
        <Typography level="title-lg" marginBottom={2}>
          Huggingface Credentials:
        </Typography>
        <FormControl>
          <FormLabel>User Access Token</FormLabel>
          {hftokenisloading ? (
            <CircularProgress />
          ) : (
            <Input
              name="hftoken"
              defaultValue={hftoken}
              type="password"
              endDecorator={
                <IconButton
                  onClick={() => {
                    var x = document.getElementsByName('hftoken')[0];
                    if (x.type === 'text') {
                      x.type = 'password';
                    } else {
                      x.type = 'text';
                    }
                    setShowPassword(!showPassword);
                  }}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </IconButton>
              }
            />
          )}
          <Button
            onClick={async () => {
              const token = document.getElementsByName('hftoken')[0].value;
              await fetch(
                chatAPI.Endpoints.Config.Set(
                  'HuggingfaceUserAccessToken',
                  token
                )
              );
              // Now manually log in to huggingface
              await fetch(chatAPI.Endpoints.Models.HuggingFaceLogin());
              hftokenmutate(token);
            }}
            sx={{ marginTop: 1, width: '100px', alignSelf: 'flex-end' }}
          >
            Save
          </Button>
          <FormHelperText>
            Documentation here:
            <a
              href="https://huggingface.co/docs/hub/security-tokens"
              target="_blank"
            >
              https://huggingface.co/docs/hub/security-tokens
            </a>
          </FormHelperText>
        </FormControl>
      </Sheet>
    </>
  );
}