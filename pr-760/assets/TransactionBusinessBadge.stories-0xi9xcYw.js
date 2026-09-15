import{i as e}from"./preload-helper-D2yxXLVK.js";import{n as t,t as n}from"./TransactionBusinessBadge-C9ylrOkp.js";var r,i,a,o,s,c,l,u,d;e((()=>{t(),r={title:`Atoms/TransactionBusinessBadge`,component:n,args:{currency:`JPY`,status:{incomeLinkRole:null,offsetComposition:{refundAmount:`400`,reimbursementAmount:`600`},settlementStatus:`reimbursed`}}},i={name:`已结清且同时包含退款与报销核销`},a={name:`核销超过原支出后倒赚`,args:{status:{incomeLinkRole:null,offsetComposition:{refundAmount:`400`,reimbursementAmount:`1600`},settlementStatus:`reimbursementSurplus`}}},o={name:`待报销且同时包含退款与报销核销`,args:{status:{incomeLinkRole:null,offsetComposition:{refundAmount:`400`,reimbursementAmount:`300`},settlementStatus:`pendingReimbursement`}}},s={name:`普通支出仅展示退款核销来源`,args:{status:{incomeLinkRole:null,offsetComposition:{refundAmount:`1000`,reimbursementAmount:`0`},settlementStatus:null}}},c={name:`仅报销结清`,args:{status:{incomeLinkRole:null,offsetComposition:{refundAmount:`0`,reimbursementAmount:`1000`},settlementStatus:`reimbursed`}}},l={name:`仅退款结清`,args:{status:{incomeLinkRole:null,offsetComposition:{refundAmount:`1000`,reimbursementAmount:`0`},settlementStatus:`reimbursed`}}},u={name:`退款收入来源`,args:{status:{incomeLinkRole:`refund`,offsetComposition:{refundAmount:`0`,reimbursementAmount:`0`},settlementStatus:null}}},i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  name: "已结清且同时包含退款与报销核销"
}`,...i.parameters?.docs?.source}}},a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  name: "核销超过原支出后倒赚",
  args: {
    status: {
      incomeLinkRole: null,
      offsetComposition: {
        refundAmount: "400",
        reimbursementAmount: "1600"
      },
      settlementStatus: "reimbursementSurplus"
    }
  }
}`,...a.parameters?.docs?.source}}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  name: "待报销且同时包含退款与报销核销",
  args: {
    status: {
      incomeLinkRole: null,
      offsetComposition: {
        refundAmount: "400",
        reimbursementAmount: "300"
      },
      settlementStatus: "pendingReimbursement"
    }
  }
}`,...o.parameters?.docs?.source}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  name: "普通支出仅展示退款核销来源",
  args: {
    status: {
      incomeLinkRole: null,
      offsetComposition: {
        refundAmount: "1000",
        reimbursementAmount: "0"
      },
      settlementStatus: null
    }
  }
}`,...s.parameters?.docs?.source}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  name: "仅报销结清",
  args: {
    status: {
      incomeLinkRole: null,
      offsetComposition: {
        refundAmount: "0",
        reimbursementAmount: "1000"
      },
      settlementStatus: "reimbursed"
    }
  }
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  name: "仅退款结清",
  args: {
    status: {
      incomeLinkRole: null,
      offsetComposition: {
        refundAmount: "1000",
        reimbursementAmount: "0"
      },
      settlementStatus: "reimbursed"
    }
  }
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  name: "退款收入来源",
  args: {
    status: {
      incomeLinkRole: "refund",
      offsetComposition: {
        refundAmount: "0",
        reimbursementAmount: "0"
      },
      settlementStatus: null
    }
  }
}`,...u.parameters?.docs?.source}}},d=[`MixedOffsetCompleted`,`ReimbursementSurplus`,`MixedOffsetPending`,`OrdinaryRefundedExpense`,`ReimbursedOnly`,`RefundedOnly`,`RefundIncome`]}))();export{i as MixedOffsetCompleted,o as MixedOffsetPending,s as OrdinaryRefundedExpense,u as RefundIncome,l as RefundedOnly,c as ReimbursedOnly,a as ReimbursementSurplus,d as __namedExportsOrder,r as default};