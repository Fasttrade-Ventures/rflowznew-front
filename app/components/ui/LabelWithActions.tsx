import { Icon } from "#app/components/icon";
import {
  ActionIcon,
  Box,
  Button,
  Group,
  Modal,
  Text,
  TypographyStylesProvider,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import styles from "./LabelWithActions.module.css";

interface LabelWithActionsProps {
  label: string;
  onAIClick: () => void;
  infoContent?: string;
  htmlFor: string;
  isGenerating: boolean;
  errorGeneratingAI: boolean;
}

const LabelWithActions: React.FC<LabelWithActionsProps> = ({
  label,
  onAIClick,
  infoContent,
  htmlFor,
  isGenerating,
  errorGeneratingAI,
}) => {
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <>
      {infoContent && (
        <Modal
          opened={opened}
          onClose={close}
          title={
            <Text>
              How to write <strong>{label}</strong>
            </Text>
          }
          size="lg"
        >
          <TypographyStylesProvider>
            <div dangerouslySetInnerHTML={{ __html: infoContent }} />
          </TypographyStylesProvider>
        </Modal>
      )}
      <Group justify="space-between">
        <Group gap={5}>
          <Text size="md" component="label" fw={600} htmlFor={htmlFor}>
            {label}
          </Text>
          {infoContent && (
            <ActionIcon
              variant="filled"
              size="sm"
              radius="xl"
              aria-label="Info"
              color="gray"
              onClick={open}
            >
              <Icon name="info-small-outline" />
            </ActionIcon>
          )}
        </Group>
        <Group>
          {errorGeneratingAI ? (
            <Text size="xs" fw="500" c="red">
              Error generating AI
            </Text>
          ) : null}

          <div className={styles.buttonWrapper}>
            <Box w="100%">
              <Button
                className={styles.professorButton}
                fullWidth
                variant="light"
                color={
                  errorGeneratingAI ? "red" : "var(--mantine-primary-color-4)"
                }
                onClick={onAIClick}
                disabled={isGenerating}
              >
                <span className={styles.buttonText}>
                  {errorGeneratingAI
                    ? "Try again"
                    : isGenerating
                    ? "Thinking..."
                    : "Ask Prof Z ✨"}
                </span>
              </Button>
            </Box>
            <img
              src="/images/dr-z.png"
              alt="Professor Dr Z"
              className={styles.professorIcon}
            />
          </div>
        </Group>
      </Group>
    </>
  );
};

export default LabelWithActions;
