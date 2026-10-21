// 新项目：type: 中文说明 或 type(scope): 中文说明；scope 可选。
const hanCount = (value) => (value.match(/\p{Script=Han}/gu) ?? []).length;
const scopePattern = /^[a-z][a-z0-9-]*$/;

export default {
  rules: {
    'type-enum': [
      2,
      'always',
      ['build', 'chore', 'ci', 'docs', 'feat', 'fix', 'perf', 'refactor', 'revert', 'style', 'test'],
    ],
    'type-empty': [2, 'never'],
    'scope-format': [2, 'always'],
    'subject-empty': [2, 'never'],
    'subject-chinese': [2, 'always'],
    'header-max-length': [2, 'always', 100],
    'body-leading-blank': [2, 'always'],
    'footer-leading-blank': [2, 'always'],
  },
  plugins: [
    {
      rules: {
        'scope-format': ({ scope }) => [
          !scope || scopePattern.test(scope),
          'scope 可以省略；填写时应使用小写英文、数字与连字符',
        ],
        'subject-chinese': ({ subject }) => [
          hanCount(subject ?? '') >= 2,
          '提交说明至少包含两个汉字，例如 feat: 添加动词活用规则',
        ],
      },
    },
  ],
};
