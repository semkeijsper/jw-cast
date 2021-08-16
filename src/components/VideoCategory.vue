<template>
  <v-row v-if="category" justify="center">
    <v-col sm="12" xl="8" cols="12">
      <p class="text-h4 font-weight-medium mb-6" v-text="category.name"></p>
      <VideoGrid v-if="grid" :videos="category.media"></VideoGrid>
      <VideoCarousel v-else :videos="category.media"></VideoCarousel>
      <v-divider v-if="divider" :class="grid ? 'mt-8' : 'mt-5'"></v-divider>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import { Getter, State } from 'vuex-class';
import axios from 'axios';

import { Category, Language } from '@/types';

import VideoGrid from './VideoGrid.vue';
import VideoCarousel from './VideoCarousel.vue';

@Component({
  components: {
    VideoGrid,
    VideoCarousel,
  },
})
export default class VideoCategory extends Vue {
  @Prop({ type: Boolean })
  grid!: boolean;
  @Prop({ type: Boolean })
  divider!: boolean;
  @Prop({ required: true })
  categoryName!: string;
  category: Category | null = null;

  @State baseUrl!: string;
  @Getter('getSiteLanguage') siteLanguage!: Language;

  mounted() {
    this.loadCategory();
  }

  async loadCategory() {
    try {
      this.category = (await axios.get(this.categoryUrl)).data.category;
    } catch (error) {
      this.category = null;
    }
  }

  get categoryUrl() {
    return `${this.baseUrl}/categories/${this.siteLanguage.code}/${this.categoryName}?detailed=1&clientType=www`;
  }

  @Watch('siteLanguage')
  onVideoLanguageChange(newLang: Language, oldLang: Language) {
    if (newLang.locale === oldLang.locale) {
      return;
    }
    this.loadCategory();
  }
}
</script>
