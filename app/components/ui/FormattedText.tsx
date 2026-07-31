import {
  Box,
  Button,
  CopyButton,
  Stack,
  TypographyStylesProvider,
} from "@mantine/core";
import { Icon } from "../icon";

interface FormattedTextProps {
  content?: string | null;
}

export function FormattedText({ content }: FormattedTextProps) {
  const safeContent = content ?? "";
  const formattedContent = safeContent
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br>");

  return (
    <Stack gap="xs">
      <TypographyStylesProvider>
        <Box>
          <div
            dangerouslySetInnerHTML={{
              __html: `<p>${formattedContent}</p>`,
            }}
          />
        </Box>
      </TypographyStylesProvider>
      <Box>
        <CopyButton value={formattedContent}>
          {({ copied, copy }) => (
            <Button
              color={copied ? "teal" : "dark.3"}
              variant="light"
              onClick={copy}
              leftSection={
                <Icon
                  name={copied ? "pika-copied" : "pika-copy"}
                  style={
                    copied
                      ? { width: 20, height: 20 }
                      : { width: 16, height: 16 }
                  }
                />
              }
              size="xs"
              disabled={!formattedContent.trim()}
            >
              {copied ? "Copied" : "Copy"}
            </Button>
          )}
        </CopyButton>
      </Box>
    </Stack>
  );
}
