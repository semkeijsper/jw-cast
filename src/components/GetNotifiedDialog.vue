<template>
  <v-dialog v-model="dialog" max-width="480px" :fullscreen="$vuetify.breakpoint.xsOnly">
    <v-card>
      <v-toolbar color="primary" dark dense>
        <v-toolbar-title>{{ channel && channel.ctaLabel }}</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon @click="dialog = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>
      <v-card-text v-if="channel" class="pt-6 pb-4" style="font-size: 16px">
        {{ channel.description }}
      </v-card-text>
      <v-card-actions v-if="channel" class="pb-4 px-4">
        <v-btn
          :href="channel.link"
          target="_blank"
          rel="noopener"
          color="#25D366"
          dark
          depressed
          rounded
        >
          <v-icon left>mdi-whatsapp</v-icon>
          {{ channel.buttonLabel }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { Mutation, State } from 'vuex-class';

import { WhatsAppChannel, whatsappChannels } from '@/config/whatsappChannels';

@Component
export default class GetNotifiedDialog extends Vue {
  @State getNotifiedDialog!: boolean;
  @State siteLanguage!: string;
  @Mutation setGetNotifiedDialog!: (value: boolean) => void;

  get dialog() {
    return this.getNotifiedDialog;
  }

  set dialog(value: boolean) {
    this.setGetNotifiedDialog(value);
  }

  get channel(): WhatsAppChannel | undefined {
    return whatsappChannels[this.siteLanguage];
  }
}
</script>
