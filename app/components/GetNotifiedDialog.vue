<template>
  <v-dialog v-model="dialog" :fullscreen="xs" max-width="480px">
    <v-card>
      <v-toolbar color="primary" density="compact">
        <v-toolbar-title>{{ channel?.ctaLabel }}</v-toolbar-title>

        <template #append>
          <v-btn icon @click="dialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </template>
      </v-toolbar>

      <v-card-text v-if="channel" class="pt-6 pb-4" style="font-size: 16px">
        {{ channel.description }}
      </v-card-text>

      <v-card-actions v-if="channel" class="pb-4 px-4">
        <v-btn
          class="text-white"
          color="#25D366"
          :href="channel.link"
          prepend-icon="mdi-whatsapp"
          rel="noopener"
          rounded
          target="_blank"
          variant="flat"
        >
          {{ channel.buttonLabel }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import type { WhatsAppChannel } from '~/config/whatsappChannels';
import { useDisplay } from 'vuetify';
import { whatsappChannels } from '~/config/whatsappChannels';

const store = useAppStore();
const { xs } = useDisplay();

const dialog = computed({
  get: () => store.getNotifiedDialog,
  set: v => store.setGetNotifiedDialog(v),
});

const channel = computed<WhatsAppChannel | undefined>(
  () => whatsappChannels[store.siteLanguage],
);
</script>
