import { mountSuspended } from '@nuxt/test-utils/runtime';
import { flushPromises } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import TranscriptPanel from '~/components/player/TranscriptPanel.vue';

// The search-filter/highlight logic is unit-tested in test/utils/transcript.test.ts
// (highlightSegments); these mounts cover the DOM wiring instead.

const VTT = `WEBVTT

00:00.000 --> 00:02.000
alpha

00:02.000 --> 00:04.000
beta gamma
`;

beforeEach(() => {
  vi.stubGlobal('$fetch', vi.fn().mockResolvedValue(VTT));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

async function mountPanel(currentTime: number) {
  const wrapper = await mountSuspended(TranscriptPanel, {
    props: { vttUrl: 'https://cdn.test/sub.vtt', currentTime },
  });
  await flushPromises();
  await flushPromises();
  return wrapper;
}

describe('TranscriptPanel', () => {
  it('marks the cue active for the current time', async () => {
    const wrapper = await mountPanel(3);
    expect(wrapper.find('.cue-active').text()).toContain('beta gamma');
  });

  it('renders every cue from the fetched VTT', async () => {
    const wrapper = await mountPanel(0);
    const cues = wrapper.findAll('.cue');
    expect(cues).toHaveLength(2);
    expect(cues[0]!.text()).toContain('alpha');
    expect(cues[1]!.text()).toContain('beta gamma');
  });

  it('emits seek with the cue start when a cue is clicked', async () => {
    const wrapper = await mountPanel(0);
    await wrapper.findAll('.cue')[1]!.trigger('click');
    expect(wrapper.emitted('seek')?.[0]).toEqual([2]);
  });
});
