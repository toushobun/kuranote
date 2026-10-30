import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{h as r,t as i}from"./transaction-uDwIDRHz.js";import{n as a,t as o}from"./TransactionItemsSection-Dj4VmTgo.js";var s,c,l,u,d,f,p,m,h,g,_,v,y;t((()=>{s=e(n()),i(),a(),{expect:c,within:l}=__STORYBOOK_MODULE_TEST__,u=r.map((e,t)=>({amount:String((t+1)*500),category:{id:`category-${t}`,name:[`午餐`,`衣服`,`交通费`,`日用品`,`公司聚餐`][t],parentId:`category-group-${t}`,parentName:[`餐饮`,`购物`,`交通`,`生活`,`社交`][t],type:`expense`},categoryId:`category-${t}`,id:t+1,specialStatus:e})),d={title:`Organisms/Transactions/TransactionItemsSection`,component:o,args:{hasCategoryOptions:!0,itemsFieldRef:(0,s.createRef)(),itemSummaries:u,onOpenItem:()=>void 0,onOpenSheet:()=>void 0,onUpdateItem:()=>void 0,selectedAccountCurrency:`JPY`,selectedType:`expense`,signedTotalAmount:`-7500`}},f={name:`全部特殊状态`},p={name:`无徽标`,args:{itemSummaries:u.slice(0,1).map(e=>({...e,specialStatus:null})),signedTotalAmount:`-500`}},m={name:`部分抵消支出`,args:{businessTotalAmount:`-300`,itemSummaries:[{...u[0],amount:`500`,businessNetAmount:`300`,refundedAmount:`200`}],signedTotalAmount:`-500`}},h={name:`完全抵消支出`,args:{businessTotalAmount:`0`,itemSummaries:[{...u[0],amount:`500`,businessNetAmount:`0`,specialStatus:`reimbursed`}],signedTotalAmount:`-500`}},g={name:`退款收入`,args:{businessTotalAmount:`0`,itemSummaries:[{...u[0],amount:`200`,businessNetAmount:`0`,businessStatus:{incomeLinkRole:`refund`,offsetComposition:{refundAmount:`0`,reimbursementAmount:`0`},settlementStatus:null},category:{...u[0].category,type:`income`}}],selectedType:`income`,signedTotalAmount:`+200`},play:async({canvasElement:e})=>{await c(l(e).getByText(`收支明细（1）`)).toBeVisible()}},_={name:`报销收入`,args:{businessTotalAmount:`0`,itemSummaries:[{...u[0],amount:`500`,businessNetAmount:`0`,businessStatus:{incomeLinkRole:`reimbursement`,offsetComposition:{refundAmount:`0`,reimbursementAmount:`0`},settlementStatus:null},category:{...u[0].category,type:`income`}}],selectedType:`income`,signedTotalAmount:`+500`}},v={name:`空状态`,args:{itemSummaries:[],signedTotalAmount:`未填写金额`}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "全部特殊状态"
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: "无徽标",
  args: {
    itemSummaries: itemSummaries.slice(0, 1).map(item => ({
      ...item,
      specialStatus: null
    })),
    signedTotalAmount: "-500"
  }
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
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
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
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
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
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
  },
  play: async ({
    canvasElement
  }) => {
    await expect(within(canvasElement).getByText("收支明细（1）")).toBeVisible();
  }
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
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
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "空状态",
  args: {
    itemSummaries: [],
    signedTotalAmount: "未填写金额"
  }
}`,...v.parameters?.docs?.source}}},y=[`AllStatuses`,`NoStatus`,`PartiallyOffsetExpense`,`FullyOffsetExpense`,`RefundIncome`,`ReimbursementIncome`,`Empty`]}))();export{f as AllStatuses,v as Empty,h as FullyOffsetExpense,p as NoStatus,m as PartiallyOffsetExpense,g as RefundIncome,_ as ReimbursementIncome,y as __namedExportsOrder,d as default};