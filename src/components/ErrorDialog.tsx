/**
 * ErrorDialog Component
 * Displays error messages using DNB Eufemia Dialog
 */

import { Dialog, Button, Heading, P, Space, Flex, Div } from "@dnb/eufemia";

export interface ErrorDialogProps {
  title: string;
  message: string;
  open: boolean;
  onClose: () => void;
}

/**
 * Reusable error dialog component
 */
export function ErrorDialog({
  title,
  message,
  open,
  onClose,
}: ErrorDialogProps) {
  return (
    <Dialog
      openState={open}
      onClose={onClose}
      hideCloseButton={true}
      maxWidth="28rem"
      alignContent="centered"
      spacing={false}
    >
      <Space top="large" bottom="large" left="large" right="large">
        <Flex.Vertical align="center">
          <Flex.Vertical
            align="center"
            justify="center"
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              backgroundColor: "var(--color-fire-red-8)",
              margin: "0 auto var(--spacing-small)",
              fontSize: "20px",
              fontWeight: "bold",
              color: "var(--color-fire-red)",
            }}
          >
            !
          </Flex.Vertical>

          <Heading size="large" bottom="x-small">
            {title}
          </Heading>

          <P
            size="basis"
            bottom="medium"
            align="center"
            style={{ color: "var(--color-black-80)" }}
          >
            {message}
          </P>

          <Button variant="primary" size="large" onClick={onClose} stretch>
            Lukk
          </Button>
        </Flex.Vertical>
      </Space>
    </Dialog>
  );
}

export default ErrorDialog;
