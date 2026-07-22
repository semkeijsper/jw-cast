import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, expect, it } from 'vitest';
import VideoCard from '~/components/browse/VideoCard.vue';

describe('VideoCard', () => {
  it('renders the title and emits click', async () => {
    const wrapper = await mountSuspended(VideoCard, {
      props: { src: 'https://img.test/x.jpg', title: 'My Video' },
    });

    expect(wrapper.text()).toContain('My Video');

    await wrapper.find('.video-card').trigger('click');
    expect(wrapper.emitted('click')).toBeTruthy();
  });
});
