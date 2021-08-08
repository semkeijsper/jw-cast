<template>
  <v-row justify="center">
    <v-col sm="12" xl="8">
      <strong class="text-h4 font-weight-medium" v-text="category.name"></strong>
    </v-col>
    <v-col sm="12" xl="8">
      <VideoGrid :videos="category.media"></VideoGrid>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

import { Category } from '@/types';

import VideoGrid from './VideoGrid.vue';

@Component({
  components: {
    VideoGrid,
  },
})
export default class VideoCategory extends Vue {
  @Prop({ required: true })
  category!: Category;
}
</script>
