import { useEditorStore } from '../../store/useEditorStore';

const TIME_FORMAT = new Intl.DateTimeFormat(undefined, {
  hour: '2-digit',
  minute: '2-digit',
});

/**
 * The rail footer's autosave line. Reads "Autosaved 12:04" once a write has
 * landed, and says so plainly before then rather than showing a placeholder
 * time that was never true.
 */
export const useLastSavedLabel = (): string => {
  const lastSavedAt = useEditorStore((state) => state.lastSavedAt);

  if (lastSavedAt === null) return 'Not yet saved';
  return `Autosaved ${TIME_FORMAT.format(lastSavedAt)}`;
};
