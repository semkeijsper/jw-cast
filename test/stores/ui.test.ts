import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { useUiStore } from '~/stores/ui';
import { makeVideo } from '../fixtures';

beforeEach(() => setActivePinia(createPinia()));

describe('ui store', () => {
  it('openVideo selects the video and opens the dialog', () => {
    const s = useUiStore();
    expect(s.videoDialog).toBe(false);
    s.openVideo(makeVideo('x'));
    expect(s.selectedVideo?.languageAgnosticNaturalKey).toBe('x');
    expect(s.videoDialog).toBe(true);
  });

  it('closing the transcript panel also collapses the expanded state', () => {
    const s = useUiStore();
    s.setTranscriptPanel(true);
    s.setTranscriptExpanded(true);
    s.setTranscriptPanel(false);
    expect(s.transcriptPanel).toBe(false);
    expect(s.transcriptExpanded).toBe(false);
  });
});
