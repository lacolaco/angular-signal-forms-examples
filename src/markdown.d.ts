// `*.md` ファイルを文字列として import するための型宣言。
// 実体は angular.json の `loader: { ".md": "text" }` 設定によって
// esbuild がビルド時に文字列として埋め込む。
declare module '*.md' {
  const content: string;
  export default content;
}
