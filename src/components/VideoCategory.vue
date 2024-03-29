<template>
  <v-row v-if="category" justify="center">
    <v-col sm="12" xl="8" cols="12">
      <p v-if="!hideTitle" class="text-h4 font-weight-medium mb-6" v-text="category.name"></p>
      <VideoGrid v-if="grid" :videos="media"></VideoGrid>
      <VideoSwiper v-else :videos="media"></VideoSwiper>
      <v-divider v-if="divider" :class="grid ? 'mt-8' : 'mt-5'"></v-divider>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import axios from 'axios';
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import { Getter, State } from 'vuex-class';

import { Category, Language } from '@/types';

import VideoGrid from './VideoGrid.vue';
import VideoSwiper from './VideoSwiper.vue';

@Component({
  components: {
    VideoGrid,
    VideoSwiper,
  },
})
export default class VideoCategory extends Vue {
  @Prop({ type: Boolean })
  grid!: boolean;
  @Prop({ type: Boolean })
  hideTitle!: boolean;
  @Prop({ type: Boolean })
  divider!: boolean;
  @Prop({ type: String, required: true })
  categoryName!: string;
  @Prop({ type: Number })
  limit!: number | undefined;
  @Prop({ type: RegExp })
  filter!: RegExp | undefined;

  category: Category | null = null;

  @State mediatorUrl!: string;
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
    return `${this.mediatorUrl}/categories/${this.siteLanguage.code}/${
      this.categoryName
    }?detailed=1&clientType=www${this.limit ? `&limit=${this.limit}` : ''}`;
  }

  get media() {
    if (this.category?.media === null) {
      return [];
    }
    if (this.filter === undefined) {
      return this.category?.media;
    }
    return this.category?.media.filter(medium =>
      this.filter?.test(medium.languageAgnosticNaturalKey),
    );
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
