import{i as e}from"./preload-helper-D2yxXLVK.js";import{n as t,r as n,t as r}from"./transactionItemsStep-re3qeqfb.js";import{n as i,t as a}from"./TransactionStepItemsCard-DsowFSDg.js";var o,s,c,l,u;e((()=>{t(),i(),o={title:`Organisms/Transactions/TransactionStepItemsCard`,component:a,args:{items:r.map((e,t)=>({...e,id:t+1,category:n.categoryOptions.find(t=>t.id===e.categoryId)})),automaticItemIds:[],currency:`JPY`,expenseTotal:1e4,incomeTotal:0,hasCategoryOptions:!0,onAdd:()=>{},onEdit:()=>{},onAmount:()=>{},onRemove:()=>{}}},s={name:`明细与合计`},c={name:`空卡片`,args:{items:[]}},l={name:`自动标签`,args:{automaticItemIds:[1,2]}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  name: "明细与合计"
}`,...s.parameters?.docs?.source}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  name: "空卡片",
  args: {
    items: []
  }
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  name: "自动标签",
  args: {
    automaticItemIds: [1, 2]
  }
}`,...l.parameters?.docs?.source}}},u=[`Filled`,`Empty`,`Automatic`]}))();export{l as Automatic,c as Empty,s as Filled,u as __namedExportsOrder,o as default};