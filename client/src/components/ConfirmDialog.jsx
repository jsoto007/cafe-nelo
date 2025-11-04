import Button from './Button.jsx';
import Dialog from './Dialog.jsx';

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onClose,
  busy = false,
  children
}) {
  return (
    <Dialog
      open={open}
      onClose={busy ? undefined : onClose}
      title={title}
      footer={[
        <Button key="cancel" type="button" variant="ghost" onClick={onClose} disabled={busy}>
          {cancelLabel}
        </Button>,
        <Button key="confirm" type="button" onClick={onConfirm} disabled={busy}>
          {confirmLabel}
        </Button>
      ]}
    >
      <p>{description}</p>
      {children}
    </Dialog>
  );
}
