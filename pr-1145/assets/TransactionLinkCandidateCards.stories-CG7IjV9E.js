import{i as e}from"./preload-helper-D2yxXLVK.js";import{n as t,t as n}from"./TransactionLinkCandidateCards-rwnKRQNQ.js";import{n as r,s as i,t as a}from"./transactionLinkCandidateFixtures-BrlVuSyZ.js";var o,s,c,l,u,d,f,p,m,h;e((()=>{t(),r(),o={title:`Organisms/Transactions/TransactionLinkCandidateCards`,component:n,args:{candidates:a,selectedId:a[0].id,selectableCurrency:`JPY`,onSelect:()=>void 0}},s={name:`单选候选卡片`},c={name:`币种不同不可选`,args:{selectableCurrency:`USD`}},l={name:`多商家 · 同名支出可区分`,args:{candidates:i}},u={name:`单一商家 · 不重复商家名`,args:{showMerchantName:!1}},d={name:`有备注 · 第三行单行展示`,args:{candidates:[a[0]]}},f={name:`无备注 · 维持原卡片高度`,args:{candidates:[a[1]]}},p={name:`长备注 · 单行省略`,args:{candidates:[{...a[0],note:`蓝牙音箱 JBL Flip 6 黑色，送朋友的生日礼物，请记得保存包装和购买小票`.repeat(3)}]}},m={name:`已在小票上 · 仍显示备注`,args:{candidates:[a[0]],selectedId:null,lockedAmounts:new Map([[a[0].id,`500`]])}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
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
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  name: "有备注 · 第三行单行展示",
  args: {
    candidates: [candidateItems[0]]
  }
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "无备注 · 维持原卡片高度",
  args: {
    candidates: [candidateItems[1]]
  }
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: "长备注 · 单行省略",
  args: {
    candidates: [{
      ...candidateItems[0],
      note: "蓝牙音箱 JBL Flip 6 黑色，送朋友的生日礼物，请记得保存包装和购买小票".repeat(3)
    }]
  }
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: "已在小票上 · 仍显示备注",
  args: {
    candidates: [candidateItems[0]],
    selectedId: null,
    lockedAmounts: new Map([[candidateItems[0].id, "500"]])
  }
}`,...m.parameters?.docs?.source}}},h=[`Default`,`CurrencyDisabled`,`MixedMerchants`,`SingleMerchant`,`WithNote`,`WithoutNote`,`LongNote`,`LockedWithNote`]}))();export{c as CurrencyDisabled,s as Default,m as LockedWithNote,p as LongNote,l as MixedMerchants,u as SingleMerchant,d as WithNote,f as WithoutNote,h as __namedExportsOrder,o as default};