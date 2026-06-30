import { Button, Group, Text } from "@mantine/core";
import { Icon } from "#app/components/icon";
import classes from "./CitationBar.module.css";
import { ExtendedCitation } from "#app/services/paper.server";

export const CitationBar = ({
  citations,
}: {
  citations: {
    onAddCitationClick: () => void;
    citationData: ExtendedCitation[] | undefined;
  };
}) => {
  return (
    <div>
      <div className={classes.content}>
        <Group align="center" justify="space-between" gap="md">
          <Group align="center" gap="xs">
            <Icon
              name="pika-receipt"
              style={{
                width: "30px",
                height: "30px",
                color: "var(--mantine-primary-color-filled)",
              }}
            />
            <Text size="xs" fw={500}>
              {citations.citationData?.length === 0
                ? "No citations found"
                : `${citations.citationData?.length} citations found`}
            </Text>
          </Group>
          <Group align="center" gap="xs">
            <Group wrap="nowrap" align="center" gap={5}>
              <Icon
                name="info-circle-filled"
                style={{
                  width: "14px",
                  height: "14px",
                  color: "var(--mantine-color-dark-5)",
                }}
              />
              <Text size="xs" c="dimmed">
                Citations help strengthen your research
              </Text>
            </Group>
            <Button
              size="compact-md"
              variant="transparent"
              onClick={citations.onAddCitationClick}
            >
              <Group gap="xs">
                <Icon
                  name="plus-outline"
                  style={{ width: "14px", height: "14px" }}
                />
                <Text size="xs">
                  {citations.citationData?.length === 0
                    ? "Add citation"
                    : "Manage citations"}
                </Text>
              </Group>
            </Button>
          </Group>
        </Group>
      </div>
    </div>
  );
};
