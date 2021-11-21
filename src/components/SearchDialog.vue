<template>
  <v-dialog
    v-model="dialog"
    @click:outside="dialog = false"
    max-width="900px"
    transition="dialog-bottom-transition"
    :fullscreen="$vuetify.breakpoint.smAndDown"
  >
    <v-card>
      <v-toolbar color="primary" dark>
        <v-toolbar-title>Zoeken</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-toolbar-items>
          <v-btn icon @click="dialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar-items>
      </v-toolbar>
      <v-card-text class="px-3 pb-3">
        <v-container>
          <v-row :no-gutters="xsOnly">
            <v-col cols="12" sm="12">
              <v-text-field hide-details prepend-icon="mdi-magnify" single-line></v-text-field>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { Mutation, State } from 'vuex-class';

@Component
export default class SearchDialog extends Vue {
  @State searchDialog!: boolean;
  @Mutation setSearchDialog!: (value: boolean) => void;

  get dialog() {
    return this.searchDialog;
  }

  set dialog(value) {
    this.setSearchDialog(value);
  }
}
</script>
