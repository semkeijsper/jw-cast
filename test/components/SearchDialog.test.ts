import { mountSuspended } from '@nuxt/test-utils/runtime';
import { flushPromises } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SearchDialog from '~/components/search/SearchDialog.vue';
import { useUiStore } from '~/stores/ui';
import * as api from '~/utils/api';

// Auto-imported api wrappers hit the network; stub the ones SearchDialog uses.
vi.mock('~/utils/api', async importOriginal => ({
  ...(await importOriginal<typeof import('~/utils/api')>()),
  fetchToken: vi.fn().mockResolvedValue('jwt-token'),
  fetchSearch: vi.fn(),
  fetchMediaItem: vi.fn(),
}));

afterEach(() => vi.clearAllMocks());

describe('SearchDialog', () => {
  it('fetches the search token lazily when the dialog first opens', async () => {
    await mountSuspended(SearchDialog);
    const ui = useUiStore();

    expect(api.fetchToken).not.toHaveBeenCalled();

    ui.setSearchDialog(true);
    await flushPromises();

    expect(api.fetchToken).toHaveBeenCalledOnce();
  });
});
