import{i as e}from"./preload-helper-D2yxXLVK.js";import{n as t,t as n}from"./TransactionLinkCandidateCards-DQYuBUPQ.js";import{n as r,s as i,t as a}from"./transactionLinkCandidateFixtures-agSwjIEl.js";var o,s,c,l,u,d;e((()=>{t(),r(),o={title:`Organisms/Transactions/TransactionLinkCandidateCards`,component:n,args:{candidates:a,selectedId:a[0].id,selectableCurrency:`JPY`,onSelect:()=>void 0}},s={name:`单选候选卡片`},c={name:`币种不同不可选`,args:{selectableCurrency:`USD`}},l={name:`多商家 · 同名支出可区分`,args:{candidates:i}},u={name:`单一商家 · 不重复商家名`,args:{showMerchantName:!1}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  name: "单选候选卡片"
}`,...s.parameters?.docs?.source}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  name: "币种不同不可选",
  args: {
    selectableCurrency: "USD"
  }
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  name: "多商家 · 同名支出可区分",
  args: {
    candidates: mixedMerchantItems
  }
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  name: "单一商家 · 不重复商家名",
  args: {
    showMerchantName: false
  }
}`,...u.parameters?.docs?.source}}},d=[`Default`,`CurrencyDisabled`,`MixedMerchants`,`SingleMerchant`]}))();export{c as CurrencyDisabled,s as Default,l as MixedMerchants,u as SingleMerchant,d as __namedExportsOrder,o as default};