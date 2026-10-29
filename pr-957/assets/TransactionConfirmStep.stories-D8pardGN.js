import{i as e}from"./preload-helper-D2yxXLVK.js";import{i as t,r as n}from"./AccountStep-1TnSRSLm.js";import{n as r,r as i}from"./transactionStepFlow-8icpKE4Y.js";import{n as a,t as o}from"./TransactionStepFlow-p4hyxLvc.js";import{a as s,i as c,n as l,r as u,t as d}from"./transactionReceipt-ODJ7qLUx.js";function f(e,t){return p.click(m(e.ownerDocument.body).getByRole(`button`,{name:t}))}var p,m,h,g,_,v,y,b,x,S,C,w,T,E,D,O,k;e((()=>{a(),n(),i(),d(),{userEvent:p,within:m}=__STORYBOOK_MODULE_TEST__,h={title:`Organisms/Transactions/TransactionConfirmStep`,component:o,decorators:t,args:{...r,...l},parameters:{viewport:{defaultViewport:`mobile2`}}},g={name:`快速路线：自动明细待输入（设计图 8 ②）`,args:{initialAccountId:void 0,suggestionsMerchantId:`seven`,suggestions:{...c,recommendedAccountIds:[`paypay`]},itemsOptions:u}},_={name:`第一次去的商家：选择收支账户（设计图 8 ③）`,args:{initialMerchantId:`coffee`,initialAccountId:void 0,suggestionsMerchantId:`coffee`,suggestions:{automaticCategoryIds:[],quickAmounts:[],recommendedAccountIds:[]},itemsOptions:u}},v={name:`多账户已对上（设计图 8 ④）`,args:{initialMerchantId:`life`,itemsOptions:{...u,initialItems:[{categoryId:`lunch`,amount:`8000`},{categoryId:`storage`,amount:`2000`}],initialPayments:s}}},y={name:`多账户未对上（差额、禁用保存）`,args:{...v.args,itemsOptions:{...u,initialItems:[{categoryId:`lunch`,amount:`8000`},{categoryId:`storage`,amount:`1500`}],initialPayments:s}}},b={name:`单账户（已填金额、空备注）`},x={name:`明细标签（自动以外的待报销）`,args:{itemsOptions:{...u,initialItems:[{categoryId:`lunch`,amount:`1200`,specialStatus:`pendingReimbursement`},{categoryId:`points`,amount:`100`}]}}},S={name:`支付行铅笔：账户选择抽屉`,play:({canvasElement:e})=>f(e,`更换支付账户 1`)},C={name:`多账户：点金额打开金额键盘`,args:y.args,play:({canvasElement:e})=>f(e,/^修改支付账户 2 金额：/)},w={name:`编辑备注`,play:async({canvasElement:e})=>{await f(e,/^修改备注：/),await p.type(m(e.ownerDocument.body).getByRole(`textbox`,{name:`备注`}),`和同事一起吃的午饭`)}},T={name:`编辑时间（日期展开、时刻保留秒）`,play:({canvasElement:e})=>f(e,/^修改时间：/)},E={name:`保存失败`,args:{action:async()=>({error:`保存失败，请稍后重试。`})},play:({canvasElement:e})=>f(e,`保存记账`)},D={name:`保存中`,args:{action:async()=>new Promise(()=>{})},play:E.play},O={name:`小票关闭时确认`,play:({canvasElement:e})=>f(e,`关闭记账`)},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "快速路线：自动明细待输入（设计图 8 ②）",
  args: {
    initialAccountId: undefined,
    suggestionsMerchantId: "seven",
    suggestions: {
      ...receiptSuggestions,
      recommendedAccountIds: ["paypay"]
    },
    itemsOptions: receiptItemsOptions
  }
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "第一次去的商家：选择收支账户（设计图 8 ③）",
  args: {
    initialMerchantId: "coffee",
    initialAccountId: undefined,
    suggestionsMerchantId: "coffee",
    suggestions: {
      automaticCategoryIds: [],
      quickAmounts: [],
      recommendedAccountIds: []
    },
    itemsOptions: receiptItemsOptions
  }
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "多账户已对上（设计图 8 ④）",
  args: {
    initialMerchantId: "life",
    itemsOptions: {
      ...receiptItemsOptions,
      initialItems: [{
        categoryId: "lunch",
        amount: "8000"
      }, {
        categoryId: "storage",
        amount: "2000"
      }],
      initialPayments: twoPayments
    }
  }
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  name: "多账户未对上（差额、禁用保存）",
  args: {
    ...MultiAccountBalanced.args,
    itemsOptions: {
      ...receiptItemsOptions,
      initialItems: [{
        categoryId: "lunch",
        amount: "8000"
      }, {
        categoryId: "storage",
        amount: "1500"
      }],
      initialPayments: twoPayments
    }
  }
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "单账户（已填金额、空备注）"
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  name: "明细标签（自动以外的待报销）",
  args: {
    itemsOptions: {
      ...receiptItemsOptions,
      initialItems: [{
        categoryId: "lunch",
        amount: "1200",
        specialStatus: "pendingReimbursement"
      }, {
        categoryId: "points",
        amount: "100"
      }]
    }
  }
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  name: "支付行铅笔：账户选择抽屉",
  play: ({
    canvasElement
  }) => clickButton(canvasElement, "更换支付账户 1")
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  name: "多账户：点金额打开金额键盘",
  args: MultiAccountUnbalanced.args,
  play: ({
    canvasElement
  }) => clickButton(canvasElement, /^修改支付账户 2 金额：/)
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  name: "编辑备注",
  play: async ({
    canvasElement
  }) => {
    await clickButton(canvasElement, /^修改备注：/);
    await userEvent.type(within(canvasElement.ownerDocument.body).getByRole("textbox", {
      name: "备注"
    }), "和同事一起吃的午饭");
  }
}`,...w.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  name: "编辑时间（日期展开、时刻保留秒）",
  play: ({
    canvasElement
  }) => clickButton(canvasElement, /^修改时间：/)
}`,...T.parameters?.docs?.source}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  name: "保存失败",
  args: {
    action: async () => ({
      error: "保存失败，请稍后重试。"
    })
  },
  play: ({
    canvasElement
  }) => clickButton(canvasElement, "保存记账")
}`,...E.parameters?.docs?.source}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  name: "保存中",
  args: {
    action: async () => new Promise(() => {})
  },
  play: SaveError.play
}`,...D.parameters?.docs?.source}}},O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
  name: "小票关闭时确认",
  play: ({
    canvasElement
  }) => clickButton(canvasElement, "关闭记账")
}`,...O.parameters?.docs?.source}}},k=[`QuickEntry`,`FirstVisit`,`MultiAccountBalanced`,`MultiAccountUnbalanced`,`SingleAccount`,`ItemTags`,`AccountPicker`,`PaymentAmountKeypad`,`NoteEditor`,`TimeEditor`,`SaveError`,`Saving`,`Abandon`]}))();export{O as Abandon,S as AccountPicker,_ as FirstVisit,x as ItemTags,v as MultiAccountBalanced,y as MultiAccountUnbalanced,w as NoteEditor,C as PaymentAmountKeypad,g as QuickEntry,E as SaveError,D as Saving,b as SingleAccount,T as TimeEditor,k as __namedExportsOrder,h as default};