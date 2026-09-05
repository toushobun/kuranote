import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{d as r,t as i}from"./transaction-BNLpSnjO.js";import{n as a,t as o}from"./TransactionItemsSection-CDOZtu8t.js";var s,c,l,u,d,f,p,m,h,g,_;t((()=>{s=e(n()),i(),a(),c=r.map((e,t)=>({amount:String((t+1)*500),category:{id:`category-${t}`,name:[`午餐`,`衣服`,`交通费`,`日用品`,`公司聚餐`][t],parentId:`category-group-${t}`,parentName:[`餐饮`,`购物`,`交通`,`生活`,`社交`][t],type:`expense`},categoryId:`category-${t}`,id:t+1,specialStatus:e})),l={title:`Organisms/Transactions/TransactionItemsSection`,component:o,args:{hasCategoryOptions:!0,itemsFieldRef:(0,s.createRef)(),itemSummaries:c,onOpenItem:()=>void 0,onOpenSheet:()=>void 0,onUpdateItem:()=>void 0,selectedAccountCurrency:`JPY`,selectedType:`expense`,signedTotalAmount:`-7500`}},u={name:`全部特殊状态`},d={name:`无徽标`,args:{itemSummaries:c.slice(0,1).map(e=>({...e,specialStatus:null})),signedTotalAmount:`-500`}},f={name:`部分抵消支出`,args:{businessTotalAmount:`-300`,itemSummaries:[{...c[0],amount:`500`,businessNetAmount:`300`,refundedAmount:`200`}],signedTotalAmount:`-500`}},p={name:`完全抵消支出`,args:{businessTotalAmount:`0`,itemSummaries:[{...c[0],amount:`500`,businessNetAmount:`0`,specialStatus:`reimbursed`}],signedTotalAmount:`-500`}},m={name:`退款收入`,args:{businessTotalAmount:`0`,itemSummaries:[{...c[0],amount:`200`,businessNetAmount:`0`,businessStatus:{incomeLinkRole:`refund`,offsetComposition:{refundAmount:`0`,reimbursementAmount:`0`},settlementStatus:null},category:{...c[0].category,type:`income`}}],selectedType:`income`,signedTotalAmount:`+200`}},h={name:`报销收入`,args:{businessTotalAmount:`0`,itemSummaries:[{...c[0],amount:`500`,businessNetAmount:`0`,businessStatus:{incomeLinkRole:`reimbursement`,offsetComposition:{refundAmount:`0`,reimbursementAmount:`0`},settlementStatus:null},category:{...c[0].category,type:`income`}}],selectedType:`income`,signedTotalAmount:`+500`}},g={name:`空状态`,args:{itemSummaries:[],signedTotalAmount:`未填写金额`}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  name: "全部特殊状态"
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  name: "无徽标",
  args: {
    itemSummaries: itemSummaries.slice(0, 1).map(item => ({
      ...item,
      specialStatus: null
    })),
    signedTotalAmount: "-500"
  }
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "部分抵消支出",
  args: {
    businessTotalAmount: "-300",
    itemSummaries: [{
      ...itemSummaries[0],
      amount: "500",
      businessNetAmount: "300",
      refundedAmount: "200"
    }],
    signedTotalAmount: "-500"
  }
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: "完全抵消支出",
  args: {
    businessTotalAmount: "0",
    itemSummaries: [{
      ...itemSummaries[0],
      amount: "500",
      businessNetAmount: "0",
      specialStatus: "reimbursed"
    }],
    signedTotalAmount: "-500"
  }
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: "退款收入",
  args: {
    businessTotalAmount: "0",
    itemSummaries: [{
      ...itemSummaries[0],
      amount: "200",
      businessNetAmount: "0",
      businessStatus: {
        incomeLinkRole: "refund",
        offsetComposition: {
          refundAmount: "0",
          reimbursementAmount: "0"
        },
        settlementStatus: null
      },
      category: {
        ...itemSummaries[0].category!,
        type: "income"
      }
    }],
    selectedType: "income",
    signedTotalAmount: "+200"
  }
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: "报销收入",
  args: {
    businessTotalAmount: "0",
    itemSummaries: [{
      ...itemSummaries[0],
      amount: "500",
      businessNetAmount: "0",
      businessStatus: {
        incomeLinkRole: "reimbursement",
        offsetComposition: {
          refundAmount: "0",
          reimbursementAmount: "0"
        },
        settlementStatus: null
      },
      category: {
        ...itemSummaries[0].category!,
        type: "income"
      }
    }],
    selectedType: "income",
    signedTotalAmount: "+500"
  }
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "空状态",
  args: {
    itemSummaries: [],
    signedTotalAmount: "未填写金额"
  }
}`,...g.parameters?.docs?.source}}},_=[`AllStatuses`,`NoStatus`,`PartiallyOffsetExpense`,`FullyOffsetExpense`,`RefundIncome`,`ReimbursementIncome`,`Empty`]}))();export{u as AllStatuses,g as Empty,p as FullyOffsetExpense,d as NoStatus,f as PartiallyOffsetExpense,m as RefundIncome,h as ReimbursementIncome,_ as __namedExportsOrder,l as default};