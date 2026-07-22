import vuetify from 'eslint-config-vuetify';
import withNuxt from './.nuxt/eslint.config.mjs';

export default withNuxt(
  vuetify({ ts: true, vue: true }),
  {
    rules: {
      'prefer-template': 'error',
      curly: ['error', 'all'],
      '@stylistic/semi': ['error', 'always'],
      '@stylistic/keyword-spacing': ['error', { before: true, after: true }],
      '@stylistic/member-delimiter-style': ['error', {
        multiline: { delimiter: 'semi', requireLast: true },
        singleline: { delimiter: 'semi', requireLast: false },
      }],
      '@stylistic/brace-style': ['error', 'stroustrup'],
      '@stylistic/space-before-function-paren': ['error', { named: 'never', anonymous: 'never', asyncArrow: 'never' }],
      '@stylistic/quote-props': ['error', 'as-needed'],
      '@stylistic/indent': ['error', 2, { SwitchCase: 1 }],
    },
  },
).overrideRules({
  'vue/script-indent': ['error', 2, { baseIndent: 0, switchCase: 1 }],
  'vue/valid-v-slot': ['error', { allowModifiers: true }],
});
