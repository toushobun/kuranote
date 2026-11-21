import{i as e}from"./preload-helper-D2yxXLVK.js";import{n as t,t as n}from"./ExchangeRateTotalsNote-tnthW4sY.js";var r,i,a,o,s;e((()=>{t(),r={component:n,title:`Molecules/Transactions/ExchangeRateTotalsNote`},i={name:`已换算外币`,args:{hasForeignCurrency:!0}},a={name:`缺少汇率`,args:{hasForeignCurrency:!0,missingRateCount:2,align:`right`}},o={name:`无外币时不显示`,args:{hasForeignCurrency:!1,missingRateCount:0}},i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  name: "已换算外币",
  args: {
    hasForeignCurrency: true
  }
}`,...i.parameters?.docs?.source}}},a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  name: "缺少汇率",
  args: {
    hasForeignCurrency: true,
    missingRateCount: 2,
    align: "right"
  }
}`,...a.parameters?.docs?.source}}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  name: "无外币时不显示",
  args: {
    hasForeignCurrency: false,
    missingRateCount: 0
  }
}`,...o.parameters?.docs?.source}}},s=[`Converted`,`MissingRates`,`NoForeign`]}))();export{i as Converted,a as MissingRates,o as NoForeign,s as __namedExportsOrder,r as default};