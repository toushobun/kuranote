import{i as e}from"./preload-helper-D2yxXLVK.js";import{n as t,t as n}from"./TransactionLinkCandidatePanel-tmQeUX2R.js";var r,i,a,o,s;e((()=>{t(),r={groupBy:`month`,groups:[],initialDateGroupsByGroupId:{},initialExpandedGroupId:null,initialNextItemOffsetByGroupId:{},nextOffset:null},i={title:`Organisms/Transactions/TransactionLinkCandidatePanel`,component:n,args:{accountCurrency:`JPY`,amount:``,kind:`refund`,loadInitialViewAction:async()=>r,onAmountChange:()=>void 0,onChange:()=>void 0,value:null}},a={name:`退款 · 待选原支出`},o={name:`报销 · 已选原支出`,args:{kind:`reimbursement`,amount:`1200`,value:{id:`item-1`,accountCurrency:`JPY`,amount:`3000`,categoryName:`交通费`,parentCategoryName:`交通`,refundedAmount:`500`,remainingRefundableAmount:`2500`,transactionAt:`2026-11-01T09:00:00Z`,transactionRecordId:`record-1`}}},a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  name: "退款 · 待选原支出"
}`,...a.parameters?.docs?.source}}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  name: "报销 · 已选原支出",
  args: {
    kind: "reimbursement",
    amount: "1200",
    value: {
      id: "item-1",
      accountCurrency: "JPY",
      amount: "3000",
      categoryName: "交通费",
      parentCategoryName: "交通",
      refundedAmount: "500",
      remainingRefundableAmount: "2500",
      transactionAt: "2026-11-01T09:00:00Z",
      transactionRecordId: "record-1"
    }
  }
}`,...o.parameters?.docs?.source}}},s=[`Refund`,`Reimbursement`]}))();export{a as Refund,o as Reimbursement,s as __namedExportsOrder,i as default};