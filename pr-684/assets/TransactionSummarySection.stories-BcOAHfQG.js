import{i as e}from"./preload-helper-D2yxXLVK.js";import{n as t,t as n}from"./TransactionSummarySection-BrVHXeDP.js";var r,i,a,o,s;e((()=>{t(),r={title:`Organisms/Transactions/TransactionSummarySection`,component:n,args:{itemSummaries:[{amount:`500`,category:{id:`category-lunch`,name:`午餐`,parentId:`category-food`,parentName:`餐饮`,type:`expense`},categoryId:`category-lunch`,id:1}],selectedAccount:{currency:`JPY`,id:`account-cash`,name:`现金`},selectedMerchant:{icon_url:null,id:`merchant-store`,name:`便利店`},signedTotalAmount:`-500`,transactionDate:`2026-08-14`,transactionTime:`12:30:00`}},i={name:`普通支出`},a={name:`部分抵消`,args:{businessTotalAmount:`-300`,itemSummaries:[{...r.args.itemSummaries[0],businessNetAmount:`300`}]}},o={name:`完全抵消`,args:{businessTotalAmount:`0`,itemSummaries:[{...r.args.itemSummaries[0],businessNetAmount:`0`,specialStatus:`reimbursed`}]}},i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  name: "普通支出"
}`,...i.parameters?.docs?.source}}},a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  name: "部分抵消",
  args: {
    businessTotalAmount: "-300",
    itemSummaries: [{
      ...meta.args.itemSummaries[0],
      businessNetAmount: "300"
    }]
  }
}`,...a.parameters?.docs?.source}}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  name: "完全抵消",
  args: {
    businessTotalAmount: "0",
    itemSummaries: [{
      ...meta.args.itemSummaries[0],
      businessNetAmount: "0",
      specialStatus: "reimbursed"
    }]
  }
}`,...o.parameters?.docs?.source}}},s=[`Default`,`PartiallyOffset`,`FullyOffset`]}))();export{i as Default,o as FullyOffset,a as PartiallyOffset,s as __namedExportsOrder,r as default};