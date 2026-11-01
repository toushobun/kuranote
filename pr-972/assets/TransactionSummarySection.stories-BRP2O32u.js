import{i as e}from"./preload-helper-D2yxXLVK.js";import{n as t,t as n}from"./TransactionSummarySection-DW4ofYLp.js";var r,i,a,o,s,c;e((()=>{t(),r={title:`Organisms/Transactions/TransactionSummarySection`,component:n,args:{itemSummaries:[{amount:`500`,category:{id:`category-lunch`,name:`午餐`,parentId:`category-food`,parentName:`餐饮`,type:`expense`},categoryId:`category-lunch`,id:1}],selectedAccount:{currency:`JPY`,id:`account-cash`,name:`现金`},selectedMerchant:{icon_url:null,id:`merchant-store`,name:`便利店`},signedTotalAmount:`-500`,transactionDate:`2026-08-14`,transactionTime:`12:30:00`}},i={name:`普通支出`},a={name:`多账户付款`,args:{paymentAccountCount:2}},o={name:`部分抵消`,args:{businessTotalAmount:`-300`,itemSummaries:[{...r.args.itemSummaries[0],businessNetAmount:`300`}]}},s={name:`完全抵消`,args:{businessTotalAmount:`0`,itemSummaries:[{...r.args.itemSummaries[0],businessNetAmount:`0`,specialStatus:`reimbursed`}]}},i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  name: "普通支出"
}`,...i.parameters?.docs?.source}}},a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  name: "多账户付款",
  args: {
    paymentAccountCount: 2
  }
}`,...a.parameters?.docs?.source}}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  name: "部分抵消",
  args: {
    businessTotalAmount: "-300",
    itemSummaries: [{
      ...meta.args.itemSummaries[0],
      businessNetAmount: "300"
    }]
  }
}`,...o.parameters?.docs?.source}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  name: "完全抵消",
  args: {
    businessTotalAmount: "0",
    itemSummaries: [{
      ...meta.args.itemSummaries[0],
      businessNetAmount: "0",
      specialStatus: "reimbursed"
    }]
  }
}`,...s.parameters?.docs?.source}}},c=[`Default`,`MultiAccount`,`PartiallyOffset`,`FullyOffset`]}))();export{i as Default,s as FullyOffset,a as MultiAccount,o as PartiallyOffset,c as __namedExportsOrder,r as default};